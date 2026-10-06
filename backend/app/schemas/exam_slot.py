from datetime import date, time
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ExamSlotCreate(BaseModel):
    exam_date: date
    start_time: time
    end_time: time
    session_name: str  # MORNING, AFTERNOON
    is_available: Optional[bool] = True


class ExamSlotUpdate(BaseModel):
    exam_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    session_name: Optional[str] = None
    is_available: Optional[bool] = None


class ExamSlotResponse(BaseModel):
    id: str
    exam_date: date
    start_time: time
    end_time: time
    session_name: str
    is_available: bool

    model_config = ConfigDict(from_attributes=True)
