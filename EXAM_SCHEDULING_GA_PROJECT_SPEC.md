# SmartExam – Exam Scheduling Using Genetic Algorithm
## Master Project Specification for Antigravity

**Project Type:** Real-world web application + optimization system  
**Project Name:** SmartExam  
**Tagline:** Automated, Conflict-Free and Optimized Examination Timetabling  
**Primary Optimization Technique:** Genetic Algorithm (GA)  
**Backend:** Python + FastAPI  
**Frontend:** React.js  
**Database:** PostgreSQL  
**ORM:** SQLAlchemy  
**Authentication:** JWT  
**Data Import:** CSV / Excel  
**Deployment Target:** Production-ready web application

---

# 1. IMPORTANT INSTRUCTIONS FOR ANTIGRAVITY

This document is the master specification for the SmartExam project.

## Development rules

1. Build the project incrementally. Do NOT generate the entire application in one step.
2. Before implementing a module, inspect the existing project structure and understand the current code.
3. Do not rewrite or delete working modules unnecessarily.
4. Keep frontend, backend, database, and Genetic Algorithm responsibilities separated.
5. Do not hard-code institution-specific data.
6. Use environment variables for secrets and configuration.
7. Do not silently ignore errors.
8. Do not claim that a feature or test works unless it has actually been executed and verified.
9. Every major feature must have automated tests.
10. Preserve backward compatibility when modifying existing APIs.
11. Use clear type hints, validation, error handling, and meaningful names.
12. Avoid duplicate business logic.
13. The Genetic Algorithm must be independently testable from the web application.
14. Hard constraints must never be treated as optional soft penalties.
15. If a generated timetable contains hard violations, the system must clearly report them and must not mark the timetable as valid.
16. Do not modify unrelated files while implementing a focused task.
17. When a requirement is ambiguous, inspect this specification and existing code first. If it is still genuinely ambiguous, document the assumption before implementation.
18. After every implementation phase, run relevant tests and report actual results.
19. Use database migrations for schema changes.
20. Maintain API documentation through FastAPI/OpenAPI.
21. Prefer production-quality architecture over a quick demo.
22. Do not add unnecessary AI/LLM features. The core optimization must remain the Genetic Algorithm.
23. Keep the Genetic Algorithm deterministic when a random seed is supplied, so experiments can be reproduced.
24. Log important scheduler runs, configuration, results, and approvals.
25. Never expose passwords, JWT secrets, database credentials, or other secrets in source control.

---

# 2. PROJECT OVERVIEW

SmartExam is a web-based examination scheduling and room/faculty allocation system designed for colleges and universities.

The system accepts real institutional data such as:

- Students
- Departments
- Programs
- Semesters
- Divisions
- Subjects
- Faculty
- Rooms
- Exam dates
- Exam sessions
- Faculty availability
- Room availability
- Student-subject enrollment
- Scheduling constraints

It uses a Genetic Algorithm to generate and optimize examination timetables.

The system must prioritize:

1. Zero hard-constraint violations.
2. Low soft-constraint penalty.
3. Efficient room utilization.
4. Balanced faculty workload.
5. Reasonable student exam spacing.
6. Reproducibility and explainability.
7. Manual control through locked assignments.
8. Timetable versioning and approval.

The application is not just a Genetic Algorithm demonstration. It should be designed as a realistic examination-cell management system.

---

# 3. PROBLEM STATEMENT

Manual examination scheduling becomes difficult as the number of students, subjects, rooms, faculty members, departments, and examination sessions increases.

A manual timetable can produce:

- Student exam clashes
- Room conflicts
- Room-capacity violations
- Faculty assignment conflicts
- Poor room utilization
- Excessive consecutive exams
- Unbalanced faculty duties
- Large gaps between examinations
- Difficulty handling last-minute changes
- Difficulty tracking timetable versions

SmartExam addresses these problems by combining a structured examination management system with a Genetic Algorithm-based optimization engine.

---

# 4. PROJECT OBJECTIVES

## Primary objectives

- Automatically generate examination timetables.
- Eliminate hard scheduling conflicts.
- Minimize soft constraint violations.
- Allocate rooms based on capacity.
- Allocate invigilators without time conflicts.
- Allow administrators to lock specific assignments.
- Support timetable regeneration after changes.
- Provide timetable approval and publishing.
- Provide student and faculty-specific schedules.
- Import institutional data from Excel/CSV.
- Provide reports and analytics.
- Maintain timetable versions and audit logs.
- Measure and display optimization performance.

## Secondary objectives

- Make scheduling configurable for different institutions.
- Support reproducible Genetic Algorithm experiments.
- Provide meaningful optimization statistics.
- Support future integration with existing college ERP/SIS systems.

---

# 5. SCOPE

## In scope

- Authentication
- Role-based access
- Academic structure
- Student management
- Faculty management
- Subject management
- Room management
- Exam-slot management
- Student-subject enrollment
- Constraint configuration
- Excel/CSV import
- Data validation
- Genetic Algorithm scheduling
- Conflict detection
- Constraint repair
- Room allocation
- Invigilation allocation
- Manual locking
- Timetable versions
- Approval/publishing
- Student portal
- Faculty portal
- Reports
- Audit logging
- Testing
- Deployment

## Out of scope for initial version

- Online examination
- Question paper generation
- Automatic student attendance using face recognition
- AI-based question generation
- LLM-based timetable generation
- Automated university ERP synchronization without an external API
- Predicting student performance

These may be future extensions.

---

# 6. USER ROLES

## 6.1 Super Admin

Can:

- Manage system users
- Manage institution configuration
- Manage roles and permissions
- View audit logs
- Configure global settings

## 6.2 Exam Cell Admin

Can:

- Manage academic data
- Import students and subjects
- Manage rooms
- Configure exam sessions
- Configure constraints
- Run the scheduler
- Lock assignments
- Review timetables
- Approve and publish timetables
- Generate reports

## 6.3 Faculty

Can:

- View examination timetable
- View assigned invigilation duties
- View assigned rooms
- View duty schedule

