-- 008_functions.sql

CREATE TABLE IF NOT EXISTS functions (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_id    UUID         NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50)  NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS functions_dept_id_idx ON functions(dept_id);
