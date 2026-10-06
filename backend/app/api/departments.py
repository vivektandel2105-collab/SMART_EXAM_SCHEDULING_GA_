from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.academic import Department
from app.models.user import User, UserRole
from app.schemas.academic import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=List[DepartmentResponse])
def get_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Department).offset(skip).limit(limit).all()


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    if db.query(Department).filter(Department.code == dept_in.code).first():
        raise HTTPException(status_code=400, detail=f"Department code '{dept_in.code}' already exists.")
    dept = Department(**dept_in.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/{id}", response_model=DepartmentResponse)
def get_department(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.put("/{id}", response_model=DepartmentResponse)
def update_department(
    id: str,
    dept_in: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    update_data = dept_in.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"] != dept.code:
        if db.query(Department).filter(Department.code == update_data["code"]).first():
            raise HTTPException(status_code=400, detail=f"Department code '{update_data['code']}' already exists.")
            
    for field, value in update_data.items():
        setattr(dept, field, value)
        
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
