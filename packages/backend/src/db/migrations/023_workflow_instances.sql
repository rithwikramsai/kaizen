-- 023_workflow_instances.sql

CREATE TABLE IF NOT EXISTS workflow_instances (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    UUID         NOT NULL REFERENCES workflow_templates(id) ON DELETE RESTRICT,
  entity_type    VARCHAR(50)  NOT NULL
    CHECK (entity_type IN ('idea', 'kaizen')),
  entity_id      UUID         NOT NULL,
  workflow_type  VARCHAR(50)  NOT NULL
    CHECK (workflow_type IN ('IDEA_APPROVAL', 'IMPLEMENTATION_APPROVAL')),
  current_stage  VARCHAR(100),
  current_status VARCHAR(50)  NOT NULL DEFAULT 'PENDING'
    CHECK (current_status IN ('PENDING', 'IN_PROGRESS', 'APPROVED', 'RETURNED', 'REJECTED', 'COMPLETED')),
  initiated_by   UUID         REFERENCES users(id) ON DELETE SET NULL,
  initiated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wf_instances_entity_idx
  ON workflow_instances(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS wf_instances_stage_status_idx
  ON workflow_instances(current_stage, current_status);

CREATE INDEX IF NOT EXISTS wf_instances_template_idx ON workflow_instances(template_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'workflow_instances_set_updated_at'
  ) THEN
    CREATE TRIGGER workflow_instances_set_updated_at
      BEFORE UPDATE ON workflow_instances
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
