import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_number = Column(String(50), unique=True, nullable=False, index=True)
    building = Column(String(100), nullable=False)
    floor = Column(Integer, default=1)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String(50), default="CLASSROOM")
    is_available = Column(Boolean, default=True)

    availabilities = relationship("RoomAvailability", back_populates="room", cascade="all, delete-orphan")
    exam_assignments = relationship("ExamAssignment", back_populates="room")
    invigilation_assignments = relationship("InvigilationAssignment", back_populates="room")

    def __repr__(self):
        return f"<Room {self.room_number} ({self.building}) Cap:{self.capacity}>"


class RoomAvailability(Base):
    __tablename__ = "room_availability"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(String(36), ForeignKey("exam_slots.id", ondelete="CASCADE"), nullable=False)
    is_available = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("room_id", "slot_id", name="uq_room_slot_availability"),
    )

    room = relationship("Room", back_populates="availabilities")
    slot = relationship("ExamSlot", back_populates="room_availabilities")

    def __repr__(self):
        return f"<RoomAvailability Room:{self.room_id} Slot:{self.slot_id} Avail:{self.is_available}>"
