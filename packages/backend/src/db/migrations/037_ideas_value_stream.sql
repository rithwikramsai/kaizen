-- 037_ideas_value_stream.sql
-- Adds an optional free-text value_stream field to ideas.
-- Value stream identifies the manufacturing/process flow the idea applies to
-- (e.g., "Assembly Line 3", "Packaging", "Inbound Logistics").

ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS value_stream VARCHAR(255);
