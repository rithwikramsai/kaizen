-- 025_workflow_flags.sql
-- 1:1 with workflow_instances — one flags row per instance

CREATE TABLE IF NOT EXISTS workflow_flags (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id   UUID        NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  machine_design_change  BOOLEAN     NOT NULL DEFAULT FALSE,
  safety_review_required BOOLEAN     NOT NULL DEFAULT FALSE,
  qms_review_required    BOOLEAN     NOT NULL DEFAULT FALSE,
  sci_tech_required      BOOLEAN     NOT NULL DEFAULT FALSE,
  set_by_user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  set_at                 TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS wf_flags_instance_uidx ON workflow_flags(workflow_instance_id);
