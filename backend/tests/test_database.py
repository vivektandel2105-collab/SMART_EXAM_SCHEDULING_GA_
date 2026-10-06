import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
from app.core.database import Base
from app.models import (
    User, UserRole, Department, Program, Semester, Division,
    Student, StudentSubject, Faculty, FacultyAvailability,
    Subject, Room, RoomAvailability, ExamSlot, Exam,
    ExamAssignment, InvigilationAssignment, Constraint, ConstraintWeight,
    Timetable, TimetableVersion, SchedulerRun, SchedulerMetric, AuditLog
)
from app.services.seed_service import seed_database


@pytest.fixture(scope="function")
def db_session():
    """Create an in-memory SQLite database for fast isolated unit testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_user_creation_and_unique_email(db_session):
    user1 = User(name="Alice", email="alice@smartexam.edu", password_hash="hash123", role=UserRole.EXAM_ADMIN)
    db_session.add(user1)
    db_session.commit()

    assert user1.id is not None
    assert user1.role == UserRole.EXAM_ADMIN

    # Duplicate email test
    user2 = User(name="Alice Duplicate", email="alice@smartexam.edu", password_hash="hash456", role=UserRole.STUDENT)
    db_session.add(user2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_academic_hierarchy_and_cascade(db_session):
    dept = Department(code="CS", name="Computer Science")
    db_session.add(dept)
    db_session.commit()

    prog = Program(department_id=dept.id, code="BTECH-CS", name="B.Tech Computer Science")
    db_session.add(prog)
    db_session.commit()

    sem = Semester(program_id=prog.id, number=6, name="Semester 6")
    db_session.add(sem)
    db_session.commit()

    div = Division(semester_id=sem.id, name="Div-A")
    db_session.add(div)
    db_session.commit()

    assert dept.programs[0].code == "BTECH-CS"
    assert prog.semesters[0].number == 6
    assert sem.divisions[0].name == "Div-A"


def test_student_subject_unique_enrollment(db_session):
    student = Student(roll_number="21BCE0001", name="Student One", email="std1@smartexam.edu")
    subject = Subject(subject_code="CSE1001", subject_name="Intro to CS")
    db_session.add_all([student, subject])
    db_session.commit()

    enrollment1 = StudentSubject(student_id=student.id, subject_id=subject.id)
    db_session.add(enrollment1)
    db_session.commit()

    # Duplicate enrollment
    enrollment2 = StudentSubject(student_id=student.id, subject_id=subject.id)
    db_session.add(enrollment2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_timetable_and_version_relationship(db_session):
    tt = Timetable(name="Fall 2026 Timetable", academic_year="2026-2027", status="DRAFT")
    db_session.add(tt)
    db_session.commit()

    ver = TimetableVersion(timetable_id=tt.id, version_number=1, status="GENERATED", fitness_score=10.5, hard_violations=0)
    db_session.add(ver)
    db_session.commit()

    assert len(tt.versions) == 1
    assert tt.versions[0].fitness_score == 10.5
    assert tt.versions[0].hard_violations == 0


def test_database_seeding(db_session):
    seed_database(db_session)

    # Check seeded entities
    admin = db_session.query(User).filter(User.email == "admin@smartexam.edu").first()
    assert admin is not None
    assert admin.role == UserRole.SUPER_ADMIN

    cs_dept = db_session.query(Department).filter(Department.code == "CS").first()
    assert cs_dept is not None

    rooms = db_session.query(Room).all()
    assert len(rooms) >= 3

    subjects = db_session.query(Subject).all()
    assert len(subjects) >= 3

    constraints = db_session.query(Constraint).all()
    assert len(constraints) >= 6
