# SmartExam Backend API & GA Engine

FastAPI backend application providing RESTful endpoints, database ORM integration, and Genetic Algorithm optimization service.

## Structure
- `app/main.py`: FastAPI entry point.
- `app/core/`: Application settings, security, database session setup.
- `app/models/`: SQLAlchemy ORM entity definitions.
- `app/schemas/`: Pydantic data validation schemas.
- `app/api/`: REST API routes.
- `app/services/`: Business logic, Excel data import/export.
- `app/genetic_algorithm/`: Core GA implementation (chromosomes, fitness, operators, repair).
- `tests/`: Automated unit and integration test suite.

## Running Tests
```bash
pytest
```
