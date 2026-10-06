from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.faculty import Faculty
from app.models.user import User, UserRole
from app.schemas.faculty import FacultyCreate, FacultyUpdate, FacultyResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("", response_model=List[FacultyResponse])
def get_faculty_members(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Faculty)
    if search:
        query = query.filter(
            or_(
                Faculty.employee_id.ilike(f"%{search}%"),
                Faculty.name.ilike(f"%{search}%"),
                Faculty.email.ilike(f"%{search}%"),
            )
        )
    if department_id:
        query = query.filter(Faculty.department_id == department_id)

    return query.offset(skip).limit(limit).all()


@router.post("", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def create_faculty(
    faculty_in: FacultyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    if db.query(Faculty).filter(Faculty.employee_id == faculty_in.employee_id).first():
        raise HTTPException(status_code=400, detail=f"Employee ID '{faculty_in.employee_id}' already exists.")
    if db.query(Faculty).filter(Faculty.email == faculty_in.email).first():
        raise HTTPException(status_code=400, detail=f"Faculty email '{faculty_in.email}' already exists.")

    faculty = Faculty(**faculty_in.model_dump())
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.get("/{id}", response_model=FacultyResponse)
def get_faculty(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    faculty = db.query(Faculty).filter(Faculty.id == id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    return faculty


@router.put("/{id}", response_model=FacultyResponse)
def update_faculty(
    id: str,
    faculty_in: FacultyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    faculty = db.query(Faculty).filter(Faculty.id == id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    update_data = faculty_in.model_dump(exclude_unset=True)
    if "employee_id" in update_data and update_data["employee_id"] != faculty.employee_id:
        if db.query(Faculty).filter(Faculty.employee_id == update_data["employee_id"]).first():
            raise HTTPException(status_code=400, detail=f"Employee ID '{update_data['employee_id']}' already exists.")
    if "email" in update_data and update_data["email"] != faculty.email:
        if db.query(Faculty).filter(Faculty.email == update_data["email"]).first():
            raise HTTPException(status_code=400, detail=f"Email '{update_data['email']}' already exists.")

    for field, value in update_data.items():
        setattr(faculty, field, value)

    db.commit()
    db.refresh(faculty)
    return faculty


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    faculty = db.query(Faculty).filter(Faculty.id == id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    db.delete(faculty)
    db.commit()
