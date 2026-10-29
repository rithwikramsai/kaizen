-- 010_locations.sql

CREATE TABLE IF NOT EXISTS locations (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id    UUID         NOT NULL REFERENCES halls(id) ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50)  NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS locations_hall_id_idx ON locations(hall_id);
