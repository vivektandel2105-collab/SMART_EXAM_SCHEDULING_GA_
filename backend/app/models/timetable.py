import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    academic_year = Column(String(50), nullable=False)
    status = Column(String(50), default="DRAFT")  # DRAFT, GENERATED, UNDER_REVIEW, APPROVED, PUBLISHED, ARCHIVED
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    versions = relationship("TimetableVersion", back_populates="timetable", cascade="all, delete-orphan")
    scheduler_runs = relationship("SchedulerRun", back_populates="timetable", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Timetable {self.name} ({self.academic_year}) Status:{self.status}>"


class TimetableVersion(Base):
    __tablename__ = "timetable_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String(36), ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    status = Column(String(50), default="GENERATED")
    fitness_score = Column(Float, nullable=True)
    hard_violations = Column(Integer, default=0)
    soft_violations = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    timetable = relationship("Timetable", back_populates="versions")
    assignments = relationship("ExamAssignment", back_populates="timetable_version", cascade="all, delete-orphan")
    invigilation_assignments = relationship("InvigilationAssignment", back_populates="timetable_version", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TimetableVersion v{self.version_number} (Fitness:{self.fitness_score}, HC:{self.hard_violations})>"


class SchedulerRun(Base):
    __tablename__ = "scheduler_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timetable_id = Column(String(36), ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False)
    configuration_json = Column(Text, nullable=True)
    random_seed = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="RUNNING")  # RUNNING, COMPLETED, FAILED, CANCELLED

    timetable = relationship("Timetable", back_populates="scheduler_runs")
    metrics = relationship("SchedulerMetric", back_populates="scheduler_run", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SchedulerRun {self.id} Status:{self.status}>"


class SchedulerMetric(Base):
    __tablename__ = "scheduler_metrics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheduler_run_id = Column(String(36), ForeignKey("scheduler_runs.id", ondelete="CASCADE"), nullable=False)
    generation = Column(Integer, nullable=False)
    best_fitness = Column(Float, nullable=False)
    hard_violations = Column(Integer, nullable=False)
    soft_penalty = Column(Float, nullable=False)
    execution_time_ms = Column(Integer, nullable=False)

    scheduler_run = relationship("SchedulerRun", back_populates="metrics")

    def __repr__(self):
        return f"<SchedulerMetric Gen:{self.generation} Fit:{self.best_fitness} HC:{self.hard_violations}>"
