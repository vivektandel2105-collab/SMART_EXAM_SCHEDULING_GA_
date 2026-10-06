import json
import threading
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.timetable import Timetable, SchedulerRun, SchedulerMetric, TimetableVersion
from app.genetic_algorithm.engine import GAConfig
from app.services import scheduler_service

router = APIRouter()


# --- Pydantic Schemas ---

class ValidationReportResponse(BaseModel):
    is_valid: bool
    total_exams: int
    total_available_slots: int
    total_available_rooms: int
    max_room_capacity: int
    total_capacity_slots: int
    warnings: List[str]
    errors: List[str]


class GenerateTimetableRequest(BaseModel):
    timetable_id: Optional[str] = None
    timetable_name: str = "Exam Timetable"
    academic_year: str = "2026-2027"
    population_size: int = Field(default=50, ge=10, le=500)
    max_generations: int = Field(default=100, ge=1, le=2000)
    crossover_rate: float = Field(default=0.80, ge=0.0, le=1.0)
    mutation_rate: float = Field(default=0.10, ge=0.0, le=1.0)
    elite_count: int = Field(default=5, ge=0, le=50)
    tournament_size: int = Field(default=5, ge=2, le=20)
    random_seed: Optional[int] = None
    time_limit_seconds: Optional[float] = Field(default=60.0, ge=1.0, le=600.0)


class GenerateTimetableResponse(BaseModel):
    scheduler_run_id: str
    timetable_id: str
    status: str
    message: str


class SchedulerMetricResponse(BaseModel):
    generation: int
    best_fitness: float
    hard_violations: int
    soft_penalty: float
    execution_time_ms: int


class SchedulerRunResponse(BaseModel):
    id: str
    timetable_id: str
    status: str
    random_seed: Optional[int] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class SchedulerRunDetailResponse(BaseModel):
    id: str
    timetable_id: str
    status: str
    random_seed: Optional[int] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    total_generations: int = 0
    best_fitness: Optional[float] = None
    hard_violations: Optional[int] = None
    soft_penalty: Optional[float] = None


class SaveTimetableVersionResponse(BaseModel):
    timetable_version_id: str
    timetable_id: str
    version_number: int
    status: str
    fitness_score: Optional[float] = None
    hard_violations: int
    soft_violations: int
    total_assignments: int


# --- API Routes ---

@router.post("/validate", response_model=ValidationReportResponse)
def validate_scheduling_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Pre-scheduling validation check for dataset capacity and readiness."""
    dataset = scheduler_service.build_problem_dataset(db)
    report = scheduler_service.validate_dataset(dataset)
    return report


@router.post("/generate", response_model=GenerateTimetableResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_timetable(
    req: GenerateTimetableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Launch async background Genetic Algorithm timetable generation job."""
    # Find or create Timetable
    timetable = None
    if req.timetable_id:
        timetable = db.query(Timetable).filter(Timetable.id == req.timetable_id).first()
        if not timetable:
            raise HTTPException(status_code=404, detail=f"Timetable '{req.timetable_id}' not found.")
    else:
        timetable = Timetable(
            name=req.timetable_name,
            academic_year=req.academic_year,
            status="DRAFT",
            created_by=current_user.id,
        )
        db.add(timetable)
        db.commit()
        db.refresh(timetable)

    config = GAConfig(
        population_size=req.population_size,
        max_generations=req.max_generations,
        crossover_rate=req.crossover_rate,
        mutation_rate=req.mutation_rate,
        elite_count=req.elite_count,
        tournament_size=req.tournament_size,
        random_seed=req.random_seed,
        time_limit_seconds=req.time_limit_seconds,
    )

    scheduler_run = SchedulerRun(
        timetable_id=timetable.id,
        configuration_json=json.dumps({
            "population_size": req.population_size,
            "max_generations": req.max_generations,
            "crossover_rate": req.crossover_rate,
            "mutation_rate": req.mutation_rate,
            "elite_count": req.elite_count,
            "tournament_size": req.tournament_size,
            "time_limit_seconds": req.time_limit_seconds,
        }),
        random_seed=req.random_seed,
        status="QUEUED",
    )
    db.add(scheduler_run)
    db.commit()
    db.refresh(scheduler_run)

    from sqlalchemy.orm import sessionmaker
    db_engine = db.get_bind()
    db_factory = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)

    # Launch background thread for GA run
    thread = threading.Thread(
        target=scheduler_service.run_scheduler_background_job,
        args=(scheduler_run.id, config, db_factory),
        daemon=True,
    )
    thread.start()

    return GenerateTimetableResponse(
        scheduler_run_id=scheduler_run.id,
        timetable_id=timetable.id,
        status="QUEUED",
        message="Genetic Algorithm timetable generation started in background.",
    )


