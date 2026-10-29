-- 018_ideas.sql

CREATE TABLE IF NOT EXISTS ideas (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id VARCHAR(20),
  submitted_by    UUID         REFERENCES users(id)          ON DELETE SET NULL,
  plant_id        UUID         REFERENCES plants(id)         ON DELETE RESTRICT,
  zone_id         UUID         REFERENCES zones(id)          ON DELETE RESTRICT,
  department_id   UUID         REFERENCES departments(id)    ON DELETE RESTRICT,
  function_id     UUID         REFERENCES functions(id)      ON DELETE RESTRICT,
  hall_id         UUID         REFERENCES halls(id)          ON DELETE RESTRICT,
  location_id     UUID         REFERENCES locations(id)      ON DELETE RESTRICT,
  category_id     UUID         REFERENCES categories(id)     ON DELETE RESTRICT,
  sub_category_id UUID         REFERENCES sub_categories(id) ON DELETE RESTRICT,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  problem_statement  TEXT,
  proposed_solution  TEXT,
  expected_benefits  TEXT,
  is_anonymous    BOOLEAN      NOT NULL DEFAULT FALSE,
  status          VARCHAR(50)  NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ideas_registration_id_uidx ON ideas(registration_id)
  WHERE registration_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ideas_submitted_by_idx ON ideas(submitted_by);
CREATE INDEX IF NOT EXISTS ideas_plant_id_idx     ON ideas(plant_id);
CREATE INDEX IF NOT EXISTS ideas_status_idx       ON ideas(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'ideas_set_updated_at'
  ) THEN
    CREATE TRIGGER ideas_set_updated_at
      BEFORE UPDATE ON ideas
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
