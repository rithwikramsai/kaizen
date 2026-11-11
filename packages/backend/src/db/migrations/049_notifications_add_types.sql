-- 049_notifications_add_types.sql
-- Add HIGH_IMPACT_NOMINATED notification type to the check constraint.

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'IDEA_SUBMITTED',
    'STEP_ASSIGNED',
    'STEP_APPROVED',
    'STEP_RETURNED',
    'IDEA_APPROVED',
    'KAIZEN_APPROVED',
    'SLA_REMINDER',
    'SLA_ESCALATED',
    'REWARD_ASSIGNED',
    'HIGH_IMPACT_NOMINATED'
  ));
