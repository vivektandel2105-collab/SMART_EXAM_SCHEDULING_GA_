from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.student import Student, StudentSubject
from app.models.user import User, UserRole
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentSubjectCreate, StudentSubjectResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=List[StudentResponse])
def get_students(
    search: Optional[str] = None,
    program_id: Optional[str] = None,
    semester_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Student)
    if search:
        query = query.filter(
            or_(
                Student.roll_number.ilike(f"%{search}%"),
                Student.name.ilike(f"%{search}%"),
                Student.email.ilike(f"%{search}%"),
            )
        )
    if program_id:
        query = query.filter(Student.program_id == program_id)
    if semester_id:
        query = query.filter(Student.semester_id == semester_id)
        
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    if db.query(Student).filter(Student.roll_number == student_in.roll_number).first():
        raise HTTPException(status_code=400, detail=f"Roll number '{student_in.roll_number}' already exists.")
    if db.query(Student).filter(Student.email == student_in.email).first():
        raise HTTPException(status_code=400, detail=f"Student email '{student_in.email}' already exists.")

    student = Student(**student_in.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/{id}", response_model=StudentResponse)
def get_student(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.put("/{id}", response_model=StudentResponse)
def update_student(
    id: str,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = student_in.model_dump(exclude_unset=True)
    if "roll_number" in update_data and update_data["roll_number"] != student.roll_number:
        if db.query(Student).filter(Student.roll_number == update_data["roll_number"]).first():
            raise HTTPException(status_code=400, detail=f"Roll number '{update_data['roll_number']}' already exists.")
    if "email" in update_data and update_data["email"] != student.email:
        if db.query(Student).filter(Student.email == update_data["email"]).first():
            raise HTTPException(status_code=400, detail=f"Email '{update_data['email']}' already exists.")

    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()


@router.post("/enroll", response_model=StudentSubjectResponse, status_code=status.HTTP_201_CREATED)
def enroll_student_in_subject(
    enroll_in: StudentSubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    existing = db.query(StudentSubject).filter(
        StudentSubject.student_id == enroll_in.student_id,
        StudentSubject.subject_id == enroll_in.subject_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student is already enrolled in this subject.")

    enrollment = StudentSubject(**enroll_in.model_dump())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment
