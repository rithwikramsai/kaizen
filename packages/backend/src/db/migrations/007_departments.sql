-- 007_departments.sql

CREATE TABLE IF NOT EXISTS departments (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id   UUID         NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  zone_id    UUID         NOT NULL REFERENCES zones(id)  ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50)  NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS departments_plant_id_idx ON departments(plant_id);
CREATE INDEX IF NOT EXISTS departments_zone_id_idx  ON departments(zone_id);
