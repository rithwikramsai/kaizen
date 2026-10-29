-- 033_notifications.sql

CREATE TABLE IF NOT EXISTS notifications (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL
    CHECK (notification_type IN (
      'IDEA_SUBMITTED',
      'STEP_ASSIGNED',
      'STEP_APPROVED',
      'STEP_RETURNED',
      'IDEA_APPROVED',
      'KAIZEN_APPROVED',
      'SLA_REMINDER',
      'SLA_ESCALATED',
      'REWARD_ASSIGNED'
    )),
  title             VARCHAR(500) NOT NULL,
  body              TEXT,
  entity_type       VARCHAR(50)
    CHECK (entity_type IN ('idea', 'kaizen')),
  entity_id         UUID,
  is_read           BOOLEAN      NOT NULL DEFAULT FALSE,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_read_idx
  ON notifications(recipient_id, is_read);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
  ON notifications(created_at DESC);
