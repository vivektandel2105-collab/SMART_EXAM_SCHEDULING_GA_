-- SmartExam Database Initial PostgreSQL / SQLite Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, EXAM_ADMIN, FACULTY, STUDENT
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
    id VARCHAR(36) PRIMARY KEY,
    department_id VARCHAR(36) REFERENCES departments(id),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS semesters (
    id VARCHAR(36) PRIMARY KEY,
    program_id VARCHAR(36) REFERENCES programs(id),
    number INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS divisions (
    id VARCHAR(36) PRIMARY KEY,
    semester_id VARCHAR(36) REFERENCES semesters(id),
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    program_id VARCHAR(36) REFERENCES programs(id),
    semester_id VARCHAR(36) REFERENCES semesters(id),
    division_id VARCHAR(36) REFERENCES divisions(id),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id VARCHAR(36) REFERENCES departments(id),
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(36) PRIMARY KEY,
    subject_code VARCHAR(100) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    department_id VARCHAR(36) REFERENCES departments(id),
    program_id VARCHAR(36) REFERENCES programs(id),
    semester_id VARCHAR(36) REFERENCES semesters(id),
    exam_duration_minutes INTEGER DEFAULT 180,
    exam_type VARCHAR(50) DEFAULT 'THEORY',
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS student_subjects (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) REFERENCES students(id),
    subject_id VARCHAR(36) REFERENCES subjects(id),
    UNIQUE(student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(36) PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor INTEGER DEFAULT 1,
    capacity INTEGER NOT NULL,
    room_type VARCHAR(50) DEFAULT 'CLASSROOM',
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exam_slots (
    id VARCHAR(36) PRIMARY KEY,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_name VARCHAR(50) NOT NULL, -- MORNING, AFTERNOON
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(36) REFERENCES subjects(id),
    exam_duration_minutes INTEGER DEFAULT 180,
    status VARCHAR(50) DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS timetables (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by VARCHAR(36) REFERENCES users(id),
    approved_by VARCHAR(36) REFERENCES users(id),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timetable_versions (
    id VARCHAR(36) PRIMARY KEY,
    timetable_id VARCHAR(36) REFERENCES timetables(id),
    version_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'GENERATED',
    fitness_score DOUBLE PRECISION,
    hard_violations INTEGER DEFAULT 0,
    soft_violations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS exam_assignments (
    id VARCHAR(36) PRIMARY KEY,
    timetable_version_id VARCHAR(36) REFERENCES timetable_versions(id),
    exam_id VARCHAR(36) REFERENCES exams(id),
    slot_id VARCHAR(36) REFERENCES exam_slots(id),
    room_id VARCHAR(36) REFERENCES rooms(id),
    faculty_id VARCHAR(36) REFERENCES faculty(id),
    is_locked BOOLEAN DEFAULT FALSE
);
