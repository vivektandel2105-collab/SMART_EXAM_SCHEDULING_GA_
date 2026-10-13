import time
import json
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
    """Constructs GA ProblemDataset from database state, ensuring all subjects have exams."""
    dataset = ProblemDataset()

    # 1. Fetch Subjects & ensure Exam entries exist
    subjects = db.query(Subject).all()
    exams = db.query(Exam).all()
    existing_exam_subject_ids = {e.subject_id for e in exams}

    created_new_exams = False
    for sub in subjects:
        if sub.id not in existing_exam_subject_ids:
            new_exam = Exam(
                subject_id=sub.id,
                exam_duration_minutes=sub.exam_duration_minutes or 180,
                status="PENDING",
            )
            db.add(new_exam)
            created_new_exams = True

    if created_new_exams:
        db.commit()
        exams = db.query(Exam).all()

    exam_subject_map: Dict[str, str] = {}
    all_exam_ids: Set[str] = set()
    for exam in exams:
        exam_subject_map[exam.id] = exam.subject_id
        all_exam_ids.add(exam.id)

    dataset.exam_subject_map = exam_subject_map
    dataset.all_exam_ids = all_exam_ids

    # 2. Fetch Student Enrollments
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

    # For any subjects without explicit student records, assign baseline count
    for sub in subjects:
        if sub.id not in subject_students_count:
            subject_students_count[sub.id] = 0

    dataset.student_enrollments = student_enrollments
    dataset.subject_students_count = subject_students_count

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
            "start_time": slot.start_time,
            "end_time": slot.end_time,
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

    # Precompute fast conflict caches
    dataset.init_conflict_structures()

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
        errors.append("No examinations registered in the system. Add subjects/exams first.")
    if total_slots == 0:
        errors.append("No active exam slots available. Configure available dates and time slots.")
    if total_rooms == 0:
        errors.append("No active rooms available. Configure exam rooms.")

    total_capacity = total_slots * total_rooms
    if total_exams > total_capacity:
        errors.append(f"Insufficient total capacity: {total_exams} exams require scheduling, but only {total_capacity} slot-room units are available.")

    oversized_subjects: List[str] = []
    for exam_id, sub_id in dataset.exam_subject_map.items():
        num_students = dataset.subject_students_count.get(sub_id, 0)
        if num_students > max_room_capacity and max_room_capacity > 0:
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
    """Worker task executing GA optimization loop asynchronously and persisting results."""
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
        elif result.status in ("TARGET_REACHED", "VALID_TIMETABLE_GENERATED", "MAX_GENERATIONS_REACHED", "TIMEOUT"):
            run_record.status = "COMPLETED"
        else:
            run_record.status = "FAILED"

        # Persist serialized chromosome into DB for durable retrieval
        run_record.solution_json = json.dumps([g.to_dict() for g in result.best_chromosome.genes])
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

    # If memory cache is absent, deserialize from DB solution_json
    if not best_chromosome and run_record.solution_json:
        try:
            gene_dicts = json.loads(run_record.solution_json)
            best_chromosome = Chromosome(genes=[Gene.from_dict(gd) for gd in gene_dicts])
            # Re-evaluate fitness
            dataset = build_problem_dataset(db)
            from app.genetic_algorithm.fitness import FitnessEvaluator
            FitnessEvaluator.evaluate_chromosome(best_chromosome, dataset)
        except Exception as e:
            logger.error(f"Failed to restore solution_json: {e}")

    if not best_chromosome:
        raise ValueError(f"No completed solution chromosome found for run '{scheduler_run_id}'.")

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


