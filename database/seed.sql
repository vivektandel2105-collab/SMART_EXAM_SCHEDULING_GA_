-- SmartExam Initial Seed Data Template

-- Default Admin User (Password: Admin@123)
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES (
    'usr-admin-001',
    'System Admin',
    'admin@smartexam.edu',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', -- bcrypt for Admin@123
    'SUPER_ADMIN',
    TRUE
) ON CONFLICT DO NOTHING;

-- Initial Department
INSERT INTO departments (id, code, name)
VALUES ('dept-cs-01', 'CS', 'Computer Science and Engineering')
ON CONFLICT DO NOTHING;

-- Initial Program
INSERT INTO programs (id, department_id, code, name)
VALUES ('prog-btech-cs', 'dept-cs-01', 'BTECH-CS', 'B.Tech Computer Science')
ON CONFLICT DO NOTHING;
