import pytest
import datetime
from sqlalchemy.orm import Session

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.api.deps import get_db
from app.models.exam import Exam, ExamSlot, ExamAssignment
from app.models.subject import Subject
from app.models.room import Room
from app.models.student import Student, StudentSubject
from app.models.timetable import Timetable, TimetableVersion, SchedulerRun
from app.genetic_algorithm.chromosome import Chromosome, Gene
from app.genetic_algorithm.constraints import ProblemDataset, ConstraintEvaluator
from app.genetic_algorithm.crossover import TimetableCrossover
from app.genetic_algorithm.mutation import TimetableMutation
from app.genetic_algorithm.engine import GeneticAlgorithmEngine, GAConfig
from app.services.constraint_validator import IndependentConstraintValidator
from app.services.scheduler_service import seed_sample_problem_data, build_problem_dataset, validate_dataset
from app.services import timetable_service

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=test_engine)


def test_independent_validator_detects_deliberate_student_conflict():
    dataset = ProblemDataset(
        student_enrollments={"std-1": {"sub-1", "sub-2"}},
        subject_students_count={"sub-1": 1, "sub-2": 1},
        exam_subject_map={"ex-1": "sub-1", "ex-2": "sub-2"},
        room_capacities={"r-1": 50, "r-2": 50},
        slot_details={
            "s-1": {"exam_date": datetime.date(2026, 12, 10), "start_time": datetime.time(9, 0), "end_time": datetime.time(12, 0), "session_name": "MORNING", "is_available": True},
        },
        all_exam_ids={"ex-1", "ex-2"},
    )
    # Deliberately schedule overlapping exams in same slot for student taking both
    genes = [
        Gene("ex-1", "s-1", "r-1"),
        Gene("ex-2", "s-1", "r-2"),
    ]
    report = IndependentConstraintValidator.validate_chromosome(genes, dataset)
    assert report.is_valid is False
    assert report.student_conflict_count >= 1
    assert report.total_hard_violations >= 1


def test_independent_validator_detects_deliberate_room_conflict():
    dataset = ProblemDataset(
        student_enrollments={"std-1": {"sub-1"}, "std-2": {"sub-2"}},
        subject_students_count={"sub-1": 1, "sub-2": 1},
        exam_subject_map={"ex-1": "sub-1", "ex-2": "sub-2"},
        room_capacities={"r-1": 50},
        slot_details={
            "s-1": {"exam_date": datetime.date(2026, 12, 10), "start_time": datetime.time(9, 0), "end_time": datetime.time(12, 0), "session_name": "MORNING", "is_available": True},
        },
        all_exam_ids={"ex-1", "ex-2"},
    )
    # Deliberately schedule two exams in the same room at the same time
    genes = [
        Gene("ex-1", "s-1", "r-1"),
        Gene("ex-2", "s-1", "r-1"),
    ]
    report = IndependentConstraintValidator.validate_chromosome(genes, dataset)
    assert report.is_valid is False
    assert report.room_conflict_count == 1
    assert report.total_hard_violations >= 1


def test_independent_validator_detects_capacity_deficit():
    dataset = ProblemDataset(
        student_enrollments={"std-1": {"sub-1"}},
        subject_students_count={"sub-1": 60},
        exam_subject_map={"ex-1": "sub-1"},
        room_capacities={"r-small": 30},
        slot_details={
            "s-1": {"exam_date": datetime.date(2026, 12, 10), "start_time": datetime.time(9, 0), "end_time": datetime.time(12, 0), "session_name": "MORNING", "is_available": True},
        },
        all_exam_ids={"ex-1"},
    )
    genes = [Gene("ex-1", "s-1", "r-small")]
    report = IndependentConstraintValidator.validate_chromosome(genes, dataset)
    assert report.is_valid is False
    assert report.capacity_violation_count == 1


def test_exams_without_shared_students_can_run_simultaneously():
    dataset = ProblemDataset(
        student_enrollments={"std-1": {"sub-1"}, "std-2": {"sub-2"}},
        subject_students_count={"sub-1": 1, "sub-2": 1},
        exam_subject_map={"ex-1": "sub-1", "ex-2": "sub-2"},
        room_capacities={"r-1": 50, "r-2": 50},
        slot_details={
            "s-1": {"exam_date": datetime.date(2026, 12, 10), "start_time": datetime.time(9, 0), "end_time": datetime.time(12, 0), "session_name": "MORNING", "is_available": True},
        },
        all_exam_ids={"ex-1", "ex-2"},
    )
    # Different rooms, same slot, no shared students -> valid!
    genes = [
        Gene("ex-1", "s-1", "r-1"),
        Gene("ex-2", "s-1", "r-2"),
    ]
    report = IndependentConstraintValidator.validate_chromosome(genes, dataset)
    assert report.is_valid is True
    assert report.total_hard_violations == 0


def test_crossover_preserves_chromosome_integrity():
    p1 = Chromosome(genes=[
        Gene("e1", "s1", "r1"),
        Gene("e2", "s1", "r2"),
        Gene("e3", "s2", "r1"),
    ])
    p2 = Chromosome(genes=[
        Gene("e1", "s2", "r2"),
        Gene("e2", "s2", "r1"),
        Gene("e3", "s1", "r2"),
    ])
    # Parent copies to verify parents aren't mutated
    p1_orig_genes = [g.clone() for g in p1.genes]
    p2_orig_genes = [g.clone() for g in p2.genes]

    c1, c2 = TimetableCrossover.crossover(p1, p2, crossover_rate=1.0)

    # Parents untouched
    assert [g.to_dict() for g in p1.genes] == [g.to_dict() for g in p1_orig_genes]
    assert [g.to_dict() for g in p2.genes] == [g.to_dict() for g in p2_orig_genes]

    # Offspring retain all exams exactly once
    assert {g.exam_id for g in c1.genes} == {"e1", "e2", "e3"}
    assert {g.exam_id for g in c2.genes} == {"e1", "e2", "e3"}
    assert len(c1.genes) == 3
    assert len(c2.genes) == 3


