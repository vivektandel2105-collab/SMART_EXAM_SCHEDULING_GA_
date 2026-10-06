import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    roll_number = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    program_id = Column(String(36), ForeignKey("programs.id", ondelete="SET NULL"), nullable=True)
    semester_id = Column(String(36), ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True)
    division_id = Column(String(36), ForeignKey("divisions.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    program = relationship("Program", back_populates="students")
    semester = relationship("Semester", back_populates="students")
    division = relationship("Division", back_populates="students")
    enrollments = relationship("StudentSubject", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student {self.roll_number} - {self.name}>"


class StudentSubject(Base):
    __tablename__ = "student_subjects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", name="uq_student_subject"),
    )

    student = relationship("Student", back_populates="enrollments")
    subject = relationship("Subject", back_populates="student_enrollments")

    def __repr__(self):
        return f"<StudentSubject Student:{self.student_id} -> Subject:{self.subject_id}>"
