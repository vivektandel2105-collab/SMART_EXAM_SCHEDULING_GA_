from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.academic import Program
from app.models.user import User, UserRole
from app.schemas.academic import ProgramCreate, ProgramUpdate, ProgramResponse
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/programs", tags=["Programs"])


@router.get("", response_model=List[ProgramResponse])
def get_programs(
    department_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Program)
    if department_id:
        query = query.filter(Program.department_id == department_id)
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=ProgramResponse, status_code=status.HTTP_201_CREATED)
def create_program(
    program_in: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    if db.query(Program).filter(Program.code == program_in.code).first():
        raise HTTPException(status_code=400, detail=f"Program code '{program_in.code}' already exists.")
    program = Program(**program_in.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.get("/{id}", response_model=ProgramResponse)
def get_program(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(Program).filter(Program.id == id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.put("/{id}", response_model=ProgramResponse)
def update_program(
    id: str,
    program_in: ProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    program = db.query(Program).filter(Program.id == id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    update_data = program_in.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"] != program.code:
        if db.query(Program).filter(Program.code == update_data["code"]).first():
            raise HTTPException(status_code=400, detail=f"Program code '{update_data['code']}' already exists.")
            
    for field, value in update_data.items():
        setattr(program, field, value)
        
    db.commit()
    db.refresh(program)
    return program


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    program = db.query(Program).filter(Program.id == id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    db.delete(program)
    db.commit()
