-- 030_high_impact_nominations.sql

CREATE TABLE IF NOT EXISTS high_impact_nominations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id         UUID        NOT NULL REFERENCES kaizens(id) ON DELETE RESTRICT,
  nominated_by      UUID        NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
  nomination_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_RATINGS'
    CHECK (nomination_status IN (
      'PENDING_RATINGS',
      'RATINGS_COMPLETE',
      'NOMINATED_SPECIAL',
      'NOMINATED_INTER_PLANT',
      'CLOSED'
    )),
  nominated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hi_nominations_kaizen_id_idx ON high_impact_nominations(kaizen_id);
CREATE INDEX IF NOT EXISTS hi_nominations_status_idx    ON high_impact_nominations(nomination_status);
