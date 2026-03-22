-- Add agent_card JSONB and interactions_count columns
ALTER TABLE agents ADD COLUMN IF NOT EXISTS agent_card JSONB DEFAULT '{}';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS interactions_count INTEGER NOT NULL DEFAULT 0;

-- Migrate existing data into agent_card JSONB
UPDATE agents SET agent_card = jsonb_build_object(
  'name', name,
  'description', description,
  'version', COALESCE(manifest->>'version', '0.0.0'),
  'url', COALESCE(a2a_url, ''),
  'capabilities', jsonb_build_object(
    'extensions', jsonb_build_array(
      jsonb_build_object(
        'uri', 'https://web42.ai/ext/marketplace/v1',
        'params', jsonb_build_object(
          'price_cents', price_cents,
          'currency', currency,
          'license', license,
          'visibility', visibility
        )
      )
    )
  ),
  'skills', COALESCE(manifest->'skills', '[]'::jsonb)
);

-- Drop dependent policies and indexes before dropping columns
DROP POLICY IF EXISTS "Public can view public agents" ON public.agents;
DROP POLICY IF EXISTS "Public can view agents" ON public.agents;
DROP INDEX IF EXISTS idx_agents_visibility;
DROP INDEX IF EXISTS idx_agents_installs;

-- Drop the increment function that references installs_count
DROP FUNCTION IF EXISTS increment_install_count(UUID);

-- Recreate public-read policy using agent_card JSONB instead of visibility column
CREATE POLICY "Public can view public agents" ON public.agents
  FOR SELECT USING (
    published_at IS NOT NULL
    AND agent_card->'capabilities'->'extensions' @> '[{"uri":"https://web42.ai/ext/marketplace/v1","params":{"visibility":"public"}}]'::jsonb
  );

-- Drop columns migrated into agent_card
ALTER TABLE agents DROP COLUMN IF EXISTS name;
ALTER TABLE agents DROP COLUMN IF EXISTS description;
ALTER TABLE agents DROP COLUMN IF EXISTS manifest;
ALTER TABLE agents DROP COLUMN IF EXISTS cover_image_url;
ALTER TABLE agents DROP COLUMN IF EXISTS demo_video_url;
ALTER TABLE agents DROP COLUMN IF EXISTS license;
ALTER TABLE agents DROP COLUMN IF EXISTS visibility;
ALTER TABLE agents DROP COLUMN IF EXISTS price_cents;
ALTER TABLE agents DROP COLUMN IF EXISTS currency;
ALTER TABLE agents DROP COLUMN IF EXISTS installs_count;
ALTER TABLE agents DROP COLUMN IF EXISTS remixes_count;
ALTER TABLE agents DROP COLUMN IF EXISTS remixed_from_id;

-- Update search_vector trigger to use JSONB fields
CREATE OR REPLACE FUNCTION update_agent_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.agent_card->>'name', '') || ' ' ||
    COALESCE(NEW.agent_card->>'description', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
