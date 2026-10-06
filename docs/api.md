# SmartExam – REST API Specification Overview

## API Route Summary

### Authentication (`/api/auth`)
- `POST /api/auth/login`: User authentication & JWT issuance.
- `GET /api/auth/me`: Current active user profile & roles.

### Core Data Entities (`/api/students`, `/api/subjects`, `/api/faculty`, `/api/rooms`, `/api/exam-slots`)
- Standard RESTful CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`).
- File Upload Endpoints: `POST /api/students/import`, `POST /api/subjects/import`, `POST /api/faculty/import`.

### Scheduler & Timetable Engine (`/api/scheduler`, `/api/timetables`)
- `POST /api/scheduler/validate`: Pre-scheduling data integrity validation.
- `POST /api/scheduler/generate`: Launch asynchronous GA optimization run.
- `GET /api/scheduler/runs/{id}`: Poll status & real-time metrics.
- `POST /api/scheduler/runs/{id}/cancel`: Cancel active GA run.
- `POST /api/timetables/{id}/lock-assignment`: Lock specific exam gene.
- `POST /api/timetables/{id}/approve`: Admin timetable approval.
- `POST /api/timetables/{id}/publish`: Publish timetable for students & faculty.
