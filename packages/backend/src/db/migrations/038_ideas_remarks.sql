-- 038_ideas_remarks.sql
-- Adds a remarks field to ideas for submitter's free-form notes
-- (replaces the removed expected_benefits / proposed_solution form fields).

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS remarks TEXT;