## 6.4 Student

Can:

- View personal examination timetable
- View subject, date, time, room and building
- Download timetable

---

# 7. CORE FUNCTIONAL REQUIREMENTS

## Authentication

- Login
- Logout
- Password hashing
- JWT authentication
- Role-based authorization
- Protected API routes
- Current-user endpoint

## Student management

- Add student
- Edit student
- Delete/deactivate student
- Search
- Filter
- Import from Excel/CSV
- Detect duplicate roll numbers

## Subject management

- Add subject
- Edit subject
- Delete/deactivate subject
- Assign subject to program/semester/division
- Configure exam duration

## Faculty management

- Add faculty
- Edit faculty
- Manage availability
- Assign invigilation duties

## Room management

- Add room
- Edit room
- Set capacity
- Set building/floor
- Mark room available/unavailable
- Define room type

## Exam slots

- Create dates
- Create morning/afternoon sessions
- Set start/end time
- Mark slots unavailable

## Constraints

- Configure hard constraints
- Configure soft constraints
- Configure weights
- Configure maximum exams per day
- Configure minimum gap
- Configure faculty availability
- Configure room availability

## Scheduler

- Validate input data
- Generate initial population
- Calculate fitness
- Select parents
- Crossover
- Mutation
- Repair
- Elitism
- Iterate generations
- Stop on configured conditions
- Return best valid solution
- Record metrics

## Timetable

- View
- Filter
- Search
- Lock assignments
- Unlock assignments
- Compare versions
- Approve
- Publish
- Export

---

# 8. NON-FUNCTIONAL REQUIREMENTS

## Performance

The application should handle realistic datasets and should be tested at increasing scales.

Target test datasets:

- 100 students
- 500 students
- 1,000 students
- 5,000 students
- 10,000 students
- 20 subjects
- 50 subjects
- 100 subjects
- 200 subjects

The scheduler must record:

- Execution time
- Generation count
- Population size
- Best fitness
- Hard violations
- Soft violations
- Memory usage where measurable

## Reliability

- Failed scheduling jobs must not corrupt timetable data.
- Partial imports must be prevented unless explicitly supported.
- Invalid timetables must not be published.

## Security

- Password hashing
- JWT
- RBAC
- Input validation
- Secure CORS
- Environment variables
- Audit logs
- No secrets in source code

## Maintainability

- Modular architecture
- Type hints
- Clear naming
- Unit tests
- Integration tests
- API documentation

## Usability

- Responsive interface
- Clear validation messages
- Progress indicators
- Search/filter
- Confirmation before destructive operations
- Clear conflict reporting

---

# 9. TECHNOLOGY STACK

## Frontend

- React.js
- JavaScript
- HTML5
- CSS3
- Tailwind CSS
- Axios
- React Router
- Recharts or equivalent chart library

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PyJWT or equivalent JWT implementation
- Passlib/bcrypt or equivalent secure password hashing

## Genetic Algorithm

Preferred approach:

- Custom Python implementation for the core GA
- Optional DEAP comparison/benchmark later

The core implementation should expose:

- chromosome
- population
- fitness
- constraints
- selection
- crossover
- mutation
- repair
- elitism
- engine

## Database

- PostgreSQL
- SQLite may be used for local quick-start development/testing only

## Data processing

- pandas
- openpyxl

## Testing

- pytest
- FastAPI TestClient
- frontend testing framework appropriate for React

## Deployment

- Docker
- Docker Compose
- PostgreSQL
- Production web server
- Frontend hosting
- Backend hosting

---

# 10. SYSTEM ARCHITECTURE

```text
                         USERS
                           |
                           v
                  +----------------+
                  |   React Web UI |
                  +-------+--------+
                          |
                        HTTPS
                          |
                          v
                  +----------------+
                  |    FastAPI     |
                  |     Backend    |
                  +-------+--------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
   +-------------+ +-------------+ +-------------+
   | PostgreSQL  | | Auth/RBAC   | | Data Import |
   | Database    | | Service     | | Validation  |
   +-------------+ +-------------+ +-------------+
                          |
                          v
                  +----------------+
                  | Constraint     |
                  | Validation     |
                  +-------+--------+
                          |
                          v
                  +----------------+
                  | Genetic        |
                  | Algorithm      |
                  | Engine         |
                  +-------+--------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
      Selection       Crossover        Mutation
          \               |               /
           \              |              /
            +-------------+-------------+
                          |
                          v
                    Repair / Validate
                          |
                          v
                    Best Timetable
                          |
                          v
                 Approval / Publishing
```

---

# 11. DATABASE DESIGN

Required tables:

```text
users
departments
programs
semesters
divisions
students
faculty
faculty_availability
subjects
student_subjects
rooms
room_availability
exam_sessions
exam_slots
exams
exam_assignments
invigilation_assignments
constraints
constraint_weights
timetables
timetable_versions
scheduler_runs
scheduler_metrics
audit_logs
```

## Important relationships

```text
Department
   |
   +---- Programs
           |
           +---- Semesters
                   |
                   +---- Divisions
                           |
                           +---- Students

Program/Semester
   |
   +---- Subjects
            |
            +---- Student_Subjects

Exam
   |
   +---- Exam_Assignment
            |
            +---- Exam_Slot
            +---- Room
            +---- Faculty

Timetable
   |
   +---- Timetable_Version
            |
            +---- Exam_Assignment
```

---

# 12. DATABASE FIELD GUIDELINES

## users

```text
id
name
email
password_hash
role
is_active
created_at
updated_at
```

## students

```text
id
roll_number
name
email
program_id
semester_id
division_id
status
created_at
updated_at
```

## subjects

```text
id
subject_code
subject_name
department_id
program_id
semester_id
exam_duration_minutes
exam_type
is_active
```

## student_subjects

```text
id
student_id
subject_id
```

A unique constraint should prevent duplicate student-subject enrollment.

## rooms

```text
id
room_number
building
floor
capacity
room_type
is_available
```

## exam_slots

```text
id
exam_date
start_time
end_time
session_name
is_available
```

