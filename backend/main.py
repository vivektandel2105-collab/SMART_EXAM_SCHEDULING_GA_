import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Use writable /tmp directory for SQLite DB on Vercel serverless functions
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/smartexam.db")

from app.main import app
