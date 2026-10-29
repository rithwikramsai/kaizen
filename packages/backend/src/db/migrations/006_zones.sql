-- 006_zones.sql

CREATE TABLE IF NOT EXISTS zones (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id   UUID         NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50)  NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS zones_code_plant_uidx ON zones(code, plant_id);
CREATE INDEX IF NOT EXISTS zones_plant_id_idx ON zones(plant_id);
