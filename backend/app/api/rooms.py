from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.room import Room
from app.models.user import User, UserRole
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.get("", response_model=List[RoomResponse])
def get_rooms(
    building: Optional[str] = None,
    min_capacity: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Room)
    if search:
        query = query.filter(
            or_(
                Room.room_number.ilike(f"%{search}%"),
                Room.building.ilike(f"%{search}%"),
            )
        )
    if building:
        query = query.filter(Room.building == building)
    if min_capacity:
        query = query.filter(Room.capacity >= min_capacity)

    return query.offset(skip).limit(limit).all()


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    if db.query(Room).filter(Room.room_number == room_in.room_number).first():
        raise HTTPException(status_code=400, detail=f"Room number '{room_in.room_number}' already exists.")

    room = Room(**room_in.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.get("/{id}", response_model=RoomResponse)
def get_room(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.put("/{id}", response_model=RoomResponse)
def update_room(
    id: str,
    room_in: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    update_data = room_in.model_dump(exclude_unset=True)
    if "room_number" in update_data and update_data["room_number"] != room.room_number:
        if db.query(Room).filter(Room.room_number == update_data["room_number"]).first():
            raise HTTPException(status_code=400, detail=f"Room number '{update_data['room_number']}' already exists.")

    for field, value in update_data.items():
        setattr(room, field, value)

    db.commit()
    db.refresh(room)
    return room


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
