-- Backfill all existing agents to have platform = "openclaw" in their manifest
UPDATE agents
SET manifest = jsonb_set(
  COALESCE(manifest, '{}'::jsonb),
  '{platform}',
  '"openclaw"'
)
WHERE manifest IS NULL
   OR manifest ->> 'platform' IS NULL
   OR manifest ->> 'platform' = '';
