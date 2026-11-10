-- 045_value_streams_plant.sql
-- Adds optional plant_id to value_streams so streams can be scoped per plant.
-- NULL = global (shown for every plant). Non-null = plant-specific only.

ALTER TABLE value_streams
  ADD COLUMN IF NOT EXISTS plant_id UUID REFERENCES plants(id) ON DELETE CASCADE;

-- Existing 12 seeded streams keep plant_id = NULL (global).
-- Index for fast per-plant lookup.
CREATE INDEX IF NOT EXISTS idx_value_streams_plant ON value_streams (plant_id);
