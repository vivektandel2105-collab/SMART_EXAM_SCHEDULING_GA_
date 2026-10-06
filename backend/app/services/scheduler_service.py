import time
import logging
import datetime
from typing import Dict, Any, List, Optional, Set, Tuple
from sqlalchemy.orm import Session

from app.models.academic import Department, Program, Semester, Division
from app.models.student import Student, StudentSubject
from app.models.faculty import Faculty, FacultyAvailability
from app.models.subject import Subject
from app.models.room import Room, RoomAvailability
from app.models.exam import ExamSlot, Exam, ExamAssignment
from app.models.timetable import Timetable, TimetableVersion, SchedulerRun, SchedulerMetric
from app.genetic_algorithm.constraints import ProblemDataset, Gene
from app.genetic_algorithm.chromosome import Chromosome
from app.genetic_algorithm.engine import GeneticAlgorithmEngine, GAConfig, GARunResult

logger = logging.getLogger(__name__)

# In-memory runtime state for active scheduler runs (cancellation flags, best chromosome results)
ACTIVE_RUNS: Dict[str, Dict[str, Any]] = {}


def build_problem_dataset(db: Session) -> ProblemDataset:
    """Constructs GA ProblemDataset from database state."""
    dataset = ProblemDataset()

    # 1. Fetch Student Enrollments
    students = db.query(Student).filter(Student.status == "ACTIVE").all()
    student_enrollments: Dict[str, Set[str]] = {}
    subject_students_count: Dict[str, int] = {}

    for student in students:
        student_subs = set()
        enrollments = db.query(StudentSubject).filter(StudentSubject.student_id == student.id).all()
        for enr in enrollments:
            student_subs.add(enr.subject_id)
            subject_students_count[enr.subject_id] = subject_students_count.get(enr.subject_id, 0) + 1
        if student_subs:
            student_enrollments[student.id] = student_subs

    dataset.student_enrollments = student_enrollments
    dataset.subject_students_count = subject_students_count

    # 2. Fetch Exams & Subject Map
    exams = db.query(Exam).all()
    exam_subject_map: Dict[str, str] = {}
    all_exam_ids: Set[str] = set()
    for exam in exams:
        exam_subject_map[exam.id] = exam.subject_id
        all_exam_ids.add(exam.id)

    dataset.exam_subject_map = exam_subject_map
    dataset.all_exam_ids = all_exam_ids

    # 3. Fetch Rooms & Capacities
    rooms = db.query(Room).filter(Room.is_available == True).all()
    room_capacities: Dict[str, int] = {}
    for room in rooms:
        room_capacities[room.id] = room.capacity
    dataset.room_capacities = room_capacities

    # 4. Fetch Room Unavailability
    room_unavail = db.query(RoomAvailability).filter(RoomAvailability.is_available == False).all()
    room_unavailability: Set[Tuple[str, str]] = set()
    for r_un in room_unavail:
        room_unavailability.add((r_un.room_id, r_un.slot_id))
    dataset.room_unavailability = room_unavailability

    # 5. Fetch Faculty Unavailability
    fac_unavail = db.query(FacultyAvailability).filter(FacultyAvailability.is_available == False).all()
    faculty_unavailability: Set[Tuple[str, str]] = set()
    for f_un in fac_unavail:
        faculty_unavailability.add((f_un.faculty_id, f_un.slot_id))
    dataset.faculty_unavailability = faculty_unavailability

    # 6. Fetch Available Slots
    slots = db.query(ExamSlot).filter(ExamSlot.is_available == True).all()
    slot_details: Dict[str, Dict[str, Any]] = {}
    for slot in slots:
        slot_details[slot.id] = {
            "exam_date": slot.exam_date,
            "session_name": slot.session_name,
            "is_available": slot.is_available,
        }
    dataset.slot_details = slot_details

    # 7. Fetch Locked Exam Assignments
    locked_assignments: Dict[str, Dict[str, str]] = {}
    locked_db = db.query(ExamAssignment).filter(ExamAssignment.is_locked == True).all()
    for lock in locked_db:
        if lock.slot_id and lock.room_id:
            locked_assignments[lock.exam_id] = {
                "slot_id": lock.slot_id,
                "room_id": lock.room_id,
                "faculty_id": lock.faculty_id or "",
            }
    dataset.locked_assignments = locked_assignments

    return dataset


def validate_dataset(dataset: ProblemDataset) -> Dict[str, Any]:
    """Validates problem dataset readiness for GA scheduling."""
    total_exams = len(dataset.all_exam_ids)
    total_slots = len(dataset.slot_details)
    total_rooms = len(dataset.room_capacities)
    max_room_capacity = max(dataset.room_capacities.values()) if dataset.room_capacities else 0

    warnings: List[str] = []
    errors: List[str] = []

    if total_exams == 0:
        errors.append("No exams registered in the system.")
    if total_slots == 0:
        errors.append("No active exam slots available.")
    if total_rooms == 0:
        errors.append("No active rooms available.")

    total_capacity = total_slots * total_rooms
    if total_exams > total_capacity:
        errors.append(f"Insufficient total capacity: {total_exams} exams require scheduling, but max slot-room slots available is {total_capacity}.")

    oversized_subjects: List[str] = []
    for exam_id, sub_id in dataset.exam_subject_map.items():
        num_students = dataset.subject_students_count.get(sub_id, 0)
        if num_students > max_room_capacity:
            oversized_subjects.append(f"Subject '{sub_id}' ({num_students} students) exceeds maximum room capacity ({max_room_capacity}).")

    if oversized_subjects:
        warnings.extend(oversized_subjects)

    is_valid = len(errors) == 0

    return {
        "is_valid": is_valid,
        "total_exams": total_exams,
        "total_available_slots": total_slots,
        "total_available_rooms": total_rooms,
        "max_room_capacity": max_room_capacity,
        "total_capacity_slots": total_capacity,
        "warnings": warnings,
        "errors": errors,
    }


