# SmartExam – System Architecture Document

## High-Level System Architecture

```text
                               +------------------------+
                               |   React Web Frontend   |
                               |   (Vite + Tailwind)    |
                               +-----------+------------+
                                           |
                                       REST / JSON
                                           |
                                           v
                               +------------------------+
                               |    FastAPI Backend     |
                               |  (Pydantic + Security) |
                               +-----------+------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
         +--------------------+                        +--------------------+
         |   PostgreSQL /     |                        |  Genetic Algorithm |
         |   SQLite Database  |                        |  Engine (In-Mem)   |
         +--------------------+                        +--------------------+
```

## Modular Components

1. **Frontend Core**:
   - Built with React, React Router, Axios, and Tailwind CSS.
   - Separate access panels for Admin, Faculty, and Student workflows.
   - Interactive Recharts visualization for GA optimization progress (fitness curve, hard violations).

2. **Backend Services**:
   - **Auth & Security**: JWT issuance, password hashing via bcrypt, dependency-injected current user & role validation.
   - **Data Import**: Data cleansing, structural validation, reference check via Pandas & OpenPyXL.
   - **Scheduler API**: Handles asynchronous background job launching, polling metrics, cancellation handles.

3. **In-Memory GA Engine**:
   - Decoupled from persistent DB IO during generation loops.
   - Loads problem instance into light Python data structures.
   - Conducts selection, crossover, mutation, repair, elitism in memory.
   - Persists only final candidate timetables & performance metrics back to database.
