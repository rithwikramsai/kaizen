-- 017_user_roles.sql
-- user_roles comes after users, roles, and plants are all created

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    UUID        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  role_id    UUID        NOT NULL REFERENCES roles(id)  ON DELETE RESTRICT,
  plant_id   UUID        NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID        REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role_id, plant_id)
);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx  ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx  ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS user_roles_plant_id_idx ON user_roles(plant_id);
