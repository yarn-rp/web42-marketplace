-- ============================================================
-- Agent Access / Entitlement table
-- Users must "acquire" an agent before they can install,
-- remix, or download its file contents.
-- ============================================================

CREATE TABLE public.agent_access (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  price_cents_at_acquisition INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT agent_access_pkey PRIMARY KEY (user_id, agent_id)
);

CREATE INDEX idx_agent_access_agent ON public.agent_access(agent_id);

ALTER TABLE public.agent_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access" ON public.agent_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated can acquire access" ON public.agent_access
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can revoke own access" ON public.agent_access
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RPC: centralised access check (owner bypass + entitlement)
-- ============================================================

CREATE OR REPLACE FUNCTION public.has_agent_access(p_user_id UUID, p_agent_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.agents WHERE id = p_agent_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.agent_access WHERE user_id = p_user_id AND agent_id = p_agent_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
