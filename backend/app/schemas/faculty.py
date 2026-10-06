from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class FacultyCreate(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    department_id: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = True


class FacultyUpdate(BaseModel):
    employee_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None


class FacultyResponse(BaseModel):
    id: str
    employee_id: str
    name: str
    email: EmailStr
    department_id: Optional[str] = None
    designation: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
