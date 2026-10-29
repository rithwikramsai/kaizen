-- 035_refresh_tokens.sql
-- Stores hashed refresh tokens for JWT rotation.
-- token_hash is SHA-256(raw_token) — raw token is never persisted.

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64)  NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS refresh_tokens_token_hash_uidx ON refresh_tokens(token_hash);
CREATE INDEX        IF NOT EXISTS refresh_tokens_user_id_idx     ON refresh_tokens(user_id);
