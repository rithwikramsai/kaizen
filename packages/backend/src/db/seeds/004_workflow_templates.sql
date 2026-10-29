-- 004_workflow_templates.sql
-- Seeds both workflow templates and all their template steps (base + dynamic reference rows)
-- Idempotent: ON CONFLICT DO NOTHING
--
-- Template UUIDs (stable):
--   IDEA_APPROVAL            = 00000000-0000-0000-0002-000000000001
--   IMPLEMENTATION_APPROVAL  = 00000000-0000-0000-0002-000000000002

-- ── Workflow Templates ────────────────────────────────────────────────────────

INSERT INTO workflow_templates (id, workflow_type, name, description, is_active) VALUES
  (
    '00000000-0000-0000-0002-000000000001',
    'IDEA_APPROVAL',
    'Idea Approval Workflow',
    'Standard multi-step approval workflow for submitted ideas. Base steps: Zone Leader Review → HOD Review. Dynamic steps inserted when HOD sets safety/QMS flags.',
    TRUE
  ),
  (
    '00000000-0000-0000-0002-000000000002',
    'IMPLEMENTATION_APPROVAL',
    'Implementation Approval Workflow',
    'Approval workflow for One Pager (kaizen) submissions. Base steps: Zone Leader Review → HOD Review. Dynamic steps inserted based on flags inherited from Idea Approval plus SME flag.',
    TRUE
  )
ON CONFLICT (workflow_type) DO NOTHING;

-- ── IDEA_APPROVAL template steps ─────────────────────────────────────────────
-- Base steps (is_dynamic = FALSE) are always generated when a workflow instance is created.
-- Dynamic steps (is_dynamic = TRUE) are reference rows only — engine inserts actual
-- workflow_steps rows at runtime when the corresponding flag is set.

INSERT INTO workflow_template_steps
  (id, template_id, step_order, stage_code, assigned_role, is_dynamic, sla_hours)
VALUES
  -- Base
  (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0002-000000000001',
    1, 'ZONE_LEADER_REVIEW', 'zone_leader', FALSE, 48
  ),
  (
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0002-000000000001',
    2, 'HOD_REVIEW', 'hod', FALSE, 48
  ),
  -- Dynamic (inserted when HOD sets safety_review_required = true)
  (
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0002-000000000001',
    3, 'SAFETY_REVIEW', 'plant_safety', TRUE, 48
  ),
  -- Dynamic (inserted when HOD sets qms_review_required = true)
  (
    '00000000-0000-0000-0003-000000000004',
    '00000000-0000-0000-0002-000000000001',
    4, 'QUALITY_REVIEW', 'plant_quality', TRUE, 48
  )
ON CONFLICT (template_id, step_order) DO NOTHING;

-- ── IMPLEMENTATION_APPROVAL template steps ────────────────────────────────────

INSERT INTO workflow_template_steps
  (id, template_id, step_order, stage_code, assigned_role, is_dynamic, sla_hours)
VALUES
  -- Base
  (
    '00000000-0000-0000-0003-000000000005',
    '00000000-0000-0000-0002-000000000002',
    1, 'ZONE_LEADER_REVIEW', 'zone_leader', FALSE, 72
  ),
  (
    '00000000-0000-0000-0003-000000000006',
    '00000000-0000-0000-0002-000000000002',
    2, 'HOD_REVIEW', 'hod', FALSE, 72
  ),
  -- Dynamic (inserted when machine_design_change = true, inherited from Idea Approval)
  (
    '00000000-0000-0000-0003-000000000007',
    '00000000-0000-0000-0002-000000000002',
    3, 'SME_REVIEW', 'sme', TRUE, 72
  ),
  -- Dynamic (inserted when safety_review_required = true, inherited from Idea Approval)
  (
    '00000000-0000-0000-0003-000000000008',
    '00000000-0000-0000-0002-000000000002',
    4, 'SAFETY_REVIEW', 'plant_safety', TRUE, 48
  ),
  -- Dynamic (inserted when qms_review_required = true, inherited from Idea Approval)
  (
    '00000000-0000-0000-0003-000000000009',
    '00000000-0000-0000-0002-000000000002',
    5, 'QUALITY_REVIEW', 'plant_quality', TRUE, 48
  ),
  -- Dynamic (inserted when SME sets sci_tech_required = true during SME_REVIEW)
  (
    '00000000-0000-0000-0003-000000000010',
    '00000000-0000-0000-0002-000000000002',
    6, 'SCI_TECH_UPLOAD', 'hod', TRUE, 120
  )
ON CONFLICT (template_id, step_order) DO NOTHING;
