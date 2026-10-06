import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# If running on Vercel or environment variable set, use /tmp database path for SQLite
db_url = settings.DATABASE_URL
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    if db_url.startswith("sqlite"):
        db_url = "sqlite:////tmp/smartexam.db"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

_db_initialized = False

def init_db_if_needed():
    global _db_initialized
    if not _db_initialized:
        try:
            Base.metadata.create_all(bind=engine)
            from app.services.seed_service import seed_database
            db = SessionLocal()
            try:
                seed_database(db)
            finally:
                db.close()
            _db_initialized = True
        except Exception as e:
            print(f"Database init error: {e}")

def get_db():
    """Dependency for obtaining database session per request."""
    init_db_if_needed()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
