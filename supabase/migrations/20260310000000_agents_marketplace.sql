-- ============================================================
-- Web42 Agent Marketplace Schema Migration
-- Transforms product directory into agent marketplace
-- ============================================================

-- ============================================================
-- 1. Evolve users -> profiles
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS github_handle TEXT;

ALTER TABLE public.users DROP COLUMN IF EXISTS billing_address;
ALTER TABLE public.users DROP COLUMN IF EXISTS payment_method;

DROP POLICY IF EXISTS "Can view own user data" ON public.users;
DROP POLICY IF EXISTS "Can update own user data" ON public.users;

CREATE POLICY "Public can view profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, username, github_handle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'user_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 3. Agents table
-- ============================================================

CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  readme TEXT DEFAULT '',
  cover_image_url TEXT,
  demo_video_url TEXT,
  manifest JSONB DEFAULT '{}',
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  remixed_from_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  stars_count INTEGER NOT NULL DEFAULT 0,
  remixes_count INTEGER NOT NULL DEFAULT 0,
  installs_count INTEGER NOT NULL DEFAULT 0,
  approved BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_owner_slug_unique UNIQUE (owner_id, slug)
);

CREATE INDEX idx_agents_owner ON public.agents(owner_id);
CREATE INDEX idx_agents_stars ON public.agents(stars_count DESC);
CREATE INDEX idx_agents_installs ON public.agents(installs_count DESC);
CREATE INDEX idx_agents_created ON public.agents(created_at DESC);
CREATE INDEX idx_agents_featured ON public.agents(featured) WHERE featured = true;

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view agents" ON public.agents
  FOR SELECT USING (true);

CREATE POLICY "Owner can insert agents" ON public.agents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update agents" ON public.agents
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete agents" ON public.agents
  FOR DELETE USING (auth.uid() = owner_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 4. Agent versions
-- ============================================================

CREATE TABLE public.agent_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT agent_versions_pkey PRIMARY KEY (id),
  CONSTRAINT agent_versions_agent_version_unique UNIQUE (agent_id, version)
);

CREATE INDEX idx_agent_versions_agent ON public.agent_versions(agent_id);

ALTER TABLE public.agent_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view agent versions" ON public.agent_versions
  FOR SELECT USING (true);

CREATE POLICY "Owner can manage agent versions" ON public.agent_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agents WHERE agents.id = agent_versions.agent_id AND agents.owner_id = auth.uid())
  );

-- ============================================================
-- 5. Agent files
-- ============================================================

CREATE TABLE public.agent_files (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.agent_versions(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT agent_files_pkey PRIMARY KEY (id)
);

CREATE INDEX idx_agent_files_agent ON public.agent_files(agent_id);
CREATE INDEX idx_agent_files_version ON public.agent_files(version_id);

ALTER TABLE public.agent_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view agent files" ON public.agent_files
  FOR SELECT USING (true);

CREATE POLICY "Owner can manage agent files" ON public.agent_files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agents WHERE agents.id = agent_files.agent_id AND agents.owner_id = auth.uid())
  );

-- ============================================================
-- 6. Stars
-- ============================================================

CREATE TABLE public.stars (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT stars_pkey PRIMARY KEY (user_id, agent_id)
);

CREATE INDEX idx_stars_agent ON public.stars(agent_id);

ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view stars" ON public.stars
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can star" ON public.stars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Can remove own star" ON public.stars
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers to keep stars_count in sync
CREATE OR REPLACE FUNCTION public.increment_stars_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.agents SET stars_count = stars_count + 1 WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_stars_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.agents SET stars_count = GREATEST(stars_count - 1, 0) WHERE id = OLD.agent_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_star_insert
  AFTER INSERT ON public.stars
  FOR EACH ROW EXECUTE FUNCTION public.increment_stars_count();

CREATE TRIGGER on_star_delete
  AFTER DELETE ON public.stars
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stars_count();

-- ============================================================
-- 7. Junction tables for categories and tags
-- ============================================================

CREATE TABLE public.agent_categories (
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  CONSTRAINT agent_categories_pkey PRIMARY KEY (agent_id, category_id)
);

ALTER TABLE public.agent_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view agent categories" ON public.agent_categories
  FOR SELECT USING (true);

CREATE POLICY "Owner can manage agent categories" ON public.agent_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agents WHERE agents.id = agent_categories.agent_id AND agents.owner_id = auth.uid())
  );

CREATE TABLE public.agent_tags (
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  CONSTRAINT agent_tags_pkey PRIMARY KEY (agent_id, tag_id)
);

ALTER TABLE public.agent_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view agent tags" ON public.agent_tags
  FOR SELECT USING (true);

CREATE POLICY "Owner can manage agent tags" ON public.agent_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.agents WHERE agents.id = agent_tags.agent_id AND agents.owner_id = auth.uid())
  );

-- ============================================================
-- 8. Helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_install_count(p_agent_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agents SET installs_count = installs_count + 1 WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_remix_count(p_agent_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.agents SET remixes_count = remixes_count + 1 WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. Storage buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('agent-covers', 'agent-covers', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('agent-files', 'agent-files', false)
  ON CONFLICT (id) DO NOTHING;

-- Agent covers: public read, authenticated write
CREATE POLICY "Public read agent-covers" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'agent-covers');

CREATE POLICY "Auth insert agent-covers" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agent-covers');

CREATE POLICY "Auth update agent-covers" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'agent-covers');

CREATE POLICY "Auth delete agent-covers" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'agent-covers');

-- Agent files: authenticated read/write
CREATE POLICY "Auth read agent-files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'agent-files');

CREATE POLICY "Auth insert agent-files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'agent-files');

CREATE POLICY "Auth update agent-files" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'agent-files');

CREATE POLICY "Auth delete agent-files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'agent-files');

-- ============================================================
-- 10. Seed default categories
-- ============================================================

INSERT INTO public.categories (name, icon) VALUES
  ('Customer Support', 'headphones'),
  ('Healthcare', 'heart-pulse'),
  ('Developer Tools', 'code'),
  ('Personal Assistant', 'user'),
  ('Sales', 'trending-up'),
  ('Marketing', 'megaphone'),
  ('Education', 'graduation-cap'),
  ('Finance', 'dollar-sign'),
  ('Content Creation', 'pen-tool'),
  ('Productivity', 'zap')
ON CONFLICT (name) DO NOTHING;
