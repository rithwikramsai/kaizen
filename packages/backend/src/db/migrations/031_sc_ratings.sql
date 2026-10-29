-- 031_sc_ratings.sql

CREATE TABLE IF NOT EXISTS sc_ratings (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id UUID         NOT NULL REFERENCES high_impact_nominations(id) ON DELETE CASCADE,
  sc_member_id  UUID         NOT NULL REFERENCES users(id)                   ON DELETE RESTRICT,
  rating_score  DECIMAL(3,1),
  rating_notes  TEXT,
  has_rated     BOOLEAN      NOT NULL DEFAULT FALSE,
  rated_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS sc_ratings_nomination_member_uidx
  ON sc_ratings(nomination_id, sc_member_id);

CREATE INDEX IF NOT EXISTS sc_ratings_nomination_id_idx ON sc_ratings(nomination_id);
CREATE INDEX IF NOT EXISTS sc_ratings_sc_member_id_idx  ON sc_ratings(sc_member_id);
