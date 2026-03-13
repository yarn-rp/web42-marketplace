-- ============================================================
-- Marketplace Access Requests
-- Stores user interest in Skills/Plugins before launch
-- ============================================================

CREATE TABLE public.marketplace_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  marketplace_type TEXT NOT NULL CHECK (marketplace_type IN ('skills', 'plugins')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT marketplace_access_requests_pkey PRIMARY KEY (id),
  CONSTRAINT marketplace_access_requests_user_type_unique UNIQUE (user_id, marketplace_type)
);

CREATE INDEX idx_marketplace_access_requests_type ON public.marketplace_access_requests(marketplace_type);
CREATE INDEX idx_marketplace_access_requests_created ON public.marketplace_access_requests(created_at DESC);

ALTER TABLE public.marketplace_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own access request" ON public.marketplace_access_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own access requests" ON public.marketplace_access_requests
  FOR SELECT USING (auth.uid() = user_id);
