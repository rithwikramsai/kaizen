-- 032_inter_plant_nominations.sql

CREATE TABLE IF NOT EXISTS inter_plant_nominations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id         UUID        NOT NULL REFERENCES kaizens(id)                      ON DELETE RESTRICT,
  nomination_id     UUID        REFERENCES high_impact_nominations(id)               ON DELETE SET NULL,
  nominated_by      UUID        NOT NULL REFERENCES users(id)                        ON DELETE RESTRICT,
  competition_year  INTEGER     NOT NULL,
  competition_round VARCHAR(50) NOT NULL
    CHECK (competition_round IN ('PLANT', 'CLUSTER', 'NATIONAL')),
  result            VARCHAR(50)
    CHECK (result IN ('WON', 'RUNNER_UP', 'PARTICIPATED')),
  nominated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inter_plant_nom_kaizen_id_idx ON inter_plant_nominations(kaizen_id);
CREATE INDEX IF NOT EXISTS inter_plant_nom_year_idx      ON inter_plant_nominations(competition_year);
