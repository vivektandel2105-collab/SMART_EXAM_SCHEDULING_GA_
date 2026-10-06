from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.constraint import Constraint, ConstraintWeight
from app.models.user import User, UserRole
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/constraints", tags=["Constraints"])


class ConstraintResponse(BaseModel):
    id: str
    code: str
    name: str
    type: str
    is_enabled: bool
    description: Optional[str] = None
    weight: Optional[float] = 1.0


class ConstraintUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    description: Optional[str] = None
    weight: Optional[float] = None


@router.get("", response_model=List[ConstraintResponse])
def get_constraints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    constraints = db.query(Constraint).all()
    results = []
    for c in constraints:
        w_obj = db.query(ConstraintWeight).filter(ConstraintWeight.constraint_id == c.id).first()
        w_val = w_obj.weight if w_obj else 1.0
        results.append(
            ConstraintResponse(
                id=c.id,
                code=c.code,
                name=c.name,
                type=c.type,
                is_enabled=c.is_enabled,
                description=c.description,
                weight=w_val,
            )
        )
    return results


@router.put("/{id}", response_model=ConstraintResponse)
def update_constraint(
    id: str,
    c_in: ConstraintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    c = db.query(Constraint).filter(Constraint.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Constraint not found")

    if c_in.is_enabled is not None:
        c.is_enabled = c_in.is_enabled
    if c_in.description is not None:
        c.description = c_in.description

    if c_in.weight is not None:
        w_obj = db.query(ConstraintWeight).filter(ConstraintWeight.constraint_id == c.id).first()
        if not w_obj:
            w_obj = ConstraintWeight(constraint_id=c.id, weight=c_in.weight)
            db.add(w_obj)
        else:
            w_obj.weight = c_in.weight

    db.commit()
    db.refresh(c)

    w_obj = db.query(ConstraintWeight).filter(ConstraintWeight.constraint_id == c.id).first()
    w_val = w_obj.weight if w_obj else 1.0

    return ConstraintResponse(
        id=c.id,
        code=c.code,
        name=c.name,
        type=c.type,
        is_enabled=c.is_enabled,
        description=c.description,
        weight=w_val,
    )
