import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="faculty_members")
    availabilities = relationship("FacultyAvailability", back_populates="faculty", cascade="all, delete-orphan")
    invigilation_assignments = relationship("InvigilationAssignment", back_populates="faculty")
    exam_assignments = relationship("ExamAssignment", back_populates="faculty")

    def __repr__(self):
        return f"<Faculty {self.employee_id} - {self.name}>"


class FacultyAvailability(Base):
    __tablename__ = "faculty_availability"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    faculty_id = Column(String(36), ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(String(36), ForeignKey("exam_slots.id", ondelete="CASCADE"), nullable=False)
    is_available = Column(Boolean, default=True)

    __table_args__ = (
        UniqueConstraint("faculty_id", "slot_id", name="uq_faculty_slot_availability"),
    )

    faculty = relationship("Faculty", back_populates="availabilities")
    slot = relationship("ExamSlot", back_populates="faculty_availabilities")

    def __repr__(self):
        return f"<FacultyAvailability Faculty:{self.faculty_id} Slot:{self.slot_id} Avail:{self.is_available}>"
