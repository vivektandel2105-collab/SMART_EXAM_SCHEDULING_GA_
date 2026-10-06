# SmartExam – System Requirements Document

## 1. Functional Requirements

### 1.1 Authentication & User Access Control
- Support JWT-based authentication.
- Provide Role-Based Access Control (RBAC) with 4 roles:
  - `SUPER_ADMIN`: System-wide settings, user management, audit logs.
  - `EXAM_ADMIN`: Data import, constraint setup, scheduler execution, timetable locking, review, approval & publishing.
  - `FACULTY`: View invigilation schedules, duty rosters, room assignments.
  - `STUDENT`: View personalized examination timetable (subject, date, time, room, seat/building).

### 1.2 Data Management
- Entity CRUD operations: Departments, Programs, Semesters, Divisions, Students, Faculty, Rooms, Exam Slots, Subjects.
- Excel/CSV bulk import for Students, Subjects, Faculty, Rooms, and Enrollment mappings with transactional preview & validation.

### 1.3 Scheduling & Constraint Configuration
- Configurable hard constraints (Zero-tolerance rules).
- Configurable soft constraint weights (Penalize consecutive exams, daily exam density, faculty imbalance, room utilization).
- Support for locking specific exam-slot-room-faculty assignments manually before optimization.

### 1.4 Genetic Algorithm Optimization Engine
- Generate initial chromosome population.
- Fitness evaluation based on hard violation count & soft penalty weights.
- Tournament selection, timetable-safe crossover, guided mutation, and constraint repair.
- Background asynchronous execution with progress metrics (fitness progression, generation counter, elapsed time).
- Deterministic run support via configurable `random_seed`.

### 1.5 Timetable Lifecycle & Versioning
- Status state machine: `DRAFT` -> `GENERATED` -> `UNDER_REVIEW` -> `APPROVED` -> `PUBLISHED` -> `ARCHIVED`.
- Immutable published versions; changes after publishing create a new timetable version.
- Export timetables to PDF, Excel, and CSV formats.

---

## 2. Non-Functional Requirements

- **Performance**: Capable of scheduling 300 to 10,000 students across 20 to 200 subjects in reasonable computation time.
- **Reliability**: Failures during GA runs must not corrupt database states.
- **Security**: Passwords hashed with bcrypt; secrets retrieved strictly from environment variables; CORS explicitly scoped.
- **Explainability**: Clear metrics breakdown for every timetable run explaining hard & soft penalty components.
