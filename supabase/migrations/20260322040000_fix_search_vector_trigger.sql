-- Fix search_vector trigger: the old trigger calls agents_search_vector_update()
-- which references dropped columns (name, manifest). Replace it with the new
-- function that reads from agent_card JSONB.

-- Drop the old trigger
DROP TRIGGER IF EXISTS agents_search_vector_trigger ON public.agents;

-- Drop the old function (references NEW.name, NEW.manifest — both dropped)
DROP FUNCTION IF EXISTS public.agents_search_vector_update();

-- The replacement function update_agent_search_vector() was created in
-- 20260322010000_agent_card_model.sql. Wire the trigger to it.
CREATE TRIGGER agents_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_search_vector();
