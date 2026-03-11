-- ============================================================
-- Profile Enhancements: visibility, pricing, profile README
-- ============================================================

-- ============================================================
-- 1. Add profile_readme to users
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_readme TEXT;

-- ============================================================
-- 2. Add visibility, price_cents, currency to agents
-- ============================================================

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private', 'unlisted')),
  ADD COLUMN IF NOT EXISTS price_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd';

CREATE INDEX IF NOT EXISTS idx_agents_visibility ON public.agents(visibility);

-- ============================================================
-- 3. Update RLS on agents for visibility-aware access
-- ============================================================

DROP POLICY IF EXISTS "Public can view agents" ON public.agents;

CREATE POLICY "Public can view public agents" ON public.agents
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Owner can view own agents" ON public.agents
  FOR SELECT USING (auth.uid() = owner_id);
