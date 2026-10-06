import os
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models import User, UserRole, Department, Program, Student, Subject, Faculty, Room

# Isolated in-memory DB shared across test client threads for import tests
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
        email="admin_import@test.com",
        password_hash=get_password_hash("AdminPass123"),
        role=UserRole.EXAM_ADMIN,
        is_active=True,
    )
    dept = Department(code="CS", name="Computer Science")
    db.add_all([admin, dept])
    db.commit()

    prog = Program(department_id=dept.id, code="BTECH-CS", name="B.Tech CS")
    db.add(prog)
    db.commit()

    db.close()

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def get_admin_headers():
    res = client.post("/api/auth/login", json={"email": "admin_import@test.com", "password": "AdminPass123"})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_import_sample_students_csv():
    headers = get_admin_headers()
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data/students.csv"))
    with open(sample_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/import/students",
        files={"file": ("students.csv", file_bytes, "text/csv")},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["valid_rows"] == 5
    assert data["invalid_rows"] == 0


def test_import_sample_subjects_csv():
    headers = get_admin_headers()
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data/subjects.csv"))
    with open(sample_path, "rb") as f:
        file_bytes = f.read()

    response = client.post(
        "/api/import/subjects",
        files={"file": ("subjects.csv", file_bytes, "text/csv")},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["valid_rows"] == 5


def test_import_invalid_file_missing_columns():
    headers = get_admin_headers()
    invalid_csv = b"wrong_header1,wrong_header2\nval1,val2\n"

    response = client.post(
        "/api/import/students",
        files={"file": ("invalid.csv", invalid_csv, "text/csv")},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "Missing required columns" in data["error"]


def test_import_dry_run_preview():
    headers = get_admin_headers()
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data/rooms.csv"))
    with open(sample_path, "rb") as f:
        file_bytes = f.read()

    # Perform Dry Run Preview
    response = client.post(
        "/api/import/rooms?dry_run=true",
        files={"file": ("rooms.csv", file_bytes, "text/csv")},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["dry_run"] is True
    assert data["valid_rows"] == 5

    # Verify DB was NOT modified in dry run
    db = TestingSessionLocal()
    room_count = db.query(Room).count()
    db.close()
    assert room_count == 0


def test_unsupported_file_extension():
    headers = get_admin_headers()
    fake_txt = b"some plain text content"

    response = client.post(
        "/api/import/students",
        files={"file": ("test.txt", fake_txt, "text/plain")},
        headers=headers,
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]
