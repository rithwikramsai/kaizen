-- 034_audit_logs.sql
-- IMMUTABLE — never update or delete rows

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  performed_by UUID         REFERENCES users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL
    CHECK (action IN (
      'IDEA_SUBMITTED',
      'STEP_APPROVED',
      'STEP_RETURNED',
      'STEP_REJECTED',
      'MARKED_IMPLEMENTED',
      'ONE_PAGER_DRAFT_SAVED',
      'ONE_PAGER_SUBMITTED',
      'SCI_TECH_UPLOADED',
      'KAIZEN_APPROVED',
      'REGULAR_REWARD_ASSIGNED',
      'HIGH_IMPACT_NOMINATED',
      'SC_RATING_SUBMITTED',
      'SPECIAL_REWARD_NOMINATED',
      'INTER_PLANT_NOMINATED',
      'SLA_REMINDER_SENT',
      'SLA_ESCALATED'
    )),
  entity_type  VARCHAR(50)  NOT NULL,
  entity_id    UUID         NOT NULL,
  payload      JSONB,
  ip_address   VARCHAR(45),
  performed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS audit_logs_performed_by_idx
  ON audit_logs(performed_by);

CREATE INDEX IF NOT EXISTS audit_logs_performed_at_idx
  ON audit_logs(performed_at DESC);
