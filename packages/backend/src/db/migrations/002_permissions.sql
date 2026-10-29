-- 002_permissions.sql

CREATE TABLE IF NOT EXISTS permissions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS permissions_code_uidx ON permissions(code);
