import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole

# Create isolated in-memory DB shared across threads for auth tests
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
        email="admin@test.com",
        password_hash=get_password_hash("AdminPass123"),
        role=UserRole.SUPER_ADMIN,
        is_active=True,
    )
    student = User(
        name="Student User",
        email="student@test.com",
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


def test_login_success():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "AdminPass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@test.com"
    assert data["user"]["role"] == "SUPER_ADMIN"


def test_login_wrong_password():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_user():
    response = client.post(
        "/api/auth/login",
        json={"email": "nobody@test.com", "password": "AdminPass123"},
    )
    assert response.status_code == 401


def test_get_current_user_me_success():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "AdminPass123"},
    )
    token = login_res.json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "SUPER_ADMIN"


def test_invalid_or_expired_token():
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_jwt_token_string"},
    )
    assert response.status_code == 401


def test_user_registration_by_admin():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "AdminPass123"},
    )
    token = login_res.json()["access_token"]

    register_payload = {
        "name": "New Faculty Member",
        "email": "faculty.new@test.com",
        "password": "FacultyPass123",
        "role": "FACULTY",
    }

    response = client.post(
        "/api/auth/register",
        json=register_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "faculty.new@test.com"
    assert data["role"] == "FACULTY"


def test_rbac_unauthorized_role():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "student@test.com", "password": "StudentPass123"},
    )
    student_token = login_res.json()["access_token"]

    register_payload = {
        "name": "Unauthorized User",
        "email": "unauth@test.com",
        "password": "Password123",
        "role": "STUDENT",
    }

    response = client.post(
        "/api/auth/register",
        json=register_payload,
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403
    assert "Access forbidden" in response.json()["detail"]


def test_public_student_signup_creates_account_and_allows_login():
    signup_payload = {
        "name": "New Student",
        "student_id": "STU-NEW-001",
        "email": "new.student@example.com",
        "password": "MyOwnPassword123!",
        "confirm_password": "MyOwnPassword123!",
    }

    signup_response = client.post("/api/auth/signup", json=signup_payload)
    assert signup_response.status_code == 201
    data = signup_response.json()
    assert data["email"] == signup_payload["email"]
    assert data["role"] == "STUDENT"

    login_response = client.post(
        "/api/auth/login",
        json={"email": signup_payload["email"], "password": signup_payload["password"]},
    )
    assert login_response.status_code == 200
    assert login_response.json()["user"]["email"] == signup_payload["email"]
    assert login_response.json()["user"]["role"] == "STUDENT"

    roll_login_response = client.post(
        "/api/auth/login",
        json={"email": signup_payload["student_id"], "password": signup_payload["password"]},
    )
    assert roll_login_response.status_code == 200
    assert roll_login_response.json()["user"]["email"] == signup_payload["email"]