## exams

```text
id
subject_id
exam_duration_minutes
status
```

## exam_assignments

```text
id
timetable_version_id
exam_id
slot_id
room_id
faculty_id
is_locked
```

## timetables

```text
id
name
academic_year
status
created_by
approved_by
published_at
created_at
```

## timetable_versions

```text
id
timetable_id
version_number
status
fitness_score
hard_violations
soft_violations
created_at
created_by
```

## scheduler_runs

```text
id
timetable_id
configuration_json
random_seed
started_at
completed_at
status
```

## scheduler_metrics

```text
id
scheduler_run_id
generation
best_fitness
hard_violations
soft_penalty
execution_time_ms
```

---

# 13. GENETIC ALGORITHM MODEL

The Genetic Algorithm is the core optimization engine.

## 13.1 Chromosome

One chromosome represents a complete candidate timetable.

Each gene represents one exam assignment.

Conceptually:

```text
Gene =
(subject/exam, slot, room, invigilator)
```

Example:

```text
Gene 1:
DBMS -> 10 Dec -> Morning -> Room A101 -> Faculty F12

Gene 2:
OS -> 10 Dec -> Afternoon -> Room A102 -> Faculty F08
```

The chromosome is the collection of all genes.

---

# 14. INITIAL POPULATION

Generate a configurable number of candidate timetables.

Default starting configuration:

```text
population_size = 100
max_generations = 500
crossover_rate = 0.80
mutation_rate = 0.10
elite_count = 5
tournament_size = 5
random_seed = configurable
```

These values must be configurable, not hard-coded.

The system should validate that the configuration is sensible.

---

# 15. HARD CONSTRAINTS

Hard constraints represent rules that must not be violated in a valid published timetable.

Minimum hard constraints:

## HC-01 Student conflict

A student cannot have two exams in the same time slot.

## HC-02 Room conflict

A room cannot host two exams in the same slot.

## HC-03 Room capacity

Assigned room capacity must be greater than or equal to the number of students taking the exam.

## HC-04 Faculty conflict

An invigilator cannot supervise two rooms during the same slot.

## HC-05 Room availability

An unavailable room cannot be assigned.

## HC-06 Faculty availability

Unavailable faculty cannot be assigned.

## HC-07 Exam slot availability

An exam cannot be scheduled into an unavailable slot.

## HC-08 Locked assignment preservation

The Genetic Algorithm cannot change an assignment marked as locked.

## HC-09 Valid subject/exam relationship

Every scheduled exam must refer to an existing active exam/subject.

## HC-10 Assignment completeness

Every required exam must have a valid slot and required room allocation.

A timetable with hard violations must be marked invalid.

---

# 16. SOFT CONSTRAINTS

Soft constraints should be configurable.

Suggested soft constraints:

## SC-01 Consecutive exams

Penalize students having exams on consecutive days when institutional policy wants spacing.

## SC-02 Multiple exams in one day

Penalize multiple exams for the same student on the same day.

## SC-03 Excessive gaps

Penalize unnecessarily large gaps between a student's exams when possible.

## SC-04 Faculty workload imbalance

Penalize large differences in invigilation workload.

## SC-05 Room utilization imbalance

Penalize poor room utilization.

## SC-06 Department/session balance

Optionally penalize undesirable concentration of exams.

## SC-07 Preferred room/building

If an institution has preferred room assignments, use them as soft constraints.

The system must allow each soft constraint to be enabled/disabled and weighted.

---

# 17. FITNESS FUNCTION

The fitness function should be documented and implemented consistently.

Recommended minimization model:

```text
Total Cost =
    Hard Constraint Cost
  + Soft Constraint Cost
```

Example:

```text
Total Cost =
    W_hard * hard_violations
  + W_consecutive * consecutive_exam_penalty
  + W_same_day * same_day_penalty
  + W_gap * gap_penalty
  + W_faculty * faculty_balance_penalty
  + W_room * room_utilization_penalty
```

Default weights must be configurable.

A hard violation must have a substantially higher priority than soft penalties.

Do not use arbitrary weights without documenting them.

The system should expose a fitness breakdown:

```text
Hard violations: 0
Consecutive exam penalty: 12
Same-day penalty: 0
Faculty balance penalty: 5
Room utilization penalty: 8

Total cost: 25
```

The UI may display a normalized score for readability, but the underlying penalty components must remain available.

---

# 18. SELECTION

Implement tournament selection.

Process:

```text
1. Randomly choose N individuals.
2. Compare fitness.
3. Select the best candidate.
4. Repeat until required parents are selected.
```

Make tournament size configurable.

---

# 19. CROSSOVER

Implement a timetable-safe crossover.

A basic one-point crossover may create invalid schedules, so crossover must be followed by validation/repair.

Possible strategy:

```text
Parent A + Parent B
        |
        v
Choose crossover boundary
        |
        v
Combine genes
        |
        v
Preserve locked assignments
        |
        v
Repair duplicate/conflicting assignments
        |
        v
Validate child
```

The implementation must not silently produce invalid chromosomes.

---

# 20. MUTATION

Mutation should modify one or more unlocked exam assignments.

Possible mutations:

```text
Change slot
Change room
Change faculty
Swap two exams
Move exam to another slot
```

Mutation must respect locked assignments.

Every mutated chromosome must be validated or repaired before entering the next population.

---

# 21. REPAIR MECHANISM

Repair is mandatory for production-oriented scheduling.

Example:

```text
Generated child
      |
      v
Hard conflict detected
      |
      v
Find alternative valid slot/room/faculty
      |
      v
Apply repair
      |
      v
Recalculate violations
```

Repair should prioritize:

1. Locked assignments
2. Student conflicts
3. Room conflicts
4. Room capacity
5. Faculty conflicts
6. Availability constraints

If a conflict cannot be repaired, keep the violation measurable and report it. Never pretend the timetable is valid.

---

# 22. ELITISM

Keep the best N individuals unchanged in the next generation.

Example:

```text
Population = 100
Elite count = 5

Best 5
  |
  v
Copied to next generation
```

