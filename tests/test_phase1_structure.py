import os
import pytest

REQUIRED_PATHS = [
    "backend/app/main.py",
    "backend/app/core/config.py",
    "backend/app/core/database.py",
    "backend/app/core/security.py",
    "backend/app/core/logging.py",
    "backend/requirements.txt",
    "frontend/package.json",
    "frontend/vite.config.js",
    "frontend/index.html",
    "frontend/src/App.jsx",
    "database/schema.sql",
    "database/seed.sql",
    "sample_data/students.csv",
    "sample_data/subjects.csv",
    "sample_data/faculty.csv",
    "sample_data/rooms.csv",
    "sample_data/enrollments.csv",
    "docs/requirements.md",
    "docs/architecture.md",
    "docs/database.md",
    "docs/genetic_algorithm.md",
    "docs/api.md",
    "docs/testing.md",
    ".env.example",
    ".gitignore",
    "docker-compose.yml",
    "README.md",
]


def test_phase1_project_structure():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    missing = []
    for rel_path in REQUIRED_PATHS:
        full_path = os.path.join(root_dir, rel_path)
        if not os.path.exists(full_path):
            missing.append(rel_path)
    assert not missing, f"Missing Phase 1 structure files: {missing}"
