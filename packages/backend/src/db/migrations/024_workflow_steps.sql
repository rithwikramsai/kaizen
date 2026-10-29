-- 024_workflow_steps.sql

CREATE TABLE IF NOT EXISTS workflow_steps (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID         NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  step_order           INTEGER      NOT NULL,
  stage_code           VARCHAR(100) NOT NULL,
  assigned_user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  status               VARCHAR(50)  NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'RETURNED', 'REJECTED', 'SKIPPED')),
  comment              TEXT,
  action_taken_at      TIMESTAMPTZ,
  action_assigned_at   TIMESTAMPTZ,
  sla_due_at           TIMESTAMPTZ,
  escalated            BOOLEAN      NOT NULL DEFAULT FALSE,
  is_dynamic           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wf_steps_instance_status_idx
  ON workflow_steps(workflow_instance_id, status);

CREATE INDEX IF NOT EXISTS wf_steps_assigned_user_status_idx
  ON workflow_steps(assigned_user_id, status);

CREATE INDEX IF NOT EXISTS wf_steps_sla_due_at_idx
  ON workflow_steps(sla_due_at)
  WHERE escalated = FALSE;

CREATE INDEX IF NOT EXISTS wf_steps_instance_id_idx ON workflow_steps(workflow_instance_id);