---

# 23. TERMINATION CONDITIONS

The scheduler should stop when one of the following occurs:

1. A valid timetable with zero hard violations is found and an optional target soft score is reached.
2. Maximum generations reached.
3. Time limit reached.
4. Cancellation requested by administrator.
5. Other configured termination condition.

The final status must explain why the run ended.

---

# 24. SCHEDULER RESULT

The scheduler must return:

```json
{
  "status": "completed",
  "generation": 142,
  "best_fitness": 25,
  "hard_violations": 0,
  "soft_penalty": 25,
  "execution_time_ms": 14800,
  "population_size": 100,
  "mutation_rate": 0.10,
  "crossover_rate": 0.80,
  "random_seed": 12345
}
```

Actual schema may be improved during implementation but must remain consistent across backend and frontend.

---

# 25. MANUAL LOCKING

This is a key real-world feature.

An administrator can lock:

```text
Exam
Date
Slot
Room
Faculty
```

Example:

```text
DBMS
15 Dec
09:00-11:00
Room A101
LOCKED
```

The Genetic Algorithm must optimize all other assignments without changing this locked assignment.

Before running the scheduler, validate that locked assignments themselves do not violate hard constraints.

If locked assignments are impossible, show a clear error and do not start optimization.

---

# 26. DATA IMPORT

Support Excel and CSV import for:

```text
Students
Subjects
Faculty
Rooms
Student-subject enrollment
Faculty availability
Room availability
```

Import process:

```text
Upload
  |
  v
File type validation
  |
  v
Column validation
  |
  v
Data type validation
  |
  v
Duplicate detection
  |
  v
Reference validation
  |
  v
Preview
  |
  v
Admin confirmation
  |
  v
Database transaction
```

Invalid records must be clearly reported.

---

# 27. REQUIRED SAMPLE DATA

Create realistic sample datasets for development.

Minimum:

```text
Departments: 3
Programs: 4
Students: 300+
Faculty: 30+
Subjects: 30+
Rooms: 15+
Exam slots: 20+
```

Also create larger benchmark datasets for testing.

Do not use real people's personal information.

---

# 28. PRE-SCHEDULING VALIDATION

Before starting the GA, validate:

- Every required exam has enrolled students or an explicit exception.
- There are enough available slots.
- There are enough room capacities across slots.
- Locked assignments are valid.
- Room availability exists.
- Faculty availability exists if invigilation allocation is required.
- Every subject/exam is correctly linked.
- No duplicate enrollment records.
- No duplicate room identifiers.
- No duplicate roll numbers.
- Exam duration fits the selected slot.
- Required data is not missing.

If validation fails, return structured errors.

---

# 29. API DESIGN

## Authentication

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Students

```text
GET    /api/students
POST   /api/students
GET    /api/students/{id}
PUT    /api/students/{id}
DELETE /api/students/{id}
POST   /api/students/import
```

## Subjects

```text
GET    /api/subjects
POST   /api/subjects
GET    /api/subjects/{id}
PUT    /api/subjects/{id}
DELETE /api/subjects/{id}
POST   /api/subjects/import
```

## Faculty

```text
GET    /api/faculty
POST   /api/faculty
GET    /api/faculty/{id}
PUT    /api/faculty/{id}
DELETE /api/faculty/{id}
```

## Rooms

```text
GET    /api/rooms
POST   /api/rooms
GET    /api/rooms/{id}
PUT    /api/rooms/{id}
DELETE /api/rooms/{id}
```

## Exam slots

```text
GET    /api/exam-slots
POST   /api/exam-slots
PUT    /api/exam-slots/{id}
DELETE /api/exam-slots/{id}
```

## Constraints

```text
GET    /api/constraints
POST   /api/constraints
PUT    /api/constraints/{id}
```

## Scheduler

```text
POST /api/scheduler/validate
POST /api/scheduler/generate
GET  /api/scheduler/runs
GET  /api/scheduler/runs/{id}
POST /api/scheduler/runs/{id}/cancel
GET  /api/scheduler/runs/{id}/metrics
```

## Timetable

```text
GET  /api/timetables
GET  /api/timetables/{id}
GET  /api/timetables/{id}/versions
POST /api/timetables/{id}/approve
POST /api/timetables/{id}/publish
POST /api/timetables/{id}/lock-assignment
POST /api/timetables/{id}/unlock-assignment
```

## Student timetable

```text
GET /api/students/{id}/timetable
```

## Faculty timetable

```text
GET /api/faculty/{id}/duties
```

---

# 30. BACKEND FOLDER STRUCTURE

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   └── logging.py
│   ├── models/
│   │   ├── user.py
│   │   ├── department.py
│   │   ├── program.py
│   │   ├── student.py
│   │   ├── faculty.py
│   │   ├── subject.py
│   │   ├── room.py
│   │   ├── exam.py
│   │   ├── timetable.py
│   │   └── audit.py
│   ├── schemas/
│   ├── api/
│   │   ├── auth.py
│   │   ├── students.py
│   │   ├── subjects.py
│   │   ├── faculty.py
│   │   ├── rooms.py
│   │   ├── exam_slots.py
│   │   ├── constraints.py
│   │   ├── scheduler.py
│   │   └── timetables.py
│   ├── services/
│   │   ├── import_service.py
│   │   ├── validation_service.py
│   │   ├── timetable_service.py
│   │   ├── report_service.py
│   │   └── audit_service.py
│   └── genetic_algorithm/
│       ├── chromosome.py
│       ├── population.py
│       ├── fitness.py
│       ├── constraints.py
│       ├── selection.py
│       ├── crossover.py
│       ├── mutation.py
│       ├── repair.py
│       ├── elitism.py
│       └── engine.py
├── tests/
├── alembic/
├── requirements.txt
└── README.md
```

---

# 31. FRONTEND FOLDER STRUCTURE

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── DataTable.jsx
│   │   ├── TimetableGrid.jsx
│   │   ├── ConflictCard.jsx
│   │   ├── FitnessChart.jsx
│   │   ├── ImportWizard.jsx
│   │   └── LoadingState.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Students.jsx
│   │   ├── Subjects.jsx
│   │   ├── Faculty.jsx
│   │   ├── Rooms.jsx
│   │   ├── ExamSlots.jsx
│   │   ├── Constraints.jsx
│   │   ├── GenerateTimetable.jsx
│   │   ├── Timetable.jsx
│   │   ├── TimetableVersions.jsx
│   │   ├── StudentPortal.jsx
│   │   ├── FacultyPortal.jsx
│   │   └── Reports.jsx
│   ├── services/
│   │   └── api.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── README.md
```

