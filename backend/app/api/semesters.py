from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.academic import Semester
from app.models.user import User, UserRole
from app.schemas.academic import SemesterCreate, SemesterUpdate, SemesterResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/semesters", tags=["Semesters"])


@router.get("", response_model=List[SemesterResponse])
def get_semesters(
    program_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Semester)
    if program_id:
        query = query.filter(Semester.program_id == program_id)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
def create_semester(
    semester_in: SemesterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    semester = Semester(**semester_in.model_dump())
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return semester


@router.get("/{id}", response_model=SemesterResponse)
def get_semester(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    semester = db.query(Semester).filter(Semester.id == id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return semester


@router.put("/{id}", response_model=SemesterResponse)
def update_semester(
    id: str,
    semester_in: SemesterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    semester = db.query(Semester).filter(Semester.id == id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    for field, value in semester_in.model_dump(exclude_unset=True).items():
        setattr(semester, field, value)
        
    db.commit()
    db.refresh(semester)
    return semester


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_semester(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    semester = db.query(Semester).filter(Semester.id == id).first()
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    db.delete(semester)
    db.commit()
