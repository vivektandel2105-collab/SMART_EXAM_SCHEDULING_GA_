import io
import datetime
from typing import Dict, Any, List, Optional, Set, Tuple
from sqlalchemy.orm import Session
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from app.models.timetable import Timetable, TimetableVersion
from app.models.exam import ExamAssignment, InvigilationAssignment, ExamSlot, Exam
from app.models.subject import Subject
from app.models.room import Room
from app.models.faculty import Faculty, FacultyAvailability


def lock_exam_assignment(db: Session, assignment_id: str, is_locked: bool) -> ExamAssignment:
    """Toggles lock state for a specific exam assignment."""
    assignment = db.query(ExamAssignment).filter(ExamAssignment.id == assignment_id).first()
    if not assignment:
        raise ValueError(f"Exam assignment '{assignment_id}' not found.")
    assignment.is_locked = is_locked
    db.commit()
    db.refresh(assignment)
    return assignment


def assign_invigilators(db: Session, version_id: str) -> List[InvigilationAssignment]:
    """Automatically assigns faculty invigilators to exam rooms for a timetable version."""
    version = db.query(TimetableVersion).filter(TimetableVersion.id == version_id).first()
    if not version:
        raise ValueError(f"Timetable version '{version_id}' not found.")

    # 1. Fetch active assignments and faculty members
    assignments = db.query(ExamAssignment).filter(ExamAssignment.timetable_version_id == version_id).all()
    all_faculty = db.query(Faculty).filter(Faculty.is_active == True).all()

    if not all_faculty:
        raise ValueError("No active faculty members available for invigilation assignment.")

    # Fetch faculty unavailabilities
    fac_unavail = db.query(FacultyAvailability).filter(FacultyAvailability.is_available == False).all()
    unavail_set: Set[Tuple[str, str]] = {(f.faculty_id, f.slot_id) for f in fac_unavail}

    # Delete existing invigilation assignments for this version
    db.query(InvigilationAssignment).filter(InvigilationAssignment.timetable_version_id == version_id).delete()
    db.commit()

    # Track duties per faculty
    faculty_duties: Dict[str, int] = {f.id: 0 for f in all_faculty}

    # Group assignments by slot & room
    slot_rooms: Dict[Tuple[str, str], List[ExamAssignment]] = {}
    for a in assignments:
        if a.slot_id and a.room_id:
            slot_rooms.setdefault((a.slot_id, a.room_id), []).append(a)

    created_invigilations: List[InvigilationAssignment] = []
    # Track faculty assigned per slot to prevent double-booking
    slot_faculty_assigned: Dict[str, Set[str]] = {}

    for (slot_id, room_id), exam_list in slot_rooms.items():
        slot_faculty_assigned.setdefault(slot_id, set())

        # Filter candidates available for this slot and not already assigned in this slot
        candidates = [
            f for f in all_faculty
            if (f.id, slot_id) not in unavail_set and f.id not in slot_faculty_assigned[slot_id]
        ]

        if not candidates:
            # Fallback: candidate not assigned in this slot
            candidates = [f for f in all_faculty if f.id not in slot_faculty_assigned[slot_id]]

        if not candidates:
            # Fallback: all faculty
            candidates = all_faculty

        # Pick candidate with minimum duty count
        selected_fac = min(candidates, key=lambda f: faculty_duties[f.id])

        # Assign invigilator
        invig = InvigilationAssignment(
            timetable_version_id=version_id,
            faculty_id=selected_fac.id,
            slot_id=slot_id,
            room_id=room_id,
        )
        db.add(invig)
        created_invigilations.append(invig)

        faculty_duties[selected_fac.id] += 1
        slot_faculty_assigned[slot_id].add(selected_fac.id)

        # Update exam assignments with selected faculty invigilator
        for ex_assign in exam_list:
            ex_assign.faculty_id = selected_fac.id

    db.commit()
    return created_invigilations


def compare_versions(db: Session, version_id_1: str, version_id_2: str) -> Dict[str, Any]:
    """Compares two timetable versions and returns detailed assignment diffs."""
    v1 = db.query(TimetableVersion).filter(TimetableVersion.id == version_id_1).first()
    v2 = db.query(TimetableVersion).filter(TimetableVersion.id == version_id_2).first()

    if not v1 or not v2:
        raise ValueError("One or both specified timetable versions were not found.")

    assignments_1 = db.query(ExamAssignment).filter(ExamAssignment.timetable_version_id == version_id_1).all()
    assignments_2 = db.query(ExamAssignment).filter(ExamAssignment.timetable_version_id == version_id_2).all()

    map1 = {a.exam_id: a for a in assignments_1}
    map2 = {a.exam_id: a for a in assignments_2}

    added: List[Dict[str, Any]] = []
    removed: List[Dict[str, Any]] = []
    modified: List[Dict[str, Any]] = []
    unchanged: List[Dict[str, Any]] = []

    all_exam_ids = set(map1.keys()).union(set(map2.keys()))

    for exam_id in all_exam_ids:
        a1 = map1.get(exam_id)
        a2 = map2.get(exam_id)

        if a1 and not a2:
            removed.append({"exam_id": exam_id, "v1_slot": a1.slot_id, "v1_room": a1.room_id})
        elif a2 and not a1:
            added.append({"exam_id": exam_id, "v2_slot": a2.slot_id, "v2_room": a2.room_id})
        elif a1 and a2:
            changes = {}
            if a1.slot_id != a2.slot_id:
                changes["slot_id"] = {"from": a1.slot_id, "to": a2.slot_id}
            if a1.room_id != a2.room_id:
                changes["room_id"] = {"from": a1.room_id, "to": a2.room_id}
            if a1.faculty_id != a2.faculty_id:
                changes["faculty_id"] = {"from": a1.faculty_id, "to": a2.faculty_id}

            if changes:
                modified.append({
                    "exam_id": exam_id,
                    "changes": changes,
                })
            else:
                unchanged.append({
                    "exam_id": exam_id,
                    "slot_id": a1.slot_id,
                    "room_id": a1.room_id,
                })

    return {
        "version_1": {"id": v1.id, "version_number": v1.version_number, "fitness_score": v1.fitness_score},
        "version_2": {"id": v2.id, "version_number": v2.version_number, "fitness_score": v2.fitness_score},
        "summary": {
            "total_added": len(added),
            "total_removed": len(removed),
            "total_modified": len(modified),
            "total_unchanged": len(unchanged),
        },
        "added": added,
        "removed": removed,
        "modified": modified,
        "unchanged": unchanged,
    }


