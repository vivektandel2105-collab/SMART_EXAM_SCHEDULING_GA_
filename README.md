# SmartExam – Automated Exam Scheduling Using Genetic Algorithm
> **AI Mini Project**: Conflict-Free, Capacity-Aware College Examination Timetable Generation via Genetic Optimization

---

## 📌 1. Project Overview & Problem Statement

Generating a university or college examination timetable is an **NP-hard combinatorial optimization problem**. When an institution has multiple subjects, limited classrooms, examination slots across multiple days, and student cohorts taking overlapping combinations of subjects, scheduling exams manually inevitably leads to timetable clashes and room deficits.

**SmartExam** solves this problem by utilizing an advanced, repaired **Genetic Algorithm (GA)** coupled with an **Independent Constraint Validator**. It guarantees:
1. **Zero Student Conflicts**: No student is scheduled for two overlapping examinations.
2. **Zero Room Overbooking**: No examination room is assigned to two exams at overlapping times.
3. **Room Capacity Compliance**: Every exam room has sufficient seating capacity for all enrolled students.
4. **Complete Scheduling**: Every registered subject is assigned to exactly one valid date, time slot, and room.
5. **Independent Audit**: An independent validation engine verifies every schedule strictly outside of the GA fitness function before marking it valid.
6. **Academic Export**: Direct 1-click export of the validated clash-free schedule into CSV spreadsheet format.

---

## 🏛️ 2. Core Architecture & Workflow

The user workflow is structured cleanly into three primary areas:

```text
[ 1. Data Management ] ───────────► [ 2. GA Optimization Engine ] ───────────► [ 3. Verification & Export ]
• Subjects & Exams                  • Conflict-Aware Population                • Independent Validation Audit
• Classrooms & Seating Capacities   • Hard-Constraint-Dominated Fitness        • Clash-Free Timetable Grid
• Exam Dates & Time Slots           • Tournament Selection & Safe Crossover    • Real Performance Metrics
• Student Cohorts & Enrollments     • Capacity-Aware Mutation & Elitism        • 1-Click CSV Timetable Download
• 1-Click Benchmark Sample Loader   • Early Convergence Termination (Zero HC)
```

### 1. Dashboard
- Displays academic master statistics (total exams, rooms, time slots, student enrollments).
- Pre-flight scheduling readiness check verifying capacity, exam counts, and room counts.
- Latest optimization run summary and direct 1-click schedule generator.

### 2. Manage Data
- Full management of **Subjects/Exams**, **Rooms & Capacities**, **Examination Slots**, and **Students & Enrollments**.
- **Load Benchmark Sample Data**: Instantly populates a realistic academic test problem (10 subjects, 200 students with overlapping cohorts, 5 classrooms, 5 days / 10 exam slots).

### 3. Timetable & Results
- **Timetable Grid**: Chronologically sorted timetable displaying Date, Time Slot, Subject Code, Subject Name, Room, Room Capacity, and Enrolled Students.
- **Independent Constraint Audit**: Real-time breakdown of student conflicts, room conflicts, capacity violations, invalid assignments, and overall validity status.
- **Performance Metrics**: Final fitness score, total hard violations (0 for valid), soft penalty, generations executed, and algorithm runtime.
- **Fitness Progression Chart**: Real recorded convergence curve across GA generations.
- **CSV Export**: Direct spreadsheet download of the active schedule.

---

## 🧬 3. Genetic Algorithm Implementation Details

### Chromosome Representation
- Each chromosome represents a complete candidate examination timetable.
- It consists of an array of genes: `[Gene(exam_id, slot_id, room_id, faculty_id)]`.
- Every registered examination appears **exactly once** in the chromosome, preventing missing or duplicate exams.

### Population Initialization
- Configurable population size (default: 40–50 candidate timetables).
- Utilizes capacity-aware room assignment and slot distribution so candidate solutions start closer to feasibility.

### Fitness Evaluation & Hard-Constraint Domination
The fitness function minimizes a composite penalty model:
$$\text{Cost} = (W_{\text{hard}} \times V_{\text{hard}}) + \sum (W_{\text{soft}} \times V_{\text{soft}})$$
$$\text{Fitness} = \frac{1.0}{1.0 + \text{Cost}}$$
- **Hard Constraints ($W_{\text{hard}} = 50,000$)**:
  - **HC-01 (Student Conflict)**: Evaluated in $O(1)$ time via a precomputed boolean student conflict matrix.
  - **HC-02 (Room Conflict)**: Detects overlapping exams in the same room across clock-time intervals.
  - **HC-03 (Room Capacity Deficit)**: Flags assignments where enrolled student count exceeds room capacity.
  - **HC-04 (Faculty Conflict)**: Prevents an invigilator from presiding over simultaneous exams.
- **Hard-Constraint Domination**: A schedule with even 1 hard violation is strictly ranked below any schedule with 0 hard violations, regardless of soft constraints.