---

# 32. COMPLETE PROJECT STRUCTURE

```text
SmartExam/
├── frontend/
├── backend/
├── database/
│   ├── schema.sql
│   └── seed.sql
├── sample_data/
│   ├── students.xlsx
│   ├── subjects.xlsx
│   ├── faculty.xlsx
│   ├── rooms.xlsx
│   └── enrollments.xlsx
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── genetic_algorithm.md
│   ├── database.md
│   ├── api.md
│   └── testing.md
├── tests/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 33. FRONTEND PAGES

## Admin

- Login
- Dashboard
- Students
- Subjects
- Faculty
- Rooms
- Exam Slots
- Constraints
- Data Import
- Generate Timetable
- Timetable
- Version History
- Reports
- Audit Logs

## Faculty

- Dashboard
- Exam Schedule
- Invigilation Duties

## Student

- Dashboard
- My Timetable
- Exam Details

---

# 34. ADMIN DASHBOARD

Show:

```text
Total Students
Total Subjects
Total Rooms
Total Faculty
Total Exam Slots

Current Timetable Status
Hard Violations
Soft Penalty
Room Utilization
Faculty Utilization
Last Scheduler Run
```

Charts:

- Fitness vs generation
- Hard violations vs generation
- Room utilization
- Faculty workload
- Exams per day

---

# 35. TIMETABLE UI

Provide filters:

```text
Date
Department
Program
Semester
Division
Room
Faculty
Subject
```

Views:

```text
Calendar view
Grid view
Room-wise view
Faculty-wise view
Student-wise view
```

Exam details should show:

```text
Subject
Subject Code
Date
Start Time
End Time
Room
Building
Room Capacity
Number of Students
Invigilator
Lock Status
```

---

# 36. OPTIMIZATION PROGRESS UI

When generation is running, display:

```text
Generation: 142 / 500
Best Fitness: 25
Hard Violations: 0
Soft Penalty: 25
Elapsed Time: 14.8 sec
```

Display a live chart where technically appropriate.

Provide:

```text
Cancel Generation
```

The backend must safely handle cancellation.

---

# 37. REPORTS

Required reports:

1. Complete examination timetable
2. Student timetable
3. Faculty invigilation list
4. Room allocation report
5. Department-wise timetable
6. Conflict report
7. Scheduler optimization report
8. Timetable version report

Export:

```text
PDF
Excel
CSV
```

---

# 38. TIMETABLE VERSIONING

Never overwrite a previous approved/generated timetable.

Example:

```text
Version 1 - Initial generation
Version 2 - Room 201 unavailable
Version 3 - Faculty change
Version 4 - Final approved
```

Store:

- Configuration
- Fitness
- Violations
- Creation time
- Creator
- Approval information

---

# 39. AUDIT LOGGING

Log important events:

```text
User login
Data import
Data modification
Scheduler started
Scheduler completed
Scheduler cancelled
Assignment locked
Assignment unlocked
Timetable approved
Timetable published
```

Store:

```text
user
action
entity
entity_id
timestamp
metadata
```

Do not log passwords or secrets.

---

# 40. TESTING STRATEGY

## Unit tests

Test:

- Chromosome
- Fitness
- Every hard constraint
- Every soft constraint
- Selection
- Crossover
- Mutation
- Repair
- Elitism
- Configuration validation

## Integration tests

Test:

- Database
- APIs
- Authentication
- Data import
- Scheduler API
- Timetable creation
- Approval
- Publishing

## End-to-end tests

Test:

```text
Login
  -> Import data
  -> Validate
  -> Configure
  -> Generate
  -> Review
  -> Approve
  -> Publish
  -> Student views timetable
```

---

# 41. CRITICAL TEST CASES

At minimum, test:

1. Two exams for same student in same slot.
2. Two exams assigned to same room in same slot.
3. Room capacity exceeded.
4. Faculty assigned twice in same slot.
5. Unavailable room selected.
6. Unavailable faculty selected.
7. Unavailable slot selected.
8. Locked assignment changed by mutation.
9. Locked assignment changed by crossover.
10. Invalid input data.
11. Duplicate student.
12. Duplicate subject enrollment.
13. Insufficient rooms.
14. Insufficient slots.
15. Scheduler cancellation.
16. Scheduler timeout.
17. Zero hard-violation solution.
18. Version creation.
19. Timetable approval.
20. Published timetable cannot be accidentally modified without a new version.

---

# 42. GENETIC ALGORITHM BENCHMARKING

The project should provide measurable results.

For each experiment record:

```text
Dataset size
Population size
Mutation rate
Crossover rate
Elite count
Generations
Random seed
Execution time
Best fitness
Hard violations
Soft penalty
```

Run the scheduler multiple times with different seeds.

Do not claim that one configuration is universally optimal. Present experimental results for the tested datasets.

---

# 43. REPRODUCIBILITY

The scheduler must support:

```text
random_seed
```

If the same:

```text
dataset
configuration
random_seed
```

is supplied, the algorithm should produce reproducible results as far as the implementation/runtime allows.

Store the random seed with each scheduler run.

---

# 44. ERROR HANDLING

Use structured API errors.

Example:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Scheduling cannot start.",
  "details": [
    {
      "code": "INSUFFICIENT_ROOMS",
      "message": "No valid room is available for exam DBMS in slot 3."
    }
  ]
}
```

Do not expose internal stack traces to normal users.

Log technical details securely on the server.

---

# 45. SECURITY REQUIREMENTS

- Hash passwords using a secure password-hashing algorithm.
- Use JWT for authenticated requests.
- Validate JWT expiration.
- Implement role-based authorization.
- Validate all incoming data.
- Use parameterized ORM/database operations.
- Configure CORS explicitly.
- Store secrets in environment variables.
- Use HTTPS in production.
- Do not commit `.env`.
- Add `.env` to `.gitignore`.
- Avoid sensitive data in logs.

---

# 46. DEPLOYMENT

Provide:

```text
Dockerfile
docker-compose.yml
.env.example
```

Local services:

```text
frontend
backend
postgres
```

The application should be runnable using documented commands.

Production deployment should separate:

```text
Frontend
Backend
Database
```

Use environment variables for:

```text
DATABASE_URL
JWT_SECRET
CORS_ORIGINS
API_BASE_URL
```

---

# 47. DEVELOPMENT PHASES

## Phase 1 – Foundation

- Create repository
- Create frontend
- Create backend
- Configure environment
- Configure database
- Add README

## Phase 2 – Database

- SQLAlchemy models
- Alembic migrations
- Seed data

## Phase 3 – Authentication

- Users
- Password hashing
- JWT
- RBAC

## Phase 4 – CRUD

- Students
- Subjects
- Faculty
- Rooms
- Exam slots

## Phase 5 – Import

- Excel/CSV
- Validation
- Preview
- Transactional import

## Phase 6 – Constraint Engine

- Hard constraints
- Soft constraints
- Weight configuration
- Pre-validation

## Phase 7 – Genetic Algorithm

- Chromosome
- Population
- Fitness
- Selection
- Crossover
- Mutation
- Repair
- Elitism
- Termination

## Phase 8 – Backend Integration

- Scheduler API
- Background execution
- Progress
- Cancellation
- Metrics

## Phase 9 – Frontend

- Dashboard
- Configuration
- Generation screen
- Timetable
- Reports

## Phase 10 – Real-world Features

- Manual locking
- Versioning
- Approval
- Publishing
- Audit logs

## Phase 11 – Testing

- Unit
- Integration
- End-to-end
- Stress testing

## Phase 12 – Deployment

- Docker
- Production configuration
- Documentation

---

# 48. ANTIGRAVITY PROMPTING WORKFLOW

Do not ask Antigravity to implement all phases at once.

Use one prompt per controlled phase.

Each prompt should specify:

```text
CONTEXT
TASK
REQUIREMENTS
FILES ALLOWED TO MODIFY
FILES NOT TO MODIFY
TEST REQUIREMENTS
EXPECTED RESULT
```

---

# 49. READY-TO-USE ANTIGRAVITY PROMPTS

## Prompt 01 – Analyze and Initialize

```text
You are working on SmartExam, a production-oriented examination scheduling system using a Genetic Algorithm.

Read the project specification file completely before making changes.

First inspect the current repository.

Do not implement application features yet.

Create a clean project foundation with:
- frontend/
- backend/
- database/
- sample_data/
- docs/
- tests/

Use React for frontend and FastAPI/Python for backend.

Create environment configuration examples and a professional README.

Do not invent unrelated features.

After completion:
1. Show the created structure.
2. Run basic checks.
3. Report exactly what was created.
4. Do not claim tests passed unless they were actually executed.
```

---

## Prompt 02 – Database

```text
Implement the SmartExam database layer according to the master specification.

Use PostgreSQL, SQLAlchemy and Alembic.

Implement models and relationships for:
users
departments
programs
semesters
divisions
students
faculty
faculty_availability
subjects
student_subjects
rooms
room_availability
exam_slots
exams
exam_assignments
invigilation_assignments
constraints
timetables
timetable_versions
scheduler_runs
scheduler_metrics
audit_logs

Requirements:
- Proper foreign keys
- Useful indexes
- Unique constraints
- Created/updated timestamps where appropriate
- Safe enum/status handling
- Migration files
- Seed data

Do not implement the Genetic Algorithm yet.

Allowed modifications:
backend database/model/migration files and database documentation.

Do not modify frontend.

Run database/model tests after implementation.
```

---

## Prompt 03 – Authentication

```text
Implement authentication for SmartExam.

Requirements:
- User registration for authorized administration workflows
- Login
- Password hashing
- JWT access tokens
- Token validation
- Current-user endpoint
- Role-based authorization
- Protected routes
- Secure configuration through environment variables

Roles:
SUPER_ADMIN
EXAM_ADMIN
FACULTY
STUDENT

Do not expose passwords or secrets.

Add tests for:
- successful login
- wrong password
- expired/invalid token
- unauthorized role
- authorized role

Do not modify the Genetic Algorithm.
```

---

## Prompt 04 – CRUD APIs

```text
Implement REST APIs for:
students
subjects
faculty
rooms
exam slots
departments
programs
semesters
divisions

Use FastAPI, Pydantic and SQLAlchemy.

Requirements:
- CRUD
- pagination where appropriate
- search/filter
- validation
- correct HTTP status codes
- authorization
- consistent error responses
- API documentation

Add API tests.

Do not modify Genetic Algorithm files.
```

---

## Prompt 05 – Excel/CSV Import

```text
Implement Excel/CSV import for:
students
subjects
faculty
rooms
student-subject enrollment

Use pandas/openpyxl.

Workflow:
upload -> validate -> preview -> confirm -> transactional import.

Validate:
- file type
- required columns
- data types
- duplicates
- foreign keys
- missing values
- invalid references

Return clear structured validation errors.

Add tests for valid files and invalid files.

Do not change the Genetic Algorithm.
```

---

## Prompt 06 – Constraint Engine

```text
Implement a standalone scheduling constraint engine.

Hard constraints:
- student conflict
- room conflict
- room capacity
- faculty conflict
- room availability
- faculty availability
- exam-slot availability
- locked assignment preservation
- assignment completeness
- valid exam relationships

Soft constraints:
- consecutive exams
- multiple exams per day
- excessive gaps
- faculty workload imbalance
- room utilization imbalance

Each constraint must return measurable violation information.

Make soft-constraint weights configurable.

Write unit tests for every constraint.

Do not implement selection/crossover/mutation yet.
```

