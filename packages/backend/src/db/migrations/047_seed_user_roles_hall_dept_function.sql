-- 047_seed_user_roles_hall_dept_function.sql
-- Plant associate / regular employees had NULL hall_id, department_id, function_id
-- in user_roles. Assign sensible defaults so the public submission page can
-- auto-fill "Zone of Idea Owner" and "Hall of Idea Owner" correctly.

-- EMP002 → EMP013 are assigned to ACG Plant Nashik, Zone A.
-- Give them: Engineering dept, Mechanical function, Hall A1.

UPDATE user_roles ur
SET
  department_id = '30000000-0000-0000-0000-000000000001',  -- Engineering
  function_id   = '50000000-0000-0000-0000-000000000001',  -- Mechanical
  hall_id       = '60000000-0000-0000-0000-000000000001'   -- Hall A1
FROM users u
WHERE ur.user_id   = u.id
  AND u.employee_id IN ('EMP002','EMP003','EMP004','EMP005','EMP006',
                        'EMP007','EMP008','EMP009','EMP010','EMP011',
                        'EMP012','EMP013')
  AND ur.hall_id IS NULL;

-- EMP9001, EMP9002 (test users) — same defaults
UPDATE user_roles ur
SET
  department_id = '30000000-0000-0000-0000-000000000001',
  function_id   = '50000000-0000-0000-0000-000000000002',  -- Electrical
  hall_id       = '60000000-0000-0000-0000-000000000007'   -- Electrical Hall D1
FROM users u
WHERE ur.user_id   = u.id
  AND u.employee_id IN ('EMP9001','EMP9002')
  AND ur.hall_id IS NULL;