@router.get("/runs", response_model=List[SchedulerRunResponse])
def list_scheduler_runs(
    timetable_id: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """List historical and active scheduler runs."""
    query = db.query(SchedulerRun)
    if timetable_id:
        query = query.filter(SchedulerRun.timetable_id == timetable_id)
    runs = query.order_by(SchedulerRun.started_at.desc()).offset(offset).limit(limit).all()

    res = []
    for r in runs:
        res.append(SchedulerRunResponse(
            id=r.id,
            timetable_id=r.timetable_id,
            status=r.status,
            random_seed=r.random_seed,
            started_at=r.started_at.isoformat() if r.started_at else None,
            completed_at=r.completed_at.isoformat() if r.completed_at else None,
        ))
    return res


@router.get("/runs/{run_id}", response_model=SchedulerRunDetailResponse)
def get_scheduler_run_detail(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Fetch status and solution summary for a scheduler run."""
    run_record = db.query(SchedulerRun).filter(SchedulerRun.id == run_id).first()
    if not run_record:
        raise HTTPException(status_code=404, detail=f"Scheduler run '{run_id}' not found.")

    latest_metric = (
        db.query(SchedulerMetric)
        .filter(SchedulerMetric.scheduler_run_id == run_id)
        .order_by(SchedulerMetric.generation.desc())
        .first()
    )

    total_gens = (
        db.query(SchedulerMetric)
        .filter(SchedulerMetric.scheduler_run_id == run_id)
        .count()
    )

    return SchedulerRunDetailResponse(
        id=run_record.id,
        timetable_id=run_record.timetable_id,
        status=run_record.status,
        random_seed=run_record.random_seed,
        started_at=run_record.started_at.isoformat() if run_record.started_at else None,
        completed_at=run_record.completed_at.isoformat() if run_record.completed_at else None,
        total_generations=total_gens,
        best_fitness=latest_metric.best_fitness if latest_metric else None,
        hard_violations=latest_metric.hard_violations if latest_metric else None,
        soft_penalty=latest_metric.soft_penalty if latest_metric else None,
    )


@router.get("/runs/{run_id}/metrics", response_model=List[SchedulerMetricResponse])
def get_scheduler_run_metrics(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Fetch time-series generation metrics for plotting optimization progress."""
    run_record = db.query(SchedulerRun).filter(SchedulerRun.id == run_id).first()
    if not run_record:
        raise HTTPException(status_code=404, detail=f"Scheduler run '{run_id}' not found.")

    metrics = (
        db.query(SchedulerMetric)
        .filter(SchedulerMetric.scheduler_run_id == run_id)
        .order_by(SchedulerMetric.generation.asc())
        .all()
    )

    res = []
    for m in metrics:
        res.append(SchedulerMetricResponse(
            generation=m.generation,
            best_fitness=m.best_fitness,
            hard_violations=m.hard_violations,
            soft_penalty=m.soft_penalty,
            execution_time_ms=m.execution_time_ms,
        ))
    return res


@router.post("/runs/{run_id}/cancel")
def cancel_scheduler_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Request cancellation for an active scheduler run."""
    run_record = db.query(SchedulerRun).filter(SchedulerRun.id == run_id).first()
    if not run_record:
        raise HTTPException(status_code=404, detail=f"Scheduler run '{run_id}' not found.")

    if run_record.status not in ("QUEUED", "RUNNING"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel run with status '{run_record.status}'.")

    success = scheduler_service.set_run_cancellation(run_id)
    run_record.status = "CANCELLED"
    db.commit()

    return {
        "status": "CANCELLED",
        "message": "Scheduler run cancellation request recorded.",
    }


@router.post("/runs/{run_id}/save-timetable", response_model=SaveTimetableVersionResponse)
def save_scheduler_timetable_version(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Convert generated GA solution into a persisted TimetableVersion."""
    try:
        version = scheduler_service.save_run_result_as_timetable_version(
            db=db,
            scheduler_run_id=run_id,
            user_id=current_user.id,
        )
        total_assignments = len(version.assignments)

        return SaveTimetableVersionResponse(
            timetable_version_id=version.id,
            timetable_id=version.timetable_id,
            version_number=version.version_number,
            status=version.status,
            fitness_score=version.fitness_score,
            hard_violations=version.hard_violations,
            soft_violations=version.soft_violations,
            total_assignments=total_assignments,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
