import io
from typing import Dict, Any, List
import pandas as pd
from sqlalchemy.orm import Session

from app.models.academic import Department, Program, Semester
from app.models.student import Student, StudentSubject
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.room import Room


class DataImportService:

    @staticmethod
    def _read_dataframe(file_bytes: bytes, filename: str) -> pd.DataFrame:
        filename_lower = filename.lower()
        if filename_lower.endswith(".csv"):
            return pd.read_csv(io.BytesIO(file_bytes))
        elif filename_lower.endswith(".xlsx") or filename_lower.endswith(".xls"):
            return pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise ValueError("Unsupported file format. Only .csv and .xlsx files are supported.")

    @classmethod
    def import_students(cls, file_bytes: bytes, filename: str, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        df = cls._read_dataframe(file_bytes, filename)
        required_cols = {"roll_number", "name", "email"}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
            return {"success": False, "error": f"Missing required columns: {list(missing_cols)}"}

        errors: List[Dict[str, Any]] = []
        students_to_add: List[Student] = []
        seen_rolls = set()
        seen_emails = set()

        for idx, row in df.iterrows():
            row_num = idx + 2  # 1-indexed header + 1
            roll = str(row["roll_number"]).strip() if pd.notna(row["roll_number"]) else ""
            name = str(row["name"]).strip() if pd.notna(row["name"]) else ""
            email = str(row["email"]).strip() if pd.notna(row["email"]) else ""
            prog_code = str(row["program_code"]).strip() if "program_code" in row and pd.notna(row["program_code"]) else None

            if not roll or not name or not email:
                errors.append({"row": row_num, "error": "Missing roll_number, name, or email"})
                continue

            if roll in seen_rolls:
                errors.append({"row": row_num, "error": f"Duplicate roll_number '{roll}' in file"})
                continue
            seen_rolls.add(roll)

            if email in seen_emails:
                errors.append({"row": row_num, "error": f"Duplicate email '{email}' in file"})
                continue
            seen_emails.add(email)

            if db.query(Student).filter(Student.roll_number == roll).first():
                errors.append({"row": row_num, "error": f"Roll number '{roll}' already exists in database"})
                continue

            if db.query(Student).filter(Student.email == email).first():
                errors.append({"row": row_num, "error": f"Email '{email}' already exists in database"})
                continue

            program_id = None
            if prog_code:
                prog = db.query(Program).filter(Program.code == prog_code).first()
                if not prog:
                    errors.append({"row": row_num, "error": f"Program code '{prog_code}' does not exist"})
                    continue
                program_id = prog.id

            students_to_add.append(Student(roll_number=roll, name=name, email=email, program_id=program_id))

        if not dry_run and not errors and students_to_add:
            db.add_all(students_to_add)
            db.commit()

        return {
            "success": len(errors) == 0,
            "total_rows": len(df),
            "valid_rows": len(students_to_add),
            "invalid_rows": len(errors),
            "errors": errors,
            "dry_run": dry_run,
        }

    @classmethod
    def import_subjects(cls, file_bytes: bytes, filename: str, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        df = cls._read_dataframe(file_bytes, filename)
        required_cols = {"subject_code", "subject_name"}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
            return {"success": False, "error": f"Missing required columns: {list(missing_cols)}"}

        errors: List[Dict[str, Any]] = []
        subjects_to_add: List[Subject] = []
        seen_codes = set()

        for idx, row in df.iterrows():
            row_num = idx + 2
            code = str(row["subject_code"]).strip() if pd.notna(row["subject_code"]) else ""
            name = str(row["subject_name"]).strip() if pd.notna(row["subject_name"]) else ""
            dept_code = str(row["department_code"]).strip() if "department_code" in row and pd.notna(row["department_code"]) else None
            duration = int(row["exam_duration_minutes"]) if "exam_duration_minutes" in row and pd.notna(row["exam_duration_minutes"]) else 180

            if not code or not name:
                errors.append({"row": row_num, "error": "Missing subject_code or subject_name"})
                continue

            if code in seen_codes:
                errors.append({"row": row_num, "error": f"Duplicate subject_code '{code}' in file"})
                continue
            seen_codes.add(code)

            if db.query(Subject).filter(Subject.subject_code == code).first():
                errors.append({"row": row_num, "error": f"Subject code '{code}' already exists in database"})
                continue

            dept_id = None
            if dept_code:
                dept = db.query(Department).filter(Department.code == dept_code).first()
                if dept:
                    dept_id = dept.id

            subjects_to_add.append(Subject(subject_code=code, subject_name=name, department_id=dept_id, exam_duration_minutes=duration))

        if not dry_run and not errors and subjects_to_add:
            db.add_all(subjects_to_add)
            db.commit()

        return {
            "success": len(errors) == 0,
            "total_rows": len(df),
            "valid_rows": len(subjects_to_add),
            "invalid_rows": len(errors),
            "errors": errors,
            "dry_run": dry_run,
        }

    @classmethod
    def import_faculty(cls, file_bytes: bytes, filename: str, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        df = cls._read_dataframe(file_bytes, filename)
        required_cols = {"employee_id", "name", "email"}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
            return {"success": False, "error": f"Missing required columns: {list(missing_cols)}"}

        errors: List[Dict[str, Any]] = []
        faculty_to_add: List[Faculty] = []
        seen_ids = set()

        for idx, row in df.iterrows():
            row_num = idx + 2
            emp_id = str(row["employee_id"]).strip() if pd.notna(row["employee_id"]) else ""
            name = str(row["name"]).strip() if pd.notna(row["name"]) else ""
            email = str(row["email"]).strip() if pd.notna(row["email"]) else ""
            designation = str(row["designation"]).strip() if "designation" in row and pd.notna(row["designation"]) else None

            if not emp_id or not name or not email:
                errors.append({"row": row_num, "error": "Missing employee_id, name, or email"})
                continue

            if emp_id in seen_ids:
                errors.append({"row": row_num, "error": f"Duplicate employee_id '{emp_id}' in file"})
                continue
            seen_ids.add(emp_id)

            if db.query(Faculty).filter(Faculty.employee_id == emp_id).first():
                errors.append({"row": row_num, "error": f"Employee ID '{emp_id}' already exists in database"})
                continue

            faculty_to_add.append(Faculty(employee_id=emp_id, name=name, email=email, designation=designation))

        if not dry_run and not errors and faculty_to_add:
            db.add_all(faculty_to_add)
            db.commit()

        return {
            "success": len(errors) == 0,
            "total_rows": len(df),
            "valid_rows": len(faculty_to_add),
            "invalid_rows": len(errors),
            "errors": errors,
            "dry_run": dry_run,
        }

    @classmethod
    def import_rooms(cls, file_bytes: bytes, filename: str, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        df = cls._read_dataframe(file_bytes, filename)
        required_cols = {"room_number", "building", "capacity"}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
            return {"success": False, "error": f"Missing required columns: {list(missing_cols)}"}

        errors: List[Dict[str, Any]] = []
        rooms_to_add: List[Room] = []
        seen_rooms = set()

        for idx, row in df.iterrows():
            row_num = idx + 2
            room_num = str(row["room_number"]).strip() if pd.notna(row["room_number"]) else ""
            building = str(row["building"]).strip() if pd.notna(row["building"]) else ""
            floor = int(row["floor"]) if "floor" in row and pd.notna(row["floor"]) else 1
            capacity = int(row["capacity"]) if pd.notna(row["capacity"]) else 0
            room_type = str(row["room_type"]).strip() if "room_type" in row and pd.notna(row["room_type"]) else "CLASSROOM"

            if not room_num or not building or capacity <= 0:
                errors.append({"row": row_num, "error": "Invalid room_number, building, or capacity <= 0"})
                continue

            if room_num in seen_rooms:
                errors.append({"row": row_num, "error": f"Duplicate room_number '{room_num}' in file"})
                continue
            seen_rooms.add(room_num)

            if db.query(Room).filter(Room.room_number == room_num).first():
                errors.append({"row": row_num, "error": f"Room number '{room_num}' already exists in database"})
                continue

            rooms_to_add.append(Room(room_number=room_num, building=building, floor=floor, capacity=capacity, room_type=room_type))

        if not dry_run and not errors and rooms_to_add:
            db.add_all(rooms_to_add)
            db.commit()

        return {
            "success": len(errors) == 0,
            "total_rows": len(df),
            "valid_rows": len(rooms_to_add),
            "invalid_rows": len(errors),
            "errors": errors,
            "dry_run": dry_run,
        }

    @classmethod
    def import_enrollments(cls, file_bytes: bytes, filename: str, db: Session, dry_run: bool = False) -> Dict[str, Any]:
        df = cls._read_dataframe(file_bytes, filename)
        required_cols = {"roll_number", "subject_code"}
        missing_cols = required_cols - set(df.columns)
        if missing_cols:
            return {"success": False, "error": f"Missing required columns: {list(missing_cols)}"}

        errors: List[Dict[str, Any]] = []
        enrollments_to_add: List[StudentSubject] = []
        seen_pairs = set()

        for idx, row in df.iterrows():
            row_num = idx + 2
            roll = str(row["roll_number"]).strip() if pd.notna(row["roll_number"]) else ""
            sub_code = str(row["subject_code"]).strip() if pd.notna(row["subject_code"]) else ""

            if not roll or not sub_code:
                errors.append({"row": row_num, "error": "Missing roll_number or subject_code"})
                continue

            pair = (roll, sub_code)
            if pair in seen_pairs:
                errors.append({"row": row_num, "error": f"Duplicate enrollment ({roll}, {sub_code}) in file"})
                continue
            seen_pairs.add(pair)

            student = db.query(Student).filter(Student.roll_number == roll).first()
            if not student:
                errors.append({"row": row_num, "error": f"Student with roll_number '{roll}' not found"})
                continue

            subject = db.query(Subject).filter(Subject.subject_code == sub_code).first()
            if not subject:
                errors.append({"row": row_num, "error": f"Subject with code '{sub_code}' not found"})
                continue

            existing = db.query(StudentSubject).filter(
                StudentSubject.student_id == student.id,
                StudentSubject.subject_id == subject.id
            ).first()
            if existing:
                errors.append({"row": row_num, "error": f"Enrollment ({roll}, {sub_code}) already exists in database"})
                continue

            enrollments_to_add.append(StudentSubject(student_id=student.id, subject_id=subject.id))

        if not dry_run and not errors and enrollments_to_add:
            db.add_all(enrollments_to_add)
            db.commit()

        return {
            "success": len(errors) == 0,
            "total_rows": len(df),
            "valid_rows": len(enrollments_to_add),
            "invalid_rows": len(errors),
            "errors": errors,
            "dry_run": dry_run,
        }
