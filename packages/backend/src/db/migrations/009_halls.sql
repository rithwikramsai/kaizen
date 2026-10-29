-- 009_halls.sql

CREATE TABLE IF NOT EXISTS halls (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  func_id    UUID         NOT NULL REFERENCES functions(id) ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50)  NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS halls_func_id_idx ON halls(func_id);
