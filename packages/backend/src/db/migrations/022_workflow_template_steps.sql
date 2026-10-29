-- 022_workflow_template_steps.sql

CREATE TABLE IF NOT EXISTS workflow_template_steps (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID         NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  step_order    INTEGER      NOT NULL,
  stage_code    VARCHAR(100) NOT NULL,
  assigned_role VARCHAR(100) NOT NULL,
  is_dynamic    BOOLEAN      NOT NULL DEFAULT FALSE,
  sla_hours     INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS wf_template_steps_order_uidx
  ON workflow_template_steps(template_id, step_order);

CREATE INDEX IF NOT EXISTS wf_template_steps_template_idx ON workflow_template_steps(template_id);
