-- 016_sla_configs.sql

CREATE TABLE IF NOT EXISTS sla_configs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id         UUID         NOT NULL REFERENCES plants(id) ON DELETE RESTRICT,
  stage_code       VARCHAR(100) NOT NULL,
  workflow_type    VARCHAR(50)  NOT NULL
    CHECK (workflow_type IN ('IDEA_APPROVAL', 'IMPLEMENTATION_APPROVAL')),
  sla_hours        INTEGER      NOT NULL,
  reminder_hrs     INTEGER,
  escalate_to_role VARCHAR(100),
  second_esc_hrs   INTEGER,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sla_configs_plant_stage_type_uidx
  ON sla_configs(plant_id, stage_code, workflow_type);

CREATE INDEX IF NOT EXISTS sla_configs_plant_id_idx ON sla_configs(plant_id);
