-- 005_dev_data.sql
-- Development seed: one plant, one zone, one department, four test users
-- Password for ALL users: Password123
-- Run ONLY in development — guarded by the idempotent ON CONFLICT clause.

-- ─── Plant ───────────────────────────────────────────────────────────────────

INSERT INTO plants (id, name, code, address, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'ACG Plant Nashik', 'NSK', 'Nashik, Maharashtra', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ─── Zone ────────────────────────────────────────────────────────────────────

INSERT INTO zones (id, name, code, plant_id, is_active) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Zone A', 'NSK-A', '10000000-0000-0000-0000-000000000001', TRUE)
ON CONFLICT (code, plant_id) DO NOTHING;

-- ─── Department ──────────────────────────────────────────────────────────────

INSERT INTO departments (id, name, code, plant_id, zone_id, is_active) VALUES
  ('30000000-0000-0000-0000-000000000001', 'Engineering', 'NSK-A-ENG', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE)
ON CONFLICT DO NOTHING;

-- ─── Category ────────────────────────────────────────────────────────────────

INSERT INTO categories (id, name, code, is_active) VALUES
  ('40000000-0000-0000-0000-000000000001', 'Safety', 'SAFETY', TRUE),
  ('40000000-0000-0000-0000-000000000002', 'Quality', 'QUALITY', TRUE),
  ('40000000-0000-0000-0000-000000000003', 'Productivity', 'PRODUCTIVITY', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ─── Users ───────────────────────────────────────────────────────────────────
-- All passwords: Password123
-- Hash: $2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2

INSERT INTO users (id, employee_id, email, full_name, phone, password_hash, is_active, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'EMP001', 'admin@acg.com',        'System Admin',     '9000000001', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'EMP002', 'associate@acg.com',    'Raj Kumar',        '9000000002', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000003', 'EMP003', 'zoneleader@acg.com',   'Priya Sharma',     '9000000003', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000004', 'EMP004', 'hod@acg.com',          'Vikram Nair',      '9000000004', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000005', 'EMP005', 'opex@acg.com',         'Anita Desai',      '9000000005', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000006', 'EMP006', 'safety@acg.com',       'Suresh Pillai',    '9000000006', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000007', 'EMP007', 'quality@acg.com',      'Meena Krishnan',   '9000000007', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ─── User → Role assignments ──────────────────────────────────────────────────
-- Role stable UUIDs: 00000000-0000-0000-0000-000000000001..10

INSERT INTO user_roles (user_id, role_id, plant_id, granted_at, granted_by) VALUES
  -- System Admin
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001'),
  -- Plant Associate
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001'),
  -- Zone Leader
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001'),
  -- HOD
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001'),
  -- Plant OPEX
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001'),
  -- Plant Safety
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001'),
  -- Plant Quality
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;
