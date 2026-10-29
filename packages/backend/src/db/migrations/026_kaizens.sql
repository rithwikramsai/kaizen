-- 026_kaizens.sql

CREATE TABLE IF NOT EXISTS kaizens (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id               VARCHAR(20),
  idea_id                 UUID          NOT NULL REFERENCES ideas(id) ON DELETE RESTRICT,
  implementation_owner    UUID          REFERENCES users(id) ON DELETE SET NULL,
  assigned_by             UUID          REFERENCES users(id) ON DELETE SET NULL,
  title                   VARCHAR(500)  NOT NULL,
  before_description      TEXT,
  after_description       TEXT,
  benefits_achieved       TEXT,
  cost_savings            DECIMAL(15,2),
  productivity_gain       TEXT,
  quality_improvement     TEXT,
  safety_improvement      TEXT,
  implementation_date     DATE,
  status                  VARCHAR(50)   NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'ONE_PAGER_SUBMITTED', 'APPROVED', 'REJECTED')),
  one_pager_submitted_at  TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS kaizens_kaizen_id_uidx ON kaizens(kaizen_id)
  WHERE kaizen_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS kaizens_idea_id_uidx ON kaizens(idea_id);

CREATE INDEX IF NOT EXISTS kaizens_implementation_owner_idx ON kaizens(implementation_owner);
CREATE INDEX IF NOT EXISTS kaizens_status_idx              ON kaizens(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'kaizens_set_updated_at'
  ) THEN
    CREATE TRIGGER kaizens_set_updated_at
      BEFORE UPDATE ON kaizens
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
