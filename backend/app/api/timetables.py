from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.timetable import Timetable, TimetableVersion
from app.models.exam import ExamAssignment, InvigilationAssignment, ExamSlot, Exam
from app.models.subject import Subject
from app.models.room import Room
from app.models.faculty import Faculty
from app.services import timetable_service

router = APIRouter()


# --- Pydantic Schemas ---

class TimetableVersionSummaryResponse(BaseModel):
    id: str
    version_number: int
    status: str
    fitness_score: Optional[float] = None
    hard_violations: int
    soft_violations: int
    created_at: Optional[str] = None


class TimetableResponse(BaseModel):
    id: str
    name: str
    academic_year: str
    status: str
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    published_at: Optional[str] = None
    created_at: Optional[str] = None


class TimetableDetailResponse(TimetableResponse):
    versions: List[TimetableVersionSummaryResponse] = []


class ExamAssignmentResponse(BaseModel):
    id: str
    timetable_version_id: str
    exam_id: str
    slot_id: Optional[str] = None
    room_id: Optional[str] = None
    faculty_id: Optional[str] = None
    is_locked: bool
    subject_code: Optional[str] = None
    subject_name: Optional[str] = None
    room_number: Optional[str] = None
    faculty_name: Optional[str] = None
    exam_date: Optional[str] = None
    session_name: Optional[str] = None


class TimetableVersionDetailResponse(TimetableVersionSummaryResponse):
    timetable_id: str
    assignments: List[ExamAssignmentResponse] = []


class LockAssignmentRequest(BaseModel):
    is_locked: bool


class UpdateStatusRequest(BaseModel):
    status: str


class AutoInvigilateResponse(BaseModel):
    version_id: str
    total_assignments_created: int
    message: str


# --- API Endpoints ---

@router.get("", response_model=List[TimetableResponse])
def list_timetables(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List timetables with optional search and status filtering."""
    query = db.query(Timetable)
    if search:
        query = query.filter(Timetable.name.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(Timetable.status == status_filter)

    timetables = query.order_by(Timetable.created_at.desc()).offset(offset).limit(limit).all()

    res = []
    for t in timetables:
        res.append(TimetableResponse(
            id=t.id,
            name=t.name,
            academic_year=t.academic_year,
            status=t.status,
            created_by=t.created_by,
            approved_by=t.approved_by,
            published_at=t.published_at.isoformat() if t.published_at else None,
            created_at=t.created_at.isoformat() if t.created_at else None,
        ))
    return res


@router.get("/versions/compare")
def compare_timetable_versions(
    v1_id: str,
    v2_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare two timetable versions and return diff analysis."""
    try:
        return timetable_service.compare_versions(db, v1_id, v2_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{timetable_id}", response_model=TimetableDetailResponse)
def get_timetable_detail(
    timetable_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch timetable metadata and full version history."""
    t = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Timetable '{timetable_id}' not found.")

    versions_summary = []
    for v in sorted(t.versions, key=lambda x: x.version_number, reverse=True):
        versions_summary.append(TimetableVersionSummaryResponse(
            id=v.id,
            version_number=v.version_number,
            status=v.status,
            fitness_score=v.fitness_score,
            hard_violations=v.hard_violations,
            soft_violations=v.soft_violations,
            created_at=v.created_at.isoformat() if v.created_at else None,
        ))

    return TimetableDetailResponse(
        id=t.id,
        name=t.name,
        academic_year=t.academic_year,
        status=t.status,
        created_by=t.created_by,
        approved_by=t.approved_by,
        published_at=t.published_at.isoformat() if t.published_at else None,
        created_at=t.created_at.isoformat() if t.created_at else None,
        versions=versions_summary,
    )


@router.get("/versions/{version_id}", response_model=TimetableVersionDetailResponse)
def get_timetable_version_detail(
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch detailed timetable version with all exam assignments."""
    v = db.query(TimetableVersion).filter(TimetableVersion.id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"Timetable version '{version_id}' not found.")

    assignment_responses = []
    for a in v.assignments:
        exam = db.query(Exam).filter(Exam.id == a.exam_id).first() if a.exam_id else None
        subject = db.query(Subject).filter(Subject.id == exam.subject_id).first() if exam and exam.subject_id else None
        slot = db.query(ExamSlot).filter(ExamSlot.id == a.slot_id).first() if a.slot_id else None
        room = db.query(Room).filter(Room.id == a.room_id).first() if a.room_id else None
        fac = db.query(Faculty).filter(Faculty.id == a.faculty_id).first() if a.faculty_id else None

        assignment_responses.append(ExamAssignmentResponse(
            id=a.id,
            timetable_version_id=a.timetable_version_id,
            exam_id=a.exam_id,
            slot_id=a.slot_id,
            room_id=a.room_id,
            faculty_id=a.faculty_id,
            is_locked=a.is_locked,
            subject_code=subject.subject_code if subject else None,
            subject_name=subject.subject_name if subject else None,
            room_number=room.room_number if room else None,
            faculty_name=fac.name if fac else None,
            exam_date=slot.exam_date.isoformat() if slot and slot.exam_date else None,
            session_name=slot.session_name if slot else None,
        ))

    return TimetableVersionDetailResponse(
        id=v.id,
        timetable_id=v.timetable_id,
        version_number=v.version_number,
        status=v.status,
        fitness_score=v.fitness_score,
        hard_violations=v.hard_violations,
        soft_violations=v.soft_violations,
        created_at=v.created_at.isoformat() if v.created_at else None,
        assignments=assignment_responses,
    )


@router.post("/assignments/{assignment_id}/lock", response_model=ExamAssignmentResponse)
def lock_assignment(
    assignment_id: str,
    req: LockAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Lock or unlock an individual exam assignment."""
    try:
        updated = timetable_service.lock_exam_assignment(db, assignment_id, req.is_locked)
        return ExamAssignmentResponse(
            id=updated.id,
            timetable_version_id=updated.timetable_version_id,
            exam_id=updated.exam_id,
            slot_id=updated.slot_id,
            room_id=updated.room_id,
            faculty_id=updated.faculty_id,
            is_locked=updated.is_locked,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/versions/{version_id}/auto-invigilate", response_model=AutoInvigilateResponse)
def auto_assign_invigilators(
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Automatically allocate faculty invigilators to exam rooms."""
    try:
        created = timetable_service.assign_invigilators(db, version_id)
        return AutoInvigilateResponse(
            version_id=version_id,
            total_assignments_created=len(created),
            message=f"Successfully auto-assigned {len(created)} invigilators across exam rooms.",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{timetable_id}/status", response_model=TimetableResponse)
def update_timetable_lifecycle_status(
    timetable_id: str,
    req: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
):
    """Update timetable status (e.g. APPROVED, PUBLISHED, ARCHIVED)."""
    try:
        updated = timetable_service.update_timetable_status(
            db=db,
            timetable_id=timetable_id,
            new_status=req.status,
            user_id=current_user.id,
        )
        return TimetableResponse(
            id=updated.id,
            name=updated.name,
            academic_year=updated.academic_year,
            status=updated.status,
            created_by=updated.created_by,
            approved_by=updated.approved_by,
            published_at=updated.published_at.isoformat() if updated.published_at else None,
            created_at=updated.created_at.isoformat() if updated.created_at else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/versions/{version_id}/export")
def export_timetable(
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export timetable version as a formatted Excel spreadsheet."""
    try:
        excel_buffer = timetable_service.export_timetable_excel(db, version_id)
        filename = f"Timetable_Export_{version_id[:8]}.xlsx"
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
