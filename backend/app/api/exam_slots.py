from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.exam import ExamSlot
from app.models.user import User, UserRole
from app.schemas.exam_slot import ExamSlotCreate, ExamSlotUpdate, ExamSlotResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/exam-slots", tags=["Exam Slots"])


@router.get("", response_model=List[ExamSlotResponse])
def get_exam_slots(
    exam_date: Optional[date] = None,
    session_name: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ExamSlot)
    if exam_date:
        query = query.filter(ExamSlot.exam_date == exam_date)
    if session_name:
        query = query.filter(ExamSlot.session_name == session_name)

    return query.offset(skip).limit(limit).all()


@router.post("", response_model=ExamSlotResponse, status_code=status.HTTP_201_CREATED)
def create_exam_slot(
    slot_in: ExamSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    slot = ExamSlot(**slot_in.model_dump())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.get("/{id}", response_model=ExamSlotResponse)
def get_exam_slot(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slot = db.query(ExamSlot).filter(ExamSlot.id == id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Exam slot not found")
    return slot


@router.put("/{id}", response_model=ExamSlotResponse)
def update_exam_slot(
    id: str,
    slot_in: ExamSlotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    slot = db.query(ExamSlot).filter(ExamSlot.id == id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Exam slot not found")

    for field, value in slot_in.model_dump(exclude_unset=True).items():
        setattr(slot, field, value)

    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam_slot(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    slot = db.query(ExamSlot).filter(ExamSlot.id == id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Exam slot not found")
    db.delete(slot)
    db.commit()
