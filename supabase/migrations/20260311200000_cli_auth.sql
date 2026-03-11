-- CLI auth codes (replaces in-memory Map for device auth flow)
CREATE TABLE IF NOT EXISTS cli_auth_codes (
  code       TEXT PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE cli_auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on cli_auth_codes"
  ON cli_auth_codes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup expired codes
CREATE INDEX idx_cli_auth_codes_expires ON cli_auth_codes (expires_at);

-- CLI API tokens for authenticated CLI requests
CREATE TABLE IF NOT EXISTS cli_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ
);

ALTER TABLE cli_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CLI tokens"
  ON cli_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CLI tokens"
  ON cli_tokens FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on cli_tokens"
  ON cli_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_cli_tokens_user ON cli_tokens (user_id);
CREATE INDEX idx_cli_tokens_hash ON cli_tokens (token_hash);

-- Add content column to agent_files for storing actual file content
ALTER TABLE agent_files ADD COLUMN IF NOT EXISTS content TEXT;
