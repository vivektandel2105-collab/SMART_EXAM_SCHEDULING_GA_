import uuid
from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)

    programs = relationship("Program", back_populates="department", cascade="all, delete-orphan")
    faculty_members = relationship("Faculty", back_populates="department")
    subjects = relationship("Subject", back_populates="department")

    def __repr__(self):
        return f"<Department {self.code} - {self.name}>"


class Program(Base):
    __tablename__ = "programs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)

    department = relationship("Department", back_populates="programs")
    semesters = relationship("Semester", back_populates="program", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="program")
    subjects = relationship("Subject", back_populates="program")

    def __repr__(self):
        return f"<Program {self.code} - {self.name}>"


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    program_id = Column(String(36), ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    number = Column(Integer, nullable=False)
    name = Column(String(50), nullable=False)

    program = relationship("Program", back_populates="semesters")
    divisions = relationship("Division", back_populates="semester", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="semester")
    subjects = relationship("Subject", back_populates="semester")

    def __repr__(self):
        return f"<Semester {self.name} (Prog: {self.program_id})>"


class Division(Base):
    __tablename__ = "divisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    semester_id = Column(String(36), ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(50), nullable=False)

    semester = relationship("Semester", back_populates="divisions")
    students = relationship("Student", back_populates="division")

    def __repr__(self):
        return f"<Division {self.name}>"