### Selection & Elitism
- **Tournament Selection**: Selects parent chromosomes via $k$-way tournament ($k=5$), maintaining population diversity while prioritizing fitter schedules.
- **Elitism**: Top $N$ fittest chromosomes (default: 5) are preserved unchanged across generations.

### Crossover & Mutation
- **Safe Uniform Crossover**: Swaps examination assignments between parents without mutating the parent instances in-place or losing exams.
- **Capacity-Aware Mutation**: Mutates time slots and randomly reassigns rooms from the subset of classrooms that meet or exceed the examination's enrollment size.

### Early Termination
- The engine halts immediately when a candidate reaches **0 hard violations** (`TARGET_REACHED`), preventing redundant computation and ensuring fast response times (< 1 second for standard benchmarks).

---

## 🛡️ 4. Independent Constraint Validator

A standalone module (`IndependentConstraintValidator`) validates the final schedule **independently of the Genetic Algorithm**:
- Checks all exam pairs against raw enrollment tables in SQLite.
- Verifies physical room sharing and overlapping start/end times.
- Verifies room capacity against student count.
- Confirms complete scheduling ($100\%$ exam coverage).
- Guarantees zero false positives: a schedule is marked **Valid** if and only if total hard violations equal **0**.

---

## 💻 5. Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite (with PostgreSQL compatibility), Pydantic v2.
- **Algorithm Engine**: Pure Python Genetic Algorithm with NumPy matrix acceleration.
- **Frontend**: React 18, Vite, Tailwind CSS, Heroicons.
- **Testing**: Pytest, FastAPI TestClient.

---

## 🚀 6. Installation & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ & npm

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Activate Python environment (or use system Python)
# On Windows:
python -m venv venv
venv\Scripts\activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Run automated tests (All 72 tests must pass)
pytest -v

# 5. Start the FastAPI server
uvicorn app.main:app --reload --port 8000
```
- API Swagger documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### Frontend Setup
```bash
# 1. Navigate to frontend directory in a new terminal
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
- Open `http://localhost:5173` in your web browser.

---

## 🎓 7. Demonstration Guide for Evaluation

Follow this quick step-by-step sequence to demonstrate the project:

1. **Sign In**:
   - Open `http://localhost:5173`.
   - Click the **"One-Click Demo Admin"** button (signs in with `admin@smartexam.edu`).

2. **Load Benchmark Sample Data**:
   - Go to the **Manage Data** tab in the navigation bar.
   - Click the green **"Load Benchmark Sample Data"** button.
   - The system automatically loads 10 subjects, 5 classrooms, 5 exam dates (10 time slots), and 200 students with overlapping enrollments.

3. **Verify Scheduling Data**:
   - Switch between the sub-tabs: *Subjects / Exams*, *Classrooms & Capacity*, *Time Slots*, and *Students & Enrollments*.
   - Confirm that student enrollment overlap exists (e.g., cohorts taking both CS301 and CS302).

4. **Generate Conflict-Free Timetable**:
   - Go to the **Dashboard** or **Timetable & Results** tab.
   - Click **"Generate Timetable"** (or configure population size and generations).
   - The Genetic Algorithm will execute, evaluate hard constraints, and display the optimized schedule.

5. **Inspect Independent Validation Audit**:
   - View the **Independent Constraint Validation** card:
     - Student Conflicts: `0`
     - Room Conflicts: `0`
     - Room Capacity Deficits: `0`
     - Status: `PASSED · 100% Conflict-Free Timetable`
   - Review the **Algorithm Performance & Convergence** metrics (runtime, generations, best fitness score, and convergence curve).

6. **Export Timetable**:
   - Click the **"Export CSV"** button.
   - A verified `.csv` file will download immediately, ready to open in Microsoft Excel or Google Sheets.

---

## 🧪 8. Test Suite

Run the full automated test suite containing 72 tests covering every unit, genetic operator, constraint rule, and API endpoint:
```bash
cd backend
pytest -v
```

Tests include:
- `test_independent_validator_detects_deliberate_student_conflict`: Injects student clash and asserts validator flags it.
- `test_independent_validator_detects_deliberate_room_conflict`: Injects room overbooking and asserts validator flags it.
- `test_independent_validator_detects_capacity_deficit`: Injects undersized room assignment and asserts validator flags it.
- `test_exams_without_shared_students_can_run_simultaneously`: Verifies non-overlapping student exams can execute in parallel rooms.
- `test_crossover_preserves_chromosome_integrity`: Verifies crossover leaves gene counts and types intact.
- `test_mutation_preserves_chromosome_integrity`: Verifies mutation produces valid assignments.
- `test_sample_problem_solves_and_exports_csv`: Solves 10-subject 200-student benchmark and exports valid CSV.
- `test_api_scheduler_generate_sync_and_csv_export`: Validates end-to-end API generation and CSV download.
