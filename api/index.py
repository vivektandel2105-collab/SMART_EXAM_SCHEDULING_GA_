import os
import sys

# Ensure backend directory is in python path
backend_dir = os.path.join(os.path.dirname(__file__), "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Use writable /tmp directory for SQLite DB on Vercel serverless functions
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/smartexam.db")

from app.main import app
