from typing import Optional
from pydantic import BaseModel, ConfigDict


class SubjectCreate(BaseModel):
    subject_code: str
    subject_name: str
    department_id: Optional[str] = None
    program_id: Optional[str] = None
    semester_id: Optional[str] = None
    exam_duration_minutes: Optional[int] = 180
    exam_type: Optional[str] = "THEORY"
    is_active: Optional[bool] = True


class SubjectUpdate(BaseModel):
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    department_id: Optional[str] = None
    program_id: Optional[str] = None
    semester_id: Optional[str] = None
    exam_duration_minutes: Optional[int] = None
    exam_type: Optional[str] = None
    is_active: Optional[bool] = None


class SubjectResponse(BaseModel):
    id: str
    subject_code: str
    subject_name: str
    department_id: Optional[str] = None
    program_id: Optional[str] = None
    semester_id: Optional[str] = None
    exam_duration_minutes: int
    exam_type: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
