-- 040_add_returned_status.sql
-- Add RETURNED as a valid status for ideas and kaizens to support the Return/Rework/Resubmit flow.

ALTER TABLE ideas
  DROP CONSTRAINT IF EXISTS ideas_status_check;

ALTER TABLE ideas
  ADD CONSTRAINT ideas_status_check
  CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED'));

ALTER TABLE kaizens
  DROP CONSTRAINT IF EXISTS kaizens_status_check;

ALTER TABLE kaizens
  ADD CONSTRAINT kaizens_status_check
  CHECK (status IN ('PENDING', 'IN_PROGRESS', 'ONE_PAGER_SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED'));
