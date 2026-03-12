-- ============================================================
-- Publishing System Migration
-- Agents default to private; must meet requirements to publish
-- ============================================================

-- ============================================================
-- 1. Change default visibility to 'private'
-- ============================================================

ALTER TABLE public.agents
  ALTER COLUMN visibility SET DEFAULT 'private';

-- ============================================================
-- 2. Add publishing-related columns to agents
-- ============================================================

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS license TEXT
    CHECK (license IS NULL OR license IN ('MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Proprietary', 'Custom')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- ============================================================
-- 3. Agent resources table
-- ============================================================

CREATE TABLE public.agent_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('video', 'image', 'document')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT agent_resources_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_agent_resources_agent ON public.agent_resources(agent_id);

ALTER TABLE public.agent_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view agent resources" ON public.agent_resources
  FOR SELECT USING (true);

CREATE POLICY "Owner can manage agent resources" ON public.agent_resources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = agent_resources.agent_id
        AND agents.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Storage bucket for agent resources (videos, images)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-resources', 'agent-resources', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read agent-resources" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'agent-resources');

CREATE POLICY "Auth insert agent-resources" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agent-resources');

CREATE POLICY "Auth update agent-resources" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'agent-resources');

CREATE POLICY "Auth delete agent-resources" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'agent-resources');

-- ============================================================
-- 5. Backfill: set published_at for existing public agents
-- ============================================================

UPDATE public.agents
SET published_at = created_at
WHERE visibility = 'public' AND published_at IS NULL;
