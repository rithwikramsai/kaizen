-- 001_roles.sql
-- Idempotent: ON CONFLICT DO NOTHING

INSERT INTO roles (id, name, description, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Plant Associate',           'Frontline employee — submits ideas, implements kaizens',            TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Management Associate',      'Staff/management layer — submits ideas on behalf of team',           TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Zone Leader',               'First-level reviewer for ideas and One Pagers in their zone',        TRUE),
  ('00000000-0000-0000-0000-000000000004', 'HOD',                       'Head of Department — second-level reviewer, sets dynamic flags',     TRUE),
  ('00000000-0000-0000-0000-000000000005', 'Plant OPEX',                'Operations Excellence — manages master data, drives R&R',            TRUE),
  ('00000000-0000-0000-0000-000000000006', 'Plant Safety',              'Safety reviewer — reviews ideas/One Pagers when safety flag set',    TRUE),
  ('00000000-0000-0000-0000-000000000007', 'Plant Quality',             'Quality reviewer — reviews ideas/One Pagers when QMS flag set',      TRUE),
  ('00000000-0000-0000-0000-000000000008', 'SME',                       'Subject Matter Expert — reviews One Pagers when design change flag', TRUE),
  ('00000000-0000-0000-0000-000000000009', 'Steering Committee Member', 'Rates High Impact nominations',                                       TRUE),
  ('00000000-0000-0000-0000-000000000010', 'System Admin',              'Full system access — manages users, master data, configuration',     TRUE)
ON CONFLICT (name) DO NOTHING;
