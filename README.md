# SmartExam – Exam Scheduling Using Genetic Algorithm

**Tagline:** Automated, Conflict-Free and Optimized Examination Timetabling  
**Primary Optimization Technique:** Genetic Algorithm (GA)  
**Backend:** Python 3.10+ / FastAPI / SQLAlchemy / Pydantic  
**Frontend:** React.js / Vite / Tailwind CSS  
**Database:** PostgreSQL (with SQLite for local development)  

---

## 📌 Project Overview

SmartExam is a production-grade web application and optimization engine for colleges and universities. It handles complex institutional constraints including:
- Zero student exam collisions (same time slot)
- Room capacity and availability matching
- Invigilator (Faculty) duty distribution and availability
- Manual lock preservation for pre-assigned exams
- Configurable soft constraint penalization (consecutive exam spacing, daily exam limits, faculty workload balance)
- Timetable versioning, human-in-the-loop review, and publishing workflows

---

## 📁 Repository Directory Structure

```text
SmartExam/
├── backend/                  # FastAPI Application Core & GA Engine
│   ├── app/
│   │   ├── main.py           # Application Entry Point
│   │   ├── core/             # Configuration, Database & Security
│   │   ├── models/           # SQLAlchemy ORM Models
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── api/              # REST Endpoints
│   │   ├── services/         # Excel Import, Validation & Export
│   │   └── genetic_algorithm/# Core GA Optimization Engine
│   ├── tests/                # Backend & GA Unit/Integration Tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React Web Portal
│   ├── src/
│   │   ├── components/       # Reusable UI Components & Charts
│   │   ├── pages/            # Admin, Faculty, & Student Dashboards
│   │   ├── services/         # Axios API Clients
│   │   └── context/          # Authentication & App Context
│   ├── package.json
│   └── Dockerfile
├── database/                 # Schema & SQL Seed Scripts
│   ├── schema.sql
│   └── seed.sql
├── sample_data/              # Sample Benchmark Data Templates (CSV/Excel)
│   ├── students.csv
│   ├── subjects.csv
│   ├── faculty.csv
│   ├── rooms.csv
│   └── enrollments.csv
├── docs/                     # Full Technical Documentation Suite
│   ├── requirements.md
│   ├── architecture.md
│   ├── database.md
│   ├── genetic_algorithm.md
│   ├── api.md
│   └── testing.md
├── tests/                    # Top-level Integration / E2E Tests
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL (Optional for local dev, SQLite is configured as default fallback)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp ../.env.example .env
pytest
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The React frontend will start at `http://localhost:5173` (or `http://localhost:3000`).

---

## 🧬 Genetic Algorithm Architecture Summary

- **Chromosome**: Candidate timetable represented as a list of genes `(exam_id, slot_id, room_id, faculty_id)`.
- **Fitness Function**: $Cost = W_{hard} \times HardViolations + \sum W_{soft} \times SoftPenalty$.
- **Hard Constraints (HC)**: Student conflicts, room conflicts, room capacity, faculty conflicts, availability, locked assignment preservation.
- **Repair Mechanism**: Intelligent repair pass before fitness calculation to convert invalid offspring into valid feasible timetables.
- **Elitism**: Retains top $N$ fittest schedules across generations.

---

## 📄 License & Maintainability
Developed for institutional examination management. All code is structured for unit testing, reproducible benchmarks, and production deployment via Docker.
