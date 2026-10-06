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
from app.models import User, UserRole, Department, Subject, Exam, Room, ExamSlot, Faculty, Timetable, TimetableVersion, ExamAssignment

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_timetables_db():
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

    # Admin User
    admin = User(
        name="Timetable Admin",
        email=f"tt_admin_{suffix}@test.com",
        password_hash=get_password_hash("AdminPass123"),
        role=UserRole.EXAM_ADMIN,
        is_active=True,
    )
    db.add(admin)

    # Faculty members
    f1 = Faculty(employee_id=f"EMP1_{suffix}", name="Dr. Alice", email=f"alice_f_{suffix}@test.com", is_active=True)
    f2 = Faculty(employee_id=f"EMP2_{suffix}", name="Dr. Bob", email=f"bob_f_{suffix}@test.com", is_active=True)
    db.add_all([f1, f2])

    # Department, Subject, Exam, Room, Slot
    dept = Department(code=f"D_{suffix}", name="Engineering")
    db.add(dept)
    db.flush()

    sub1 = Subject(subject_code=f"SUB1_{suffix}", subject_name="Maths", department_id=dept.id)
    sub2 = Subject(subject_code=f"SUB2_{suffix}", subject_name="Physics", department_id=dept.id)
    db.add_all([sub1, sub2])
    db.flush()

    ex1 = Exam(subject_id=sub1.id, exam_duration_minutes=180)
    ex2 = Exam(subject_id=sub2.id, exam_duration_minutes=180)
    db.add_all([ex1, ex2])
    db.flush()

    r1 = Room(room_number=f"RM1_{suffix}", building="Hall A", capacity=100, is_available=True)
    r2 = Room(room_number=f"RM2_{suffix}", building="Hall B", capacity=100, is_available=True)
    db.add_all([r1, r2])

    s1 = ExamSlot(exam_date=datetime.date(2026, 12, 20), start_time=datetime.time(9, 0), end_time=datetime.time(12, 0), session_name="MORNING", is_available=True)
    s2 = ExamSlot(exam_date=datetime.date(2026, 12, 21), start_time=datetime.time(9, 0), end_time=datetime.time(12, 0), session_name="MORNING", is_available=True)
    db.add_all([s1, s2])
    db.flush()

    # Timetable & Versions
    tt = Timetable(name="Spring 2026 Schedule", academic_year="2026-2027", status="DRAFT", created_by=admin.id)
    db.add(tt)
    db.flush()

    v1 = TimetableVersion(timetable_id=tt.id, version_number=1, status="GENERATED", fitness_score=50.0, hard_violations=0, soft_violations=50)
    v2 = TimetableVersion(timetable_id=tt.id, version_number=2, status="GENERATED", fitness_score=20.0, hard_violations=0, soft_violations=20)
    db.add_all([v1, v2])
    db.flush()

    # Assignments for v1
    a1_v1 = ExamAssignment(timetable_version_id=v1.id, exam_id=ex1.id, slot_id=s1.id, room_id=r1.id, faculty_id=f1.id, is_locked=False)
    a2_v1 = ExamAssignment(timetable_version_id=v1.id, exam_id=ex2.id, slot_id=s2.id, room_id=r2.id, faculty_id=f2.id, is_locked=False)

    # Assignments for v2 (ex2 moved to r1)
    a1_v2 = ExamAssignment(timetable_version_id=v2.id, exam_id=ex1.id, slot_id=s1.id, room_id=r1.id, faculty_id=f1.id, is_locked=False)
    a2_v2 = ExamAssignment(timetable_version_id=v2.id, exam_id=ex2.id, slot_id=s2.id, room_id=r1.id, faculty_id=f2.id, is_locked=False)

    db.add_all([a1_v1, a2_v1, a1_v2, a2_v2])
    db.commit()

    pytest.tt_admin_email = admin.email
    pytest.tt_id = tt.id
    pytest.v1_id = v1.id
    pytest.v2_id = v2.id
    pytest.assignment1_id = a1_v1.id
    db.close()

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def get_auth_headers():
    login_res = client.post("/api/auth/login", json={"email": pytest.tt_admin_email, "password": "AdminPass123"})
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_and_get_timetable_detail():
    headers = get_auth_headers()

    # GET /api/timetables
    res = client.get("/api/timetables", headers=headers)
    assert res.status_code == 200
    timetables = res.json()
    assert len(timetables) >= 1

    # GET /api/timetables/{id}
    detail_res = client.get(f"/api/timetables/{pytest.tt_id}", headers=headers)
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["name"] == "Spring 2026 Schedule"
    assert len(data["versions"]) == 2


def test_get_version_detail_and_lock_assignment():
    headers = get_auth_headers()

    # GET /api/timetables/versions/{v1_id}
    res = client.get(f"/api/timetables/versions/{pytest.v1_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["assignments"]) == 2

    # Lock assignment
    lock_res = client.post(f"/api/timetables/assignments/{pytest.assignment1_id}/lock", json={"is_locked": True}, headers=headers)
    assert lock_res.status_code == 200
    assert lock_res.json()["is_locked"] is True


def test_auto_invigilation():
    headers = get_auth_headers()
    res = client.post(f"/api/timetables/versions/{pytest.v1_id}/auto-invigilate", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_assignments_created"] > 0


def test_version_comparison():
    headers = get_auth_headers()
    res = client.get(f"/api/timetables/versions/compare?v1_id={pytest.v1_id}&v2_id={pytest.v2_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["total_modified"] == 1


def test_status_transitions():
    headers = get_auth_headers()

    # Approve
    app_res = client.post(f"/api/timetables/{pytest.tt_id}/status", json={"status": "APPROVED"}, headers=headers)
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "APPROVED"

    # Publish
    pub_res = client.post(f"/api/timetables/{pytest.tt_id}/status", json={"status": "PUBLISHED"}, headers=headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "PUBLISHED"
    assert pub_res.json()["published_at"] is not None


def test_excel_export():
    headers = get_auth_headers()
    res = client.get(f"/api/timetables/versions/{pytest.v1_id}/export", headers=headers)
    assert res.status_code == 200
    assert "spreadsheetml" in res.headers["content-type"]
    assert len(res.content) > 0
