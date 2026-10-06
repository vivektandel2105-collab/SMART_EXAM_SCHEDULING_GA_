from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


class StudentCreate(BaseModel):
    roll_number: str
    name: str
    email: EmailStr
    program_id: Optional[str] = None
    semester_id: Optional[str] = None
    division_id: Optional[str] = None
    status: Optional[str] = "ACTIVE"


class StudentUpdate(BaseModel):
    roll_number: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    program_id: Optional[str] = None
    semester_id: Optional[str] = None
    division_id: Optional[str] = None
    status: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    roll_number: str
    name: str
    email: EmailStr
    program_id: Optional[str] = None
    semester_id: Optional[str] = None
    division_id: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class StudentSubjectCreate(BaseModel):
    student_id: str
    subject_id: str


class StudentSubjectResponse(BaseModel):
    id: str
    student_id: str
    subject_id: str

    model_config = ConfigDict(from_attributes=True)
