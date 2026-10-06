import uuid
from sqlalchemy import Column, String, Integer, Date, Time, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class ExamSlot(Base):
    __tablename__ = "exam_slots"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    exam_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    session_name = Column(String(50), nullable=False)  # MORNING, AFTERNOON
    is_available = Column(Boolean, default=True)

    faculty_availabilities = relationship("FacultyAvailability", back_populates="slot", cascade="all, delete-orphan")
    room_availabilities = relationship("RoomAvailability", back_populates="slot", cascade="all, delete-orphan")
    exam_assignments = relationship("ExamAssignment", back_populates="slot")
    invigilation_assignments = relationship("InvigilationAssignment", back_populates="slot")

    def __repr__(self):
        return f"<ExamSlot {self.exam_date} {self.session_name} ({self.start_time}-{self.end_time})>"


class Exam(Base):
    __tablename__ = "exams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_duration_minutes = Column(Integer, default=180, nullable=False)
    status = Column(String(50), default="PENDING")

    subject = relationship("Subject", back_populates="exams")
    assignments = relationship("ExamAssignment", back_populates="exam", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Exam Subject:{self.subject_id} Dur:{self.exam_duration_minutes}m>"


class ExamAssignment(Base):
    __tablename__ = "exam_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_version_id = Column(String(36), ForeignKey("timetable_versions.id", ondelete="CASCADE"), nullable=False)
    exam_id = Column(String(36), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(String(36), ForeignKey("exam_slots.id", ondelete="SET NULL"), nullable=True)
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    is_locked = Column(Boolean, default=False)

    timetable_version = relationship("TimetableVersion", back_populates="assignments")
    exam = relationship("Exam", back_populates="assignments")
    slot = relationship("ExamSlot", back_populates="exam_assignments")
    room = relationship("Room", back_populates="exam_assignments")
    faculty = relationship("Faculty", back_populates="exam_assignments")

    def __repr__(self):
        return f"<ExamAssignment Exam:{self.exam_id} Slot:{self.slot_id} Room:{self.room_id} Locked:{self.is_locked}>"


class InvigilationAssignment(Base):
    __tablename__ = "invigilation_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_version_id = Column(String(36), ForeignKey("timetable_versions.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(String(36), ForeignKey("exam_slots.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(String(36), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)

    timetable_version = relationship("TimetableVersion", back_populates="invigilation_assignments")
    faculty = relationship("Faculty", back_populates="invigilation_assignments")
    slot = relationship("ExamSlot", back_populates="invigilation_assignments")
    room = relationship("Room", back_populates="invigilation_assignments")

    def __repr__(self):
        return f"<InvigilationAssignment Faculty:{self.faculty_id} Slot:{self.slot_id} Room:{self.room_id}>"