def test_mutation_preserves_chromosome_integrity():
    dataset = ProblemDataset(
        exam_subject_map={"e1": "s1", "e2": "s2"},
        room_capacities={"r1": 50, "r2": 50},
        slot_details={"s1": {"is_available": True}, "s2": {"is_available": True}},
        all_exam_ids={"e1", "e2"},
    )
    chrom = Chromosome(genes=[Gene("e1", "s1", "r1"), Gene("e2", "s2", "r2")])
    mutated = TimetableMutation.mutate(chrom.clone(), dataset, mutation_rate=1.0)
    assert {g.exam_id for g in mutated.genes} == {"e1", "e2"}
    assert len(mutated.genes) == 2


def test_sample_problem_solves_and_exports_csv(db_session: Session):
    # 1. Seed realistic sample problem data
    seed_res = seed_sample_problem_data(db_session)
    assert seed_res["success"] is True
    assert seed_res["total_subjects"] == 10
    assert seed_res["total_students"] == 200

    # 2. Build dataset and validate readiness
    dataset = build_problem_dataset(db_session)
    readiness = validate_dataset(dataset)
    assert readiness["is_valid"] is True
    assert readiness["total_exams"] == 10

    # 3. Run Genetic Algorithm
    config = GAConfig(population_size=40, max_generations=100, random_seed=42)
    ga_res = GeneticAlgorithmEngine.run(dataset, config)
    assert ga_res.status in ("TARGET_REACHED", "VALID_TIMETABLE_GENERATED")
    assert ga_res.hard_violations == 0

    # 4. Independent Validation
    validation_report = IndependentConstraintValidator.validate_chromosome(ga_res.best_chromosome.genes, dataset)
    assert validation_report.is_valid is True
    assert validation_report.total_hard_violations == 0

    # 5. Persist as Timetable Version
    timetable = Timetable(name="Sample Test Exam", academic_year="2026-2027")
    db_session.add(timetable)
    db_session.commit()

    run_record = SchedulerRun(timetable_id=timetable.id, status="COMPLETED")
    db_session.add(run_record)
    db_session.commit()

    from app.services.scheduler_service import ACTIVE_RUNS, save_run_result_as_timetable_version
    ACTIVE_RUNS[run_record.id] = {"best_chromosome": ga_res.best_chromosome}

    version = save_run_result_as_timetable_version(db_session, run_record.id)
    assert version.hard_violations == 0
    assert len(version.assignments) == 10

    # 6. Verify CSV Export
    csv_text = timetable_service.export_timetable_csv(db_session, version.id)
    assert "Examination ID,Subject Code,Subject Name,Examination Date" in csv_text
    assert "CS301" in csv_text
    assert "Valid (0 Violations)" in csv_text
    lines = csv_text.strip().split("\n")
    assert len(lines) == 11  # 1 header + 10 exams


def test_api_scheduler_generate_sync_and_csv_export(db_session: Session):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.models.user import User, UserRole
    from app.core.security import create_access_token, get_password_hash

    client = TestClient(app)

    # Ensure admin user exists
    admin = db_session.query(User).filter(User.email == "admin_val_test@test.com").first()
    if not admin:
        admin = User(
            name="Validation Admin",
            email="admin_val_test@test.com",
            password_hash=get_password_hash("AdminPass123"),
            role=UserRole.EXAM_ADMIN,
            is_active=True,
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)

    token = create_access_token(subject=str(admin.id))
    admin_headers = {"Authorization": f"Bearer {token}"}

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        # 1. Seed sample data via API
        seed_resp = client.post("/api/scheduler/sample-data", headers=admin_headers)
        assert seed_resp.status_code == 200

        # 2. Generate timetable synchronously via GA
        gen_resp = client.post(
            "/api/scheduler/generate-sync",
            json={"population_size": 30, "max_generations": 50},
            headers=admin_headers,
        )
        assert gen_resp.status_code == 200
        gen_data = gen_resp.json()
        assert gen_data["is_valid"] is True
        assert gen_data["hard_violations"] == 0
        version_id = gen_data["timetable_version_id"]

        # 3. Export CSV via API endpoint
        csv_resp = client.get(f"/api/timetables/versions/{version_id}/export-csv", headers=admin_headers)
        assert csv_resp.status_code == 200
        assert "text/csv" in csv_resp.headers["content-type"]
        assert "CS301" in csv_resp.text

        # 4. Clear all loaded data via API endpoint
        clear_resp = client.post("/api/scheduler/clear-data", headers=admin_headers)
        assert clear_resp.status_code == 200
        assert clear_resp.json()["success"] is True

        # Assert tables are cleared
        assert db_session.query(Subject).count() == 0
        assert db_session.query(Student).count() == 0
        assert db_session.query(Room).count() == 0
        assert db_session.query(Timetable).count() == 0
    finally:
        app.dependency_overrides.clear()



