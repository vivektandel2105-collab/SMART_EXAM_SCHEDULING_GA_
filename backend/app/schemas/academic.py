from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# Department Schemas
class DepartmentCreate(BaseModel):
    code: str
    name: str


class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    code: str
    name: str

    model_config = ConfigDict(from_attributes=True)


# Program Schemas
class ProgramCreate(BaseModel):
    department_id: str
    code: str
    name: str


class ProgramUpdate(BaseModel):
    department_id: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None


class ProgramResponse(BaseModel):
    id: str
    department_id: str
    code: str
    name: str

    model_config = ConfigDict(from_attributes=True)


# Semester Schemas
class SemesterCreate(BaseModel):
    program_id: str
    number: int
    name: str


class SemesterUpdate(BaseModel):
    program_id: Optional[str] = None
    number: Optional[int] = None
    name: Optional[str] = None


class SemesterResponse(BaseModel):
    id: str
    program_id: str
    number: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# Division Schemas
class DivisionCreate(BaseModel):
    semester_id: str
    name: str


class DivisionUpdate(BaseModel):
    semester_id: Optional[str] = None
    name: Optional[str] = None


class DivisionResponse(BaseModel):
    id: str
    semester_id: str
    name: str

    model_config = ConfigDict(from_attributes=True)
