import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole

# Isolated in-memory DB shared across test client threads for CRUD API tests
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
        email="admin_crud@test.com",
        password_hash=get_password_hash("AdminPass123"),
        role=UserRole.EXAM_ADMIN,
        is_active=True,
    )
    student = User(
        name="Student User",
        email="student_crud@test.com",
        password_hash=get_password_hash("StudentPass123"),
        role=UserRole.STUDENT,
        is_active=True,
    )
    db.add_all([admin, student])
    db.commit()
    db.close()

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def get_admin_headers():
    res = client.post("/api/auth/login", json={"email": "admin_crud@test.com", "password": "AdminPass123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def get_student_headers():
    res = client.post("/api/auth/login", json={"email": "student_crud@test.com", "password": "StudentPass123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_department_crud():
    headers = get_admin_headers()
    create_res = client.post("/api/departments", json={"code": "CS", "name": "Computer Science"}, headers=headers)
    assert create_res.status_code == 201
    dept_id = create_res.json()["id"]

    get_all_res = client.get("/api/departments", headers=headers)
    assert len(get_all_res.json()) == 1

    get_one_res = client.get(f"/api/departments/{dept_id}", headers=headers)
    assert get_one_res.json()["code"] == "CS"

    put_res = client.put(f"/api/departments/{dept_id}", json={"name": "Computer Science & Engg"}, headers=headers)
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "Computer Science & Engg"

    del_res = client.delete(f"/api/departments/{dept_id}", headers=headers)
    assert del_res.status_code == 204


def test_room_crud_and_capacity_filter():
    headers = get_admin_headers()
    r1 = client.post("/api/rooms", json={"room_number": "A101", "building": "Block A", "capacity": 50}, headers=headers)
    r2 = client.post("/api/rooms", json={"room_number": "A102", "building": "Block A", "capacity": 100}, headers=headers)
    assert r1.status_code == 201
    assert r2.status_code == 201

    filtered = client.get("/api/rooms?min_capacity=80", headers=headers)
    assert len(filtered.json()) == 1
    assert filtered.json()[0]["room_number"] == "A102"


def test_student_crud_and_duplicate_validation():
    headers = get_admin_headers()
    s1 = client.post("/api/students", json={"roll_number": "21BCE001", "name": "Student A", "email": "stdA@test.com"}, headers=headers)
    assert s1.status_code == 201

    s2 = client.post("/api/students", json={"roll_number": "21BCE001", "name": "Student B", "email": "stdB@test.com"}, headers=headers)
    assert s2.status_code == 400
    assert "already exists" in s2.json()["detail"]


def test_subject_crud():
    headers = get_admin_headers()
    sub = client.post("/api/subjects", json={"subject_code": "CSE1001", "subject_name": "Data Structures", "exam_duration_minutes": 180}, headers=headers)
    assert sub.status_code == 201
    assert sub.json()["subject_code"] == "CSE1001"


def test_rbac_protection_on_crud():
    student_headers = get_student_headers()
    res = client.post("/api/rooms", json={"room_number": "X999", "building": "Block X", "capacity": 50}, headers=student_headers)
    assert res.status_code == 403
