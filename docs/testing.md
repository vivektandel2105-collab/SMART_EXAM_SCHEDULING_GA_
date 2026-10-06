# SmartExam – Testing Strategy & Test Suite Guide

## Testing Scope

1. **Unit Testing**:
   - Chromosome gene representation, serialization, cloning.
   - Fitness function accuracy against individual hard/soft constraint violations.
   - Tournament selection, crossover boundary logic, mutation bounds.
   - Repair algorithm efficiency & deterministic random seed verification.

2. **Integration Testing**:
   - FastAPI endpoint integration via `httpx` & `TestClient`.
   - SQLAlchemy database transactions, foreign key integrity, Alembic migrations.
   - CSV/Excel data import validation pipeline.

3. **End-to-End & Benchmark Testing**:
   - Full schedule generation pipeline: Data load -> Pre-validation -> GA Execution -> Timetable Version Creation -> Approval.
   - Scalability benchmarks with synthetic datasets (100 to 10,000 students).
