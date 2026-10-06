import pytest
import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole, Constraint
from app.genetic_algorithm.constraints import ConstraintEvaluator, ProblemDataset, Gene


# Dataset Fixture for GA Tests
@pytest.fixture
def sample_dataset():
    dataset = ProblemDataset(
        student_enrollments={
            "std-01": {"sub-dbms", "sub-os"},
            "std-02": {"sub-dbms", "sub-cn"},
            "std-03": {"sub-os", "sub-cn"},
        },
        subject_students_count={
            "sub-dbms": 2,
            "sub-os": 2,
            "sub-cn": 2,
        },
        exam_subject_map={
            "ex-dbms": "sub-dbms",
            "ex-os": "sub-os",
            "ex-cn": "sub-cn",
        },
        room_capacities={
            "room-a101": 50,
            "room-a102": 1,  # Deficit capacity
        },
        room_unavailability={
            ("room-a101", "slot-1"),
        },
        faculty_unavailability={
            ("fac-01", "slot-1"),
        },
        slot_details={
            "slot-1": {"exam_date": datetime.date(2026, 12, 10), "session_name": "MORNING", "is_available": True},
            "slot-2": {"exam_date": datetime.date(2026, 12, 10), "session_name": "AFTERNOON", "is_available": True},
            "slot-3": {"exam_date": datetime.date(2026, 12, 11), "session_name": "MORNING", "is_available": True},
        },
        locked_assignments={
            "ex-dbms": {"slot_id": "slot-1", "room_id": "room-a101", "faculty_id": "fac-02"}
        },
        all_exam_ids={"ex-dbms", "ex-os", "ex-cn"}
    )
    return dataset


def test_clean_schedule(sample_dataset):
    genes = [
        Gene("ex-dbms", "slot-2", "room-a101", "fac-02"),
        Gene("ex-os", "slot-3", "room-a101", "fac-01"),
        Gene("ex-cn", "slot-1", "room-a101", "fac-02"),
    ]
    # Remove locked constraint for clean test
    sample_dataset.locked_assignments = {}
    sample_dataset.room_unavailability = set()
    sample_dataset.faculty_unavailability = set()

    res = ConstraintEvaluator.evaluate(genes, sample_dataset)
    assert res.hard_violations == 0
    assert res.is_valid is True


def test_hc01_student_clash(sample_dataset):
    # DBMS and OS scheduled in slot-1; student std-01 is enrolled in both!
    genes = [
        Gene("ex-dbms", "slot-1", "room-a101", "fac-01"),
        Gene("ex-os", "slot-1", "room-a102", "fac-02"),
        Gene("ex-cn", "slot-3", "room-a101", "fac-01"),
    ]
    res = ConstraintEvaluator.evaluate(genes, sample_dataset)
    assert res.hard_violations > 0
    codes = [d["code"] for d in res.hard_details]
    assert "HC-01" in codes


def test_hc02_room_conflict(sample_dataset):
    # Two exams in room-a101 during slot-2
    genes = [
        Gene("ex-dbms", "slot-2", "room-a101", "fac-01"),
        Gene("ex-os", "slot-2", "room-a101", "fac-02"),
        Gene("ex-cn", "slot-3", "room-a101", "fac-01"),
    ]
    res = ConstraintEvaluator.evaluate(genes, sample_dataset)
    codes = [d["code"] for d in res.hard_details]
    assert "HC-02" in codes


def test_hc03_room_capacity_deficit(sample_dataset):
    # ex-dbms (2 students) in room-a102 (capacity 1)
    genes = [
        Gene("ex-dbms", "slot-2", "room-a102", "fac-01"),
        Gene("ex-os", "slot-3", "room-a101", "fac-02"),
        Gene("ex-cn", "slot-1", "room-a101", "fac-01"),
    ]
    res = ConstraintEvaluator.evaluate(genes, sample_dataset)
    codes = [d["code"] for d in res.hard_details]
    assert "HC-03" in codes


def test_hc04_faculty_conflict(sample_dataset):
    # fac-01 assigned to 2 rooms in slot-2
    genes = [
        Gene("ex-dbms", "slot-2", "room-a101", "fac-01"),
        Gene("ex-os", "slot-2", "room-a102", "fac-01"),
        Gene("ex-cn", "slot-3", "room-a101", "fac-02"),
    ]
    res = ConstraintEvaluator.evaluate(genes, sample_dataset)
    codes = [d["code"] for d in res.hard_details]
    assert "HC-04" in codes


def test_hc08_locked_assignment_altered(sample_dataset):
    # ex-dbms is locked to slot-1, but candidate gene assigns it to slot-2
    genes = [
        Gene("ex-dbms", "slot-2", "room-a101", "fac-02"),
        Gene("ex-os", "slot-3", "room-a101", "fac-01"),
        Gene("ex-cn", "slot-1", "room-a101", "fac-02"),
    ]
    res = ConstraintEvaluator.evaluate(genes, sample_dataset)
    codes = [d["code"] for d in res.hard_details]
    assert "HC-08" in codes


# API Test setup
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    db = TestingSessionLocal()
    admin = User(
        name="Admin User",
        email="admin_c@test.com",
        password_hash=get_password_hash("AdminPass123"),
        role=UserRole.EXAM_ADMIN,
        is_active=True,
    )
    c1 = Constraint(code="HC-01", name="Student Clash", type="HARD", is_enabled=True)
    c2 = Constraint(code="SC-01", name="Consecutive Spacing", type="SOFT", is_enabled=True)
    db.add_all([admin, c1, c2])
    db.commit()
    db.close()

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def test_constraints_api_endpoints():
    login_res = client.post("/api/auth/login", json={"email": "admin_c@test.com", "password": "AdminPass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # GET /api/constraints
    res = client.get("/api/constraints", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 2

    # PUT /api/constraints/{id}
    c_id = res.json()[0]["id"]
    put_res = client.put(f"/api/constraints/{c_id}", json={"weight": 15.0, "is_enabled": True}, headers=headers)
    assert put_res.status_code == 200
    assert put_res.json()["weight"] == 15.0
