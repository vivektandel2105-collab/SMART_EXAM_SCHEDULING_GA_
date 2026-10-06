from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.subject import Subject
from app.models.user import User, UserRole
from app.schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.get("", response_model=List[SubjectResponse])
def get_subjects(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    program_id: Optional[str] = None,
    semester_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Subject)
    if search:
        query = query.filter(
            or_(
                Subject.subject_code.ilike(f"%{search}%"),
                Subject.subject_name.ilike(f"%{search}%"),
            )
        )
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if program_id:
        query = query.filter(Subject.program_id == program_id)
    if semester_id:
        query = query.filter(Subject.semester_id == semester_id)

    return query.offset(skip).limit(limit).all()


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject_in: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    if db.query(Subject).filter(Subject.subject_code == subject_in.subject_code).first():
        raise HTTPException(status_code=400, detail=f"Subject code '{subject_in.subject_code}' already exists.")

    subject = Subject(**subject_in.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{id}", response_model=SubjectResponse)
def get_subject(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.put("/{id}", response_model=SubjectResponse)
def update_subject(
    id: str,
    subject_in: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    update_data = subject_in.model_dump(exclude_unset=True)
    if "subject_code" in update_data and update_data["subject_code"] != subject.subject_code:
        if db.query(Subject).filter(Subject.subject_code == update_data["subject_code"]).first():
            raise HTTPException(status_code=400, detail=f"Subject code '{update_data['subject_code']}' already exists.")

    for field, value in update_data.items():
        setattr(subject, field, value)

    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    subject = db.query(Subject).filter(Subject.id == id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