---

## Prompt 07 – Chromosome and Population

```text
Implement the Genetic Algorithm data structures.

Create:
chromosome.py
population.py

A gene represents:
exam_id
slot_id
room_id
faculty_id

A chromosome represents a complete candidate timetable.

Requirements:
- serialization
- validation
- cloning
- locked assignment support
- deterministic random seed support
- population generation

Add unit tests.

Do not modify API or frontend code.
```

---

## Prompt 08 – Fitness

```text
Implement the SmartExam fitness function.

Fitness must combine:
- hard constraint violations
- configurable soft constraint penalties

Hard violations must dominate soft penalties.

Return a complete fitness breakdown:
hard violations
soft penalties by category
total cost

Make the calculation deterministic for a fixed dataset and random-independent input.

Add extensive tests for:
- zero violations
- student conflict
- room conflict
- room capacity
- faculty conflict
- soft penalties
- weighted penalties

Do not modify frontend.
```

---

## Prompt 09 – Selection, Crossover and Mutation

```text
Implement:
- tournament selection
- timetable-safe crossover
- mutation

Requirements:
- configurable rates
- locked assignments cannot be changed
- crossover must preserve complete exam coverage
- mutation may change slot, room, faculty or swap exams
- invalid offspring must be repaired/validated
- deterministic behavior with fixed random seed

Add unit tests.

Do not change database models or API routes.
```

---

## Prompt 10 – Repair

```text
Implement the timetable chromosome repair mechanism.

Repair priority:
1. Preserve locked assignments.
2. Resolve student conflicts.
3. Resolve room conflicts.
4. Resolve room capacity.
5. Resolve faculty conflicts.
6. Resolve availability violations.

The repair algorithm must search valid alternatives before giving up.

Return repair statistics.

Add tests for each repair scenario.

Never mark an unresolved chromosome as valid.
```

---

## Prompt 11 – GA Engine

```text
Implement the complete Genetic Algorithm engine.

Pipeline:
initialize population
-> evaluate
-> selection
-> crossover
-> mutation
-> repair
-> evaluate
-> elitism
-> next generation

Configuration:
population size
maximum generations
crossover rate
mutation rate
elite count
tournament size
random seed
time limit

Termination:
valid target solution
maximum generations
time limit
cancellation

Return:
best chromosome
fitness breakdown
generation
execution time
random seed
statistics

Add integration tests.

Do not modify frontend.
```

---

## Prompt 12 – Scheduler API

```text
Connect the Genetic Algorithm engine to FastAPI.

Implement:
POST /api/scheduler/validate
POST /api/scheduler/generate
GET /api/scheduler/runs
GET /api/scheduler/runs/{id}
GET /api/scheduler/runs/{id}/metrics
POST /api/scheduler/runs/{id}/cancel

Requirements:
- background execution
- persistent scheduler run
- progress metrics
- cancellation
- error handling
- authorization
- timetable version creation
- random seed storage

Do not block normal API requests during long optimization.

Add API integration tests.
```

---

## Prompt 13 – Timetable UI

```text
Build the React timetable interface.

Views:
- calendar
- date grid
- room-wise
- faculty-wise
- student-wise

Filters:
date
department
program
semester
division
room
faculty
subject

Display:
subject
date
time
room
capacity
student count
faculty
lock status

Do not change backend logic.
Use existing APIs.
```

---

## Prompt 14 – Admin Dashboard

```text
Build the SmartExam admin dashboard.

Display:
students
subjects
rooms
faculty
exam slots
current timetable status
hard violations
soft penalty
room utilization
faculty workload
latest scheduler run

Add charts:
fitness vs generation
hard violations vs generation
room utilization
faculty workload

Use real API data.
Do not fabricate statistics.
```

---

## Prompt 15 – Manual Locking

```text
Implement manual timetable assignment locking.

Admin must be able to lock/unlock assignments.

A locked assignment cannot be changed by:
- crossover
- mutation
- repair

Validate locked assignments before scheduling.

If locked assignments create an impossible hard conflict, prevent scheduling and show the conflict.

Add backend and frontend tests.
```

---

## Prompt 16 – Versioning and Approval

```text
Implement timetable versioning.

Every scheduler result creates a new version.

Statuses:
DRAFT
GENERATED
UNDER_REVIEW
APPROVED
PUBLISHED
ARCHIVED

Implement:
version history
version details
approval
publishing
archiving

Published versions must be protected from accidental modification.

Any change after publishing must create a new version.

Add audit logging and tests.
```

---

## Prompt 17 – Reports

```text
Implement reports for:
- complete timetable
- student timetable
- faculty invigilation
- room allocation
- department timetable
- conflict report
- scheduler optimization report
- version history

Export:
PDF
Excel
CSV

Use actual database data.

Do not generate fake statistics.
```

---

## Prompt 18 – Security Audit

```text
Perform a security review of SmartExam.

Check:
- authentication
- authorization
- password hashing
- JWT
- CORS
- environment variables
- SQL injection risks
- input validation
- file upload validation
- role permissions
- audit logs
- secret exposure

Fix only verified security issues.

Do not rewrite unrelated modules.

Run tests after changes.
```

---

## Prompt 19 – Full Test Suite

```text
Run the complete SmartExam test suite.

Test:
database
authentication
CRUD
imports
constraints
fitness
selection
crossover
mutation
repair
GA engine
scheduler API
locking
versioning
approval
publishing
reports

Do not claim success without executing tests.

Report:
passed
failed
skipped
errors
coverage if available

For failures, identify the actual cause.
```

---

## Prompt 20 – Stress Test

```text
Perform scheduler stress testing using generated synthetic datasets.

Test at least:
100 students
500 students
1000 students
5000 students
10000 students

Test:
20 subjects
50 subjects
100 subjects
200 subjects

Measure:
execution time
generations
best fitness
hard violations
soft penalty
memory where measurable

Use multiple random seeds.

Store benchmark results.

Do not change production behavior merely to make the benchmark look better.
```

