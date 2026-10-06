from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger

from app.api.auth import router as auth_router
from app.api.departments import router as departments_router
from app.api.programs import router as programs_router
from app.api.semesters import router as semesters_router
from app.api.divisions import router as divisions_router
from app.api.students import router as students_router
from app.api.subjects import router as subjects_router
from app.api.faculty import router as faculty_router
from app.api.rooms import router as rooms_router
from app.api.exam_slots import router as exam_slots_router
from app.api.import_data import router as import_router
from app.api.constraints import router as constraints_router
from app.api.scheduler import router as scheduler_router
from app.api.timetables import router as timetables_router

from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SmartExam Examination Timetable Optimization & Scheduling System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

@app.on_event("startup")
def startup_db_seed():
    """Ensure database tables exist and initial admin users are seeded on startup."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers (both /api and root prefix for Vercel serverless routing)
api_routers = [
    auth_router, departments_router, programs_router, semesters_router,
    divisions_router, students_router, subjects_router, faculty_router,
    rooms_router, exam_slots_router, import_router, constraints_router
]
for r in api_routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    app.include_router(r, prefix="")

app.include_router(scheduler_router, prefix=f"{settings.API_V1_STR}/scheduler", tags=["Scheduler"])
app.include_router(scheduler_router, prefix="/scheduler", tags=["Scheduler"])

app.include_router(timetables_router, prefix=f"{settings.API_V1_STR}/timetables", tags=["Timetables"])
app.include_router(timetables_router, prefix="/timetables", tags=["Timetables"])


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    """System Health Check Endpoint."""
    logger.info("Health check ping received.")
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