def update_timetable_status(
    db: Session, timetable_id: str, new_status: str, user_id: Optional[str] = None
) -> Timetable:
    """Updates timetable status and triggers publishing/approval locks."""
    valid_statuses = {"DRAFT", "GENERATED", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"}
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status '{new_status}'. Allowed statuses: {valid_statuses}")

    timetable = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not timetable:
        raise ValueError(f"Timetable '{timetable_id}' not found.")

    timetable.status = new_status

    if new_status == "APPROVED":
        timetable.approved_by = user_id

    if new_status == "PUBLISHED":
        timetable.published_at = datetime.datetime.utcnow()
        # Lock all assignments in the latest version
        latest_version = (
            db.query(TimetableVersion)
            .filter(TimetableVersion.timetable_id == timetable_id)
            .order_by(TimetableVersion.version_number.desc())
            .first()
        )
        if latest_version:
            db.query(ExamAssignment).filter(ExamAssignment.timetable_version_id == latest_version.id).update(
                {"is_locked": True}
            )

    db.commit()
    db.refresh(timetable)
    return timetable


def export_timetable_excel(db: Session, version_id: str) -> io.BytesIO:
    """Generates a beautifully formatted multi-sheet Excel workbook for a timetable version."""
    version = db.query(TimetableVersion).filter(TimetableVersion.id == version_id).first()
    if not version:
        raise ValueError(f"Timetable version '{version_id}' not found.")

    assignments = db.query(ExamAssignment).filter(ExamAssignment.timetable_version_id == version_id).all()

    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Calibri", size=16, bold=True, color="1F4E78")
    border_style = Border(
        left=Side(style="thin", color="D9D9D9"),
        right=Side(style="thin", color="D9D9D9"),
        top=Side(style="thin", color="D9D9D9"),
        bottom=Side(style="thin", color="D9D9D9"),
    )

    # Sheet 1: Master Schedule
    ws1 = wb.create_sheet(title="Master Exam Schedule")
    ws1.cell(row=1, column=1, value=f"Master Examination Schedule - Version {version.version_number}").font = title_font

    headers1 = ["Exam Date", "Session", "Start Time", "End Time", "Subject Code", "Subject Name", "Room Number", "Building", "Invigilator"]
    for col_num, h_text in enumerate(headers1, 1):
        cell = ws1.cell(row=3, column=col_num, value=h_text)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    row_idx = 4
    for a in assignments:
        exam = db.query(Exam).filter(Exam.id == a.exam_id).first() if a.exam_id else None
        subject = db.query(Subject).filter(Subject.id == exam.subject_id).first() if exam and exam.subject_id else None
        slot = db.query(ExamSlot).filter(ExamSlot.id == a.slot_id).first() if a.slot_id else None
        room = db.query(Room).filter(Room.id == a.room_id).first() if a.room_id else None
        fac = db.query(Faculty).filter(Faculty.id == a.faculty_id).first() if a.faculty_id else None

        ws1.cell(row=row_idx, column=1, value=slot.exam_date.strftime("%Y-%m-%d") if slot and slot.exam_date else "TBD")
        ws1.cell(row=row_idx, column=2, value=slot.session_name if slot else "TBD")
        ws1.cell(row=row_idx, column=3, value=slot.start_time.strftime("%H:%M") if slot and slot.start_time else "TBD")
        ws1.cell(row=row_idx, column=4, value=slot.end_time.strftime("%H:%M") if slot and slot.end_time else "TBD")
        ws1.cell(row=row_idx, column=5, value=subject.subject_code if subject else "N/A")
        ws1.cell(row=row_idx, column=6, value=subject.subject_name if subject else "N/A")
        ws1.cell(row=row_idx, column=7, value=room.room_number if room else "Unassigned")
        ws1.cell(row=row_idx, column=8, value=room.building if room else "N/A")
        ws1.cell(row=row_idx, column=9, value=fac.name if fac else "Unassigned")

        for col_num in range(1, 10):
            ws1.cell(row=row_idx, column=col_num).border = border_style
        row_idx += 1

    # Auto-adjust column widths
    for col in ws1.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws1.column_dimensions[col_letter].width = max(max_len + 3, 12)

    # Save to buffer
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
