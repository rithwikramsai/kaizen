-- 044_ideas_contact_email.sql
-- Adds contact_email to ideas so plant associates can receive follow-up on their submissions.

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
