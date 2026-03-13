-- ============================================================
-- Full-text search vector for agents
-- Weighted: A=name, B=description+skills, C=readme
-- ============================================================

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Build the composite tsvector from agent fields + manifest skills
CREATE OR REPLACE FUNCTION public.agents_search_vector_update()
RETURNS trigger AS $$
DECLARE
  skills_text TEXT := '';
  skill RECORD;
BEGIN
  IF NEW.manifest IS NOT NULL AND NEW.manifest->'skills' IS NOT NULL THEN
    FOR skill IN
      SELECT
        COALESCE(elem->>'name', '') AS sname,
        COALESCE(elem->>'description', '') AS sdesc
      FROM jsonb_array_elements(NEW.manifest->'skills') AS elem
    LOOP
      skills_text := skills_text || ' ' || skill.sname || ' ' || skill.sdesc;
    END LOOP;
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '') || ' ' || skills_text), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.readme, '')), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP TRIGGER IF EXISTS agents_search_vector_trigger ON public.agents;

CREATE TRIGGER agents_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.agents_search_vector_update();

-- Backfill existing rows
UPDATE public.agents SET updated_at = updated_at;

-- GIN index for fast full-text lookups
CREATE INDEX IF NOT EXISTS idx_agents_search_vector
  ON public.agents USING GIN (search_vector);
