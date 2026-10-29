-- 029_rewards.sql

CREATE TABLE IF NOT EXISTS rewards (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id      UUID          NOT NULL REFERENCES kaizens(id) ON DELETE RESTRICT,
  assigned_by    UUID          NOT NULL REFERENCES users(id)   ON DELETE RESTRICT,
  reward_type    VARCHAR(50)   NOT NULL
    CHECK (reward_type IN ('REGULAR', 'SPECIAL')),
  reward_amount  DECIMAL(10,2),
  reward_details TEXT,
  assigned_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rewards_kaizen_id_idx ON rewards(kaizen_id);
CREATE INDEX IF NOT EXISTS rewards_assigned_by_idx ON rewards(assigned_by);
