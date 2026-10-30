-- 036_user_roles_home_assignment.sql
-- Adds optional home-assignment columns to user_roles so an employee's
-- default zone / department / function / hall within a plant can be stored.
-- These drive the "Your Profile" read-only display on the idea submission form
-- and allow zone-scoped workflow-assignee resolution.

ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS zone_id       UUID REFERENCES zones(id)       ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id)  ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS function_id   UUID REFERENCES functions(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hall_id       UUID REFERENCES halls(id)        ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_roles_zone_id_idx ON user_roles(zone_id)
  WHERE zone_id IS NOT NULL;
