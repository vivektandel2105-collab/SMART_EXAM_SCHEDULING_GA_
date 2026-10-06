import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_code = Column(String(100), unique=True, nullable=False, index=True)
    subject_name = Column(String(255), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    program_id = Column(String(36), ForeignKey("programs.id", ondelete="SET NULL"), nullable=True)
    semester_id = Column(String(36), ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True)
    exam_duration_minutes = Column(Integer, default=180, nullable=False)
    exam_type = Column(String(50), default="THEORY")
    is_active = Column(Boolean, default=True)

    department = relationship("Department", back_populates="subjects")
    program = relationship("Program", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    student_enrollments = relationship("StudentSubject", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Subject {self.subject_code} - {self.subject_name}>"
