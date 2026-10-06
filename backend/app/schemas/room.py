from typing import Optional
from pydantic import BaseModel, ConfigDict


class RoomCreate(BaseModel):
    room_number: str
    building: str
    floor: Optional[int] = 1
    capacity: int
    room_type: Optional[str] = "CLASSROOM"
    is_available: Optional[bool] = True


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    room_type: Optional[str] = None
    is_available: Optional[bool] = None


class RoomResponse(BaseModel):
    id: str
    room_number: str
    building: str
    floor: int
    capacity: int
    room_type: str
    is_available: bool

    model_config = ConfigDict(from_attributes=True)
