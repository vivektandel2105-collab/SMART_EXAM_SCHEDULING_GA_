import datetime
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models import (
    User, UserRole, Department, Program, Semester, Division,
    Faculty, Room, Subject, Student, StudentSubject, ExamSlot, Constraint
)


def seed_database(db: Session):
    """Seed initial sample institutional data for development and testing."""

    # 1. Admin & Test Users
    admin_com = db.query(User).filter(User.email == "admin@smartexam.com").first()
    if not admin_com:
        admin_com = User(
            name="System Admin",
            email="admin@smartexam.com",
            password_hash=get_password_hash("AdminPass123"),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        db.add(admin_com)

    admin_user = db.query(User).filter(User.email == "admin@smartexam.edu").first()
    if not admin_user:
        admin_user = User(
            name="System Admin",
            email="admin@smartexam.edu",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        db.add(admin_user)

    exam_admin = db.query(User).filter(User.email == "examadmin@smartexam.edu").first()
    if not exam_admin:
        exam_admin = User(
            name="Exam Cell Admin",
            email="examadmin@smartexam.edu",
            password_hash=get_password_hash("ExamAdmin@123"),
            role=UserRole.EXAM_ADMIN,
            is_active=True,
        )
        db.add(exam_admin)

    student_user = db.query(User).filter(User.email == "student@smartexam.edu").first()
    if not student_user:
        student_user = User(
            name="Alex Morgan",
            email="student@smartexam.edu",
            password_hash=get_password_hash("StudentPass123"),
            role=UserRole.STUDENT,
            is_active=True,
        )
        db.add(student_user)

    # 2. Departments
    cs_dept = db.query(Department).filter(Department.code == "CS").first()
    if not cs_dept:
        cs_dept = Department(code="CS", name="Computer Science and Engineering")
        db.add(cs_dept)

    ec_dept = db.query(Department).filter(Department.code == "EC").first()
    if not ec_dept:
        ec_dept = Department(code="EC", name="Electronics and Communication")
        db.add(ec_dept)

    db.flush()

    # 3. Programs
    btech_cs = db.query(Program).filter(Program.code == "BTECH-CS").first()
    if not btech_cs:
        btech_cs = Program(department_id=cs_dept.id, code="BTECH-CS", name="B.Tech Computer Science")
        db.add(btech_cs)

    db.flush()

    # 4. Semesters & Divisions
    sem6 = db.query(Semester).filter(Semester.program_id == btech_cs.id, Semester.number == 6).first()
    if not sem6:
        sem6 = Semester(program_id=btech_cs.id, number=6, name="Semester 6")
        db.add(sem6)
        db.flush()

    div_a = db.query(Division).filter(Division.semester_id == sem6.id, Division.name == "Div-A").first()
    if not div_a:
        div_a = Division(semester_id=sem6.id, name="Div-A")
        db.add(div_a)
        db.flush()

    # Student Record
    student_rec = db.query(Student).filter(Student.roll_number == "2026-CS-0142").first()
    if not student_rec:
        student_rec = Student(
            roll_number="2026-CS-0142",
            name="Alex Morgan",
            email="student@smartexam.edu",
            program_id=btech_cs.id if btech_cs else None,
            semester_id=sem6.id if sem6 else None,
            division_id=div_a.id if div_a else None,
            status="ACTIVE"
        )
        db.add(student_rec)
        db.flush()

    # 5. Rooms
    rooms_data = [
        {"room_number": "A101", "building": "Main Block", "floor": 1, "capacity": 60, "room_type": "CLASSROOM"},
        {"room_number": "A102", "building": "Main Block", "floor": 1, "capacity": 60, "room_type": "CLASSROOM"},
        {"room_number": "A201", "building": "Main Block", "floor": 2, "capacity": 100, "room_type": "AUDITORIUM"},
    ]
    for r in rooms_data:
        if not db.query(Room).filter(Room.room_number == r["room_number"]).first():
            db.add(Room(**r))

    # 6. Faculty
    faculty_data = [
        {"employee_id": "FAC001", "name": "Dr. Rajesh Kumar", "email": "rajesh.kumar@smartexam.edu", "department_id": cs_dept.id, "designation": "Professor"},
        {"employee_id": "FAC002", "name": "Dr. Meena Iyer", "email": "meena.iyer@smartexam.edu", "department_id": cs_dept.id, "designation": "Associate Professor"},
        {"employee_id": "FAC003", "name": "Prof. Suresh Nair", "email": "suresh.nair@smartexam.edu", "department_id": cs_dept.id, "designation": "Assistant Professor"},
    ]
    for f in faculty_data:
        if not db.query(Faculty).filter(Faculty.employee_id == f["employee_id"]).first():
            db.add(Faculty(**f))

    # 7. Subjects
    subjects_data = [
        {"subject_code": "CSE3001", "subject_name": "Database Management Systems", "department_id": cs_dept.id, "program_id": btech_cs.id, "semester_id": sem6.id, "exam_duration_minutes": 180},
        {"subject_code": "CSE3002", "subject_name": "Operating Systems", "department_id": cs_dept.id, "program_id": btech_cs.id, "semester_id": sem6.id, "exam_duration_minutes": 180},
        {"subject_code": "CSE3003", "subject_name": "Computer Networks", "department_id": cs_dept.id, "program_id": btech_cs.id, "semester_id": sem6.id, "exam_duration_minutes": 180},
    ]
    for s in subjects_data:
        if not db.query(Subject).filter(Subject.subject_code == s["subject_code"]).first():
            db.add(Subject(**s))

    # 8. Exam Slots
    base_date = datetime.date(2026, 12, 10)
    slots_data = [
        {"exam_date": base_date, "start_time": datetime.time(9, 0), "end_time": datetime.time(12, 0), "session_name": "MORNING"},
        {"exam_date": base_date, "start_time": datetime.time(14, 0), "end_time": datetime.time(17, 0), "session_name": "AFTERNOON"},
        {"exam_date": base_date + datetime.timedelta(days=1), "start_time": datetime.time(9, 0), "end_time": datetime.time(12, 0), "session_name": "MORNING"},
    ]
    for slot in slots_data:
        existing = db.query(ExamSlot).filter(
            ExamSlot.exam_date == slot["exam_date"],
            ExamSlot.session_name == slot["session_name"]
        ).first()
        if not existing:
            db.add(ExamSlot(**slot))

    # 9. Constraints Metadata
    constraints_data = [
        {"code": "HC-01", "name": "Student Exam Clash", "type": "HARD", "description": "Student cannot have 2 exams in the same slot."},
        {"code": "HC-02", "name": "Room Capacity Violation", "type": "HARD", "description": "Room capacity must fit enrolled students."},
        {"code": "HC-03", "name": "Room Overbooking", "type": "HARD", "description": "Room cannot host 2 exams in the same slot."},
        {"code": "HC-04", "name": "Faculty Duty Collision", "type": "HARD", "description": "Faculty cannot supervise 2 rooms in the same slot."},
        {"code": "SC-01", "name": "Consecutive Exam Spacing", "type": "SOFT", "description": "Penalize consecutive exams on same/adjacent days."},
        {"code": "SC-02", "name": "Faculty Workload Imbalance", "type": "SOFT", "description": "Penalize uneven invigilation duty distribution."},
    ]
    for c in constraints_data:
        if not db.query(Constraint).filter(Constraint.code == c["code"]).first():
            db.add(Constraint(**c))

    db.commit()
