-- 021_workflow_templates.sql

CREATE TABLE IF NOT EXISTS workflow_templates (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_type VARCHAR(50)  NOT NULL
    CHECK (workflow_type IN ('IDEA_APPROVAL', 'IMPLEMENTATION_APPROVAL')),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS workflow_templates_type_uidx ON workflow_templates(workflow_type);
