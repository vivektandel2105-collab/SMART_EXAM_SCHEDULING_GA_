# SmartExam – Database Schema & Entity Documentation

## Core Tables Overview

- `users`: Credentials, system roles (`SUPER_ADMIN`, `EXAM_ADMIN`, `FACULTY`, `STUDENT`), active status.
- `departments`, `programs`, `semesters`, `divisions`: Institutional hierarchy.
- `students`: Roll number, personal details, link to program/semester/division.
- `faculty`: Staff ID, name, email, department link.
- `faculty_availability`: Time slot unavailability mapping for invigilators.
- `subjects`: Code, title, department, duration, paper type.
- `student_subjects`: Student-to-subject enrollment junction.
- `rooms`: Room number, building, floor, capacity, room type, default availability.
- `room_availability`: Time slot unavailability mapping for rooms.
- `exam_slots`: Examination dates, start time, end time, session names (Morning/Afternoon).
- `exams`: Exam instance tied to a subject and required duration.
- `exam_assignments`: Actual schedule gene mapping `(timetable_version_id, exam_id, slot_id, room_id, faculty_id, is_locked)`.
- `timetables`: Timetable root container with academic year, author, approval status.
- `timetable_versions`: Version history tracking fitness, hard/soft violation scores, creation timestamp.
- `scheduler_runs`: GA execution history storing config, random seed, execution status.
- `scheduler_metrics`: Per-generation stats tracking fitness progression over time.
- `audit_logs`: Detailed tracking of administrative actions (lock, approve, publish, import).
