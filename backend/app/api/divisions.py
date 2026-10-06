from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.academic import Division
from app.models.user import User, UserRole
from app.schemas.academic import DivisionCreate, DivisionUpdate, DivisionResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/divisions", tags=["Divisions"])


@router.get("", response_model=List[DivisionResponse])
def get_divisions(
    semester_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Division)
    if semester_id:
        query = query.filter(Division.semester_id == semester_id)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=DivisionResponse, status_code=status.HTTP_201_CREATED)
def create_division(
    division_in: DivisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    division = Division(**division_in.model_dump())
    db.add(division)
    db.commit()
    db.refresh(division)
    return division


@router.get("/{id}", response_model=DivisionResponse)
def get_division(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    division = db.query(Division).filter(Division.id == id).first()
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    return division


@router.put("/{id}", response_model=DivisionResponse)
def update_division(
    id: str,
    division_in: DivisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    division = db.query(Division).filter(Division.id == id).first()
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    
    for field, value in division_in.model_dump(exclude_unset=True).items():
        setattr(division, field, value)
        
    db.commit()
    db.refresh(division)
    return division


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_division(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    division = db.query(Division).filter(Division.id == id).first()
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    db.delete(division)
    db.commit()
