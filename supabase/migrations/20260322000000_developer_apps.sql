CREATE TABLE developer_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  client_secret_hash TEXT NOT NULL,
  secret_prefix TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_dev_apps_owner ON developer_apps(owner_id);
CREATE INDEX idx_dev_apps_client_id ON developer_apps(client_id);

ALTER TABLE developer_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own apps"
  ON developer_apps FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own apps"
  ON developer_apps FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own apps"
  ON developer_apps FOR UPDATE
  USING (auth.uid() = owner_id);