def set_run_cancellation(scheduler_run_id: str) -> bool:
    """Sets cancellation request for an active scheduler run."""
    if scheduler_run_id in ACTIVE_RUNS:
        ACTIVE_RUNS[scheduler_run_id]["cancel_requested"] = True
        return True
    return False


def run_scheduler_background_job(
    scheduler_run_id: str,
    config: GAConfig,
    db_factory,
):
    """Worker task executing GA optimization loop asynchronously."""
    db: Session = db_factory()
    try:
        run_record = db.query(SchedulerRun).filter(SchedulerRun.id == scheduler_run_id).first()
        if not run_record:
            logger.error(f"Scheduler run record {scheduler_run_id} not found in DB.")
            return

        run_record.status = "RUNNING"
        db.commit()

        ACTIVE_RUNS[scheduler_run_id] = {
            "cancel_requested": False,
            "status": "RUNNING",
            "best_chromosome": None,
        }

        # Build problem dataset
        dataset = build_problem_dataset(db)

        # Cancellation check closure
        def is_cancelled() -> bool:
            return ACTIVE_RUNS.get(scheduler_run_id, {}).get("cancel_requested", False)

        # Run GA Engine
        result: GARunResult = GeneticAlgorithmEngine.run(
            dataset=dataset,
            config=config,
            cancellation_check=is_cancelled,
        )

        # Record metrics history to DB
        for metric in result.metrics_history:
            db_metric = SchedulerMetric(
                scheduler_run_id=scheduler_run_id,
                generation=metric["generation"],
                best_fitness=metric["best_fitness"],
                hard_violations=metric["hard_violations"],
                soft_penalty=metric["soft_penalty"],
                execution_time_ms=metric["execution_time_ms"],
            )
            db.add(db_metric)

        run_record = db.query(SchedulerRun).filter(SchedulerRun.id == scheduler_run_id).first()
        if result.status == "CANCELLED":
            run_record.status = "CANCELLED"
        elif result.status in ("TARGET_REACHED", "MAX_GENERATIONS_REACHED", "TIMEOUT"):
            run_record.status = "COMPLETED"
        else:
            run_record.status = "FAILED"

        run_record.completed_at = datetime.datetime.utcnow()
        db.commit()

        ACTIVE_RUNS[scheduler_run_id]["status"] = run_record.status
        ACTIVE_RUNS[scheduler_run_id]["best_chromosome"] = result.best_chromosome
        ACTIVE_RUNS[scheduler_run_id]["result"] = result

    except Exception as e:
        logger.exception(f"Error executing scheduler run {scheduler_run_id}: {e}")
        try:
            run_record = db.query(SchedulerRun).filter(SchedulerRun.id == scheduler_run_id).first()
            if run_record:
                run_record.status = "FAILED"
                run_record.completed_at = datetime.datetime.utcnow()
                db.commit()
            if scheduler_run_id in ACTIVE_RUNS:
                ACTIVE_RUNS[scheduler_run_id]["status"] = "FAILED"
        except Exception:
            pass
    finally:
        db.close()


def save_run_result_as_timetable_version(
    db: Session,
    scheduler_run_id: str,
    timetable_name: Optional[str] = None,
    user_id: Optional[str] = None,
) -> TimetableVersion:
    """Persists GA solved chromosome to DB as a new TimetableVersion and ExamAssignments."""
    run_record = db.query(SchedulerRun).filter(SchedulerRun.id == scheduler_run_id).first()
    if not run_record:
        raise ValueError(f"Scheduler run '{scheduler_run_id}' not found.")

    timetable = db.query(Timetable).filter(Timetable.id == run_record.timetable_id).first()
    if not timetable:
        raise ValueError(f"Associated timetable '{run_record.timetable_id}' not found.")

    run_info = ACTIVE_RUNS.get(scheduler_run_id, {})
    best_chromosome: Optional[Chromosome] = run_info.get("best_chromosome")

    if not best_chromosome:
        raise ValueError(f"No completed solution chromosome found in memory for run '{scheduler_run_id}'.")

    # Determine next version number
    existing_versions = db.query(TimetableVersion).filter(TimetableVersion.timetable_id == timetable.id).all()
    next_version_num = max([v.version_number for v in existing_versions], default=0) + 1

    # Create TimetableVersion
    version = TimetableVersion(
        timetable_id=timetable.id,
        version_number=next_version_num,
        status="GENERATED",
        fitness_score=best_chromosome.fitness,
        hard_violations=best_chromosome.hard_violations,
        soft_violations=int(best_chromosome.soft_penalty),
        created_by=user_id,
    )
    db.add(version)
    db.flush()

    # Create ExamAssignment entries for each gene
    for gene in best_chromosome.genes:
        assignment = ExamAssignment(
            timetable_version_id=version.id,
            exam_id=gene.exam_id,
            slot_id=gene.slot_id,
            room_id=gene.room_id,
            faculty_id=gene.faculty_id,
            is_locked=gene.is_locked,
        )
        db.add(assignment)

    db.commit()
    db.refresh(version)

    return version
