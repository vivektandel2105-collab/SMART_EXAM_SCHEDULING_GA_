import time
import uuid
import datetime
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole, Department, Program, Semester, Student, StudentSubject, Subject, Room, ExamSlot, Exam

# Setup SQLite In-Memory Database engine for test isolation
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_scheduler_db():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    suffix = uuid.uuid4().hex[:6]

    # 1. Create Admin User
    admin = User(
        name="Scheduler Admin",
        email=f"scheduler_admin_{suffix}@test.com",
        password_hash=get_password_hash("AdminPass123"),
        role=UserRole.EXAM_ADMIN,
        is_active=True,
    )
    db.add(admin)

    # 2. Create Academic Hierarchy
    dept = Department(code=f"CS_{suffix}", name="Computer Science")
    db.add(dept)
    db.flush()

    prog = Program(department_id=dept.id, code=f"BTECH_{suffix}", name="B.Tech CS")
    db.add(prog)
    db.flush()

    sem = Semester(program_id=prog.id, number=5, name="Semester 5")
    db.add(sem)
    db.flush()

    # 3. Create Subjects & Exams
    sub1 = Subject(subject_code=f"CS501_{suffix}", subject_name="Database Systems", department_id=dept.id)
    sub2 = Subject(subject_code=f"CS502_{suffix}", subject_name="Operating Systems", department_id=dept.id)
    db.add_all([sub1, sub2])
    db.flush()

    ex1 = Exam(subject_id=sub1.id, exam_duration_minutes=180)
    ex2 = Exam(subject_id=sub2.id, exam_duration_minutes=180)
    db.add_all([ex1, ex2])
    db.flush()

    # 4. Create Students & Enrollments
    st1 = Student(roll_number=f"ROLL1_{suffix}", name="Alice Smith", email=f"alice_{suffix}@test.com", program_id=prog.id, semester_id=sem.id)
    st2 = Student(roll_number=f"ROLL2_{suffix}", name="Bob Jones", email=f"bob_{suffix}@test.com", program_id=prog.id, semester_id=sem.id)
    db.add_all([st1, st2])
    db.flush()

    enr1 = StudentSubject(student_id=st1.id, subject_id=sub1.id)
    enr2 = StudentSubject(student_id=st2.id, subject_id=sub2.id)
    db.add_all([enr1, enr2])

    # 5. Create Rooms & Exam Slots
    r1 = Room(room_number=f"R101_{suffix}", building="Block A", capacity=50, is_available=True)
    r2 = Room(room_number=f"R102_{suffix}", building="Block A", capacity=50, is_available=True)
    db.add_all([r1, r2])

    slot1 = ExamSlot(exam_date=datetime.date(2026, 12, 10), start_time=datetime.time(9, 0), end_time=datetime.time(12, 0), session_name="MORNING", is_available=True)
    slot2 = ExamSlot(exam_date=datetime.date(2026, 12, 11), start_time=datetime.time(9, 0), end_time=datetime.time(12, 0), session_name="MORNING", is_available=True)
    db.add_all([slot1, slot2])

    db.commit()

    # Save admin email in fixture for auth headers
    admin_email = admin.email
    db.close()

    pytest.admin_email = admin_email

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def get_auth_headers():
    login_res = client.post("/api/auth/login", json={"email": pytest.admin_email, "password": "AdminPass123"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_scheduler_validation_endpoint():
    headers = get_auth_headers()
    res = client.post("/api/scheduler/validate", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True
    assert data["total_exams"] >= 2
    assert data["total_available_slots"] >= 2
    assert data["total_available_rooms"] >= 2


def test_scheduler_generate_and_save_flow():
    headers = get_auth_headers()

    # 1. Trigger Async GA Generation
    payload = {
        "timetable_name": "Fall 2026 Final Exams",
        "academic_year": "2026-2027",
        "population_size": 20,
        "max_generations": 15,
        "random_seed": 42,
        "time_limit_seconds": 10.0,
    }
    gen_res = client.post("/api/scheduler/generate", json=payload, headers=headers)
    assert gen_res.status_code == 202
    gen_data = gen_res.json()
    run_id = gen_data["scheduler_run_id"]
    timetable_id = gen_data["timetable_id"]
    assert run_id is not None
    assert timetable_id is not None

    # 2. Poll status until completed
    max_retries = 30
    status_data = None
    for _ in range(max_retries):
        time.sleep(0.2)
        run_res = client.get(f"/api/scheduler/runs/{run_id}", headers=headers)
        assert run_res.status_code == 200
        status_data = run_res.json()
        if status_data["status"] in ("COMPLETED", "FAILED", "CANCELLED"):
            break

    assert status_data["status"] == "COMPLETED"
    assert status_data["total_generations"] > 0
    assert status_data["hard_violations"] == 0

    # 3. Check metrics history
    metrics_res = client.get(f"/api/scheduler/runs/{run_id}/metrics", headers=headers)
    assert metrics_res.status_code == 200
    metrics_list = metrics_res.json()
    assert len(metrics_list) > 0
    assert metrics_list[0]["generation"] == 0

    # 4. Save Timetable Version
    save_res = client.post(f"/api/scheduler/runs/{run_id}/save-timetable", headers=headers)
    assert save_res.status_code == 200
    save_data = save_res.json()
    assert save_data["version_number"] == 1
    assert save_data["hard_violations"] == 0
    assert save_data["total_assignments"] >= 2


def test_scheduler_cancellation():
    headers = get_auth_headers()
    payload = {
        "population_size": 50,
        "max_generations": 1000,
        "time_limit_seconds": 60.0,
    }
    gen_res = client.post("/api/scheduler/generate", json=payload, headers=headers)
    assert gen_res.status_code == 202
    run_id = gen_res.json()["scheduler_run_id"]

    # Cancel request check
    cancel_res = client.post(f"/api/scheduler/runs/{run_id}/cancel", headers=headers)
    assert cancel_res.status_code in (200, 400)
    if cancel_res.status_code == 200:
        assert cancel_res.json()["status"] == "CANCELLED"
    else:
        assert "Cannot cancel" in cancel_res.json()["detail"]