def seed_sample_problem_data(db: Session) -> Dict[str, Any]:
    """Populates a realistic college examination problem:
    10 subjects, 5 rooms, 200 students, and 5 examination days (10 slots).
    """
    # 1. Clear existing schedule versions, assignments, and test entities
    db.query(ExamAssignment).delete()
    db.query(TimetableVersion).delete()
    db.query(SchedulerMetric).delete()
    db.query(SchedulerRun).delete()
    db.query(Exam).delete()
    db.query(StudentSubject).delete()
    db.query(Student).delete()
    db.query(Subject).delete()
    db.query(Room).delete()
    db.query(ExamSlot).delete()
    db.commit()

    # 2. Add 5 Rooms
    rooms_data = [
        {"room_number": "R-101", "building": "Academic Block A", "floor": 1, "capacity": 50, "room_type": "CLASSROOM"},
        {"room_number": "R-102", "building": "Academic Block A", "floor": 1, "capacity": 50, "room_type": "CLASSROOM"},
        {"room_number": "R-201", "building": "Academic Block B", "floor": 2, "capacity": 60, "room_type": "CLASSROOM"},
        {"room_number": "R-202", "building": "Academic Block B", "floor": 2, "capacity": 80, "room_type": "HALL"},
        {"room_number": "AUD-1", "building": "Central Block", "floor": 1, "capacity": 200, "room_type": "AUDITORIUM"},
    ]
    created_rooms = []
    for rd in rooms_data:
        r = Room(**rd)
        db.add(r)
        created_rooms.append(r)
    db.flush()

    # 3. Add 5 Examination Days (2 sessions each: Morning & Afternoon = 10 slots)
    base_date = datetime.date(2026, 12, 10)
    created_slots = []
    for day_offset in range(5):
        d = base_date + datetime.timedelta(days=day_offset)
        # Morning session: 09:00 - 12:00
        slot_m = ExamSlot(
            exam_date=d,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(12, 0),
            session_name="MORNING",
            is_available=True,
        )
        # Afternoon session: 14:00 - 17:00
        slot_a = ExamSlot(
            exam_date=d,
            start_time=datetime.time(14, 0),
            end_time=datetime.time(17, 0),
            session_name="AFTERNOON",
            is_available=True,
        )
        db.add(slot_m)
        db.add(slot_a)
        created_slots.extend([slot_m, slot_a])
    db.flush()

    # 4. Add 10 Subjects
    subjects_data = [
        ("CS301", "Data Structures & Algorithms", 180),
        ("CS302", "Database Management Systems", 180),
        ("CS303", "Operating Systems", 180),
        ("CS304", "Computer Networks", 180),
        ("CS305", "Theory of Computation", 180),
        ("CS306", "Artificial Intelligence", 180),
        ("CS307", "Software Engineering", 180),
        ("CS308", "Web Technologies", 180),
        ("CS309", "Cloud Computing", 180),
        ("CS310", "Cybersecurity", 180),
    ]
    created_subjects = []
    created_exams = []
    for code, name, dur in subjects_data:
        sub = Subject(subject_code=code, subject_name=name, exam_duration_minutes=dur)
        db.add(sub)
        db.flush()
        created_subjects.append(sub)

        exam = Exam(subject_id=sub.id, exam_duration_minutes=dur, status="PENDING")
        db.add(exam)
        created_exams.append(exam)
    db.flush()

    # 5. Add 200 Students with Realistic Shared Enrollments
    # Group students into cohorts to create realistic overlap:
    # Cohort 1 (Students 1-80): Take CS301, CS302, CS303, CS304 (Core Year 3)
    # Cohort 2 (Students 81-140): Take CS305, CS306, CS307, CS308 (Specialization A)
    # Cohort 3 (Students 141-200): Take CS303, CS306, CS309, CS310 (Elective group)
    created_students = []
    enrollments_to_add = []

    for i in range(1, 201):
        roll = f"2026-CS-{i:04d}"
        name = f"Student {i:03d}"
        email = f"student{i}@smartexam.edu"
        st = Student(roll_number=roll, name=name, email=email, status="ACTIVE")
        db.add(st)
        db.flush()
        created_students.append(st)

        # Assign subjects based on cohort
        if i <= 80:
            subs = [created_subjects[0], created_subjects[1], created_subjects[2], created_subjects[3]]
        elif i <= 140:
            subs = [created_subjects[4], created_subjects[5], created_subjects[6], created_subjects[7]]
        else:
            subs = [created_subjects[2], created_subjects[5], created_subjects[8], created_subjects[9]]

        for sub in subs:
            enrollments_to_add.append(StudentSubject(student_id=st.id, subject_id=sub.id))

    db.add_all(enrollments_to_add)
    db.commit()

    return {
        "success": True,
        "message": "Realistic college examination dataset loaded successfully.",
        "total_subjects": len(created_subjects),
        "total_exams": len(created_exams),
        "total_rooms": len(created_rooms),
        "total_slots": len(created_slots),
        "total_students": len(created_students),
        "total_enrollments": len(enrollments_to_add),
    }


def clear_all_scheduling_data(db: Session) -> dict:
    """Clear all loaded academic scheduling data (timetables, versions, runs, metrics,
    exams, subjects, rooms, slots, students, enrollments) while preserving system users.
    """
    total_assignments_deleted = db.query(ExamAssignment).delete()
    total_metrics_deleted = db.query(SchedulerMetric).delete()
    total_runs_deleted = db.query(SchedulerRun).delete()
    total_versions_deleted = db.query(TimetableVersion).delete()
    total_timetables_deleted = db.query(Timetable).delete()

    total_enrollments_deleted = db.query(StudentSubject).delete()
    total_students_deleted = db.query(Student).delete()

    total_exams_deleted = db.query(Exam).delete()
    total_subjects_deleted = db.query(Subject).delete()

    total_rooms_deleted = db.query(Room).delete()
    total_slots_deleted = db.query(ExamSlot).delete()

    db.commit()

    return {
        "success": True,
        "message": "All loaded academic scheduling data has been completely deleted.",
        "cleared": {
            "timetables": total_timetables_deleted,
            "versions": total_versions_deleted,
            "runs": total_runs_deleted,
            "subjects": total_subjects_deleted,
            "exams": total_exams_deleted,
            "rooms": total_rooms_deleted,
            "slots": total_slots_deleted,
            "students": total_students_deleted,
            "enrollments": total_enrollments_deleted,
        }
    }

