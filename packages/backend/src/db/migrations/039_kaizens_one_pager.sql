-- 039_kaizens_one_pager.sql
-- Adds One Pager fields to kaizens required by Phase 6 / BRD F033-F078.

ALTER TABLE kaizens
  ADD COLUMN IF NOT EXISTS team_members          TEXT,
  ADD COLUMN IF NOT EXISTS business_impact       TEXT,
  -- 5W1H
  ADD COLUMN IF NOT EXISTS w1h_who               TEXT,
  ADD COLUMN IF NOT EXISTS w1h_what              TEXT,
  ADD COLUMN IF NOT EXISTS w1h_where             TEXT,
  ADD COLUMN IF NOT EXISTS w1h_when              TEXT,
  ADD COLUMN IF NOT EXISTS w1h_why               TEXT,
  ADD COLUMN IF NOT EXISTS w1h_how               TEXT,
  -- 5 Why Analysis
  ADD COLUMN IF NOT EXISTS why_1                 TEXT,
  ADD COLUMN IF NOT EXISTS why_2                 TEXT,
  ADD COLUMN IF NOT EXISTS why_3                 TEXT,
  ADD COLUMN IF NOT EXISTS why_4                 TEXT,
  ADD COLUMN IF NOT EXISTS why_5                 TEXT,
  -- Root Cause
  ADD COLUMN IF NOT EXISTS root_cause_analysis   TEXT,
  ADD COLUMN IF NOT EXISTS category_of_cause     VARCHAR(100),
  -- Implementation
  ADD COLUMN IF NOT EXISTS solution_implemented  TEXT,
  ADD COLUMN IF NOT EXISTS results               TEXT,
  -- Cost/Benefit
  ADD COLUMN IF NOT EXISTS cost                  DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS benefit               DECIMAL(15,2),
  -- Additional
  ADD COLUMN IF NOT EXISTS early_equipment_mgmt  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS applicable_documents  TEXT,
  ADD COLUMN IF NOT EXISTS remarks               TEXT;
