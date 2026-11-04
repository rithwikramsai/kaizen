-- 041_auth_security.sql
-- Adds password change tracking for 90-day expiry enforcement (L11)
-- and password reset token storage for the forgot-password flow (M14).

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

-- Initialize existing rows so they don't immediately trigger the expiry check.
UPDATE users SET password_changed_at = NOW() WHERE password_changed_at IS NULL;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64)  NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ  NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS prt_user_id_idx    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS prt_token_hash_idx ON password_reset_tokens(token_hash);
