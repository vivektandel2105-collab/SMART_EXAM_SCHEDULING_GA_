from typing import Any
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.api.deps import require_roles
from app.services.import_service import DataImportService

router = APIRouter(prefix="/import", tags=["Data Import"])


@router.post("/students")
async def import_students_file(
    file: UploadFile = File(...),
    dry_run: bool = Query(False, description="If true, performs a validation preview without saving to database"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
) -> Any:
    """Upload Excel/CSV file to bulk import or preview students."""
    contents = await file.read()
    try:
        res = DataImportService.import_students(contents, file.filename, db, dry_run=dry_run)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/subjects")
async def import_subjects_file(
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
) -> Any:
    """Upload Excel/CSV file to bulk import or preview subjects."""
    contents = await file.read()
    try:
        res = DataImportService.import_subjects(contents, file.filename, db, dry_run=dry_run)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/faculty")
async def import_faculty_file(
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
) -> Any:
    """Upload Excel/CSV file to bulk import or preview faculty members."""
    contents = await file.read()
    try:
        res = DataImportService.import_faculty(contents, file.filename, db, dry_run=dry_run)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/rooms")
async def import_rooms_file(
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
) -> Any:
    """Upload Excel/CSV file to bulk import or preview rooms."""
    contents = await file.read()
    try:
        res = DataImportService.import_rooms(contents, file.filename, db, dry_run=dry_run)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/enrollments")
async def import_enrollments_file(
    file: UploadFile = File(...),
    dry_run: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.EXAM_ADMIN)),
) -> Any:
    """Upload Excel/CSV file to bulk import or preview student-subject enrollments."""
    contents = await file.read()
    try:
        res = DataImportService.import_enrollments(contents, file.filename, db, dry_run=dry_run)
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
