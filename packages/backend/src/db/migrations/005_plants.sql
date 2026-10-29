-- 005_plants.sql

CREATE TABLE IF NOT EXISTS plants (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  code       VARCHAR(50)  NOT NULL,
  address    TEXT,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS plants_code_uidx ON plants(code);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'plants_set_updated_at'
  ) THEN
    CREATE TRIGGER plants_set_updated_at
      BEFORE UPDATE ON plants
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