---

## Prompt 21 – Production Readiness

```text
Prepare SmartExam for production deployment.

Check:
Docker
Docker Compose
PostgreSQL
environment configuration
database migrations
frontend build
backend startup
health endpoint
logging
CORS
security
error handling

Create:
Dockerfile(s)
docker-compose.yml
.env.example
deployment documentation

Run a clean installation test from the documented setup.
```

---

## Prompt 22 – Final Code Review

```text
Perform a complete code review of SmartExam against the master project specification.

Check:
architecture
database
API
frontend
Genetic Algorithm
constraints
security
testing
documentation

Identify:
bugs
missing requirements
duplicate logic
dead code
unsafe code
poor error handling
untested critical paths

Fix only issues supported by the specification and current implementation.

Run the complete test suite afterward.

Provide a final requirement-by-requirement status report.
```

---

# 50. DOCUMENTATION REQUIREMENTS

Create and maintain:

```text
docs/requirements.md
docs/architecture.md
docs/database.md
docs/genetic_algorithm.md
docs/api.md
docs/testing.md
```

## genetic_algorithm.md must explain

- Genetic Algorithm concept
- Chromosome
- Gene
- Population
- Fitness
- Hard constraints
- Soft constraints
- Selection
- Crossover
- Mutation
- Repair
- Elitism
- Termination
- Complexity considerations
- Experimental results

Use diagrams where useful.

---

# 51. FINAL README REQUIREMENTS

The root README must contain:

1. Project overview
2. Features
3. Technology stack
4. Architecture
5. Installation
6. Environment variables
7. Database setup
8. Running backend
9. Running frontend
10. Running tests
11. Sample data
12. Genetic Algorithm configuration
13. API documentation
14. Deployment
15. Screenshots section
16. Benchmark results
17. Known limitations
18. Future scope

---

# 52. FUTURE SCOPE

Possible future enhancements:

- Multi-campus scheduling
- University ERP integration
- Constraint learning from historical schedules
- Advanced optimization algorithms
- Hybrid GA + local search
- Simulated Annealing comparison
- Tabu Search comparison
- Multi-objective optimization
- Mobile application
- QR-based room verification
- Automated attendance integration
- Notification system
- Email/SMS notifications

These are future scope, not mandatory core features.

---

# 53. ACADEMIC PROJECT DELIVERABLES

The final project should be capable of supporting:

## Software Engineering documentation

- Problem statement
- Objectives
- Scope
- SRS
- Use-case diagram
- Activity diagram
- Sequence diagram
- Class diagram
- ER diagram
- Architecture diagram
- Data flow diagram
- Test plan

## AI/Optimization documentation

- Genetic Algorithm theory
- Problem representation
- Fitness function
- Constraint model
- Algorithm steps
- Pseudocode
- Experimental setup
- Benchmark results
- Limitations

## Demonstration

Demonstrate:

```text
Login
-> Import data
-> Validate data
-> Configure constraints
-> Lock an assignment
-> Generate timetable
-> Show optimization
-> Show zero hard conflicts
-> Review
-> Approve
-> Publish
-> Student views timetable
-> Export report
```

---

# 54. PSEUDOCODE

```text
START

Load students
Load subjects
Load rooms
Load faculty
Load exam slots
Load constraints

Validate input data

IF validation fails:
    STOP and show errors

Validate locked assignments

IF locked assignments are invalid:
    STOP and show conflicts

Create initial population

FOR each chromosome:
    calculate fitness

FOR generation = 1 to maximum_generations:

    select parents

    create offspring using crossover

    mutate offspring

    preserve locked assignments

    repair offspring

    calculate fitness

    apply elitism

    record metrics

    IF best solution has zero hard violations
       AND target soft penalty is achieved:
        STOP

    IF cancellation requested:
        STOP

    IF time limit reached:
        STOP

Return best solution

Validate final solution

IF hard violations == 0:
    mark solution as valid candidate
ELSE:
    mark solution as invalid/incomplete

Store scheduler metrics
Create timetable version

END
```

---

# 55. IMPORTANT ENGINEERING PRINCIPLE

The Genetic Algorithm should NOT directly manipulate database records during every mutation/crossover operation.

Preferred architecture:

```text
Database
   |
   v
Load scheduling dataset
   |
   v
In-memory GA representation
   |
   v
Optimize
   |
   v
Validate best solution
   |
   v
Persist final timetable/version
```

This reduces database overhead and makes the algorithm easier to test.

---

# 56. IMPORTANT REAL-WORLD SAFETY RULE

Never automatically publish a timetable immediately after Genetic Algorithm generation.

Use:

```text
GENERATED
   ↓
VALIDATE
   ↓
UNDER REVIEW
   ↓
ADMIN APPROVAL
   ↓
PUBLISHED
```

Human approval remains required.

---

# 57. SUCCESS CRITERIA

The project is considered functionally successful when:

- Realistic data can be imported.
- Data validation catches invalid records.
- Scheduling can be configured.
- GA can generate candidate timetables.
- Hard conflicts are correctly detected.
- A valid timetable can reach zero hard violations for feasible datasets.
- Soft constraints are measurable.
- Manual locks are preserved.
- Timetable versions are stored.
- Admin approval works.
- Published timetable is accessible to students/faculty.
- Reports can be generated.
- Automated tests cover critical logic.
- Benchmark results are recorded.
- The application can be deployed using documented instructions.

Do not claim universal optimality. The Genetic Algorithm is a heuristic optimization method, so results should be reported for tested datasets and configurations.

---

# 58. FINAL DEVELOPMENT RULE

Work phase-by-phase.

After every phase:

1. Inspect changed files.
2. Run tests.
3. Fix actual failures.
4. Update documentation.
5. Do not move to the next major phase until the current phase is stable.
6. Report exactly what changed.
7. Report tests actually executed.
8. Report remaining issues.

The goal is a maintainable, testable, real-world examination scheduling application — not merely a visual demo.
