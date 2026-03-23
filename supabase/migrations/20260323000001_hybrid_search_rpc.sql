-- Hybrid search RPC: blends keyword (BM25-style via ts_rank) and semantic
-- (cosine similarity via pgvector) scores to rank agents.
--
-- Score formula: 0.4 * keyword_score + 0.6 * semantic_score
--   keyword_score  = ts_rank on search_vector (full-text match quality)
--   semantic_score = 1 - (embedding <=> query_embedding) (cosine similarity)
--
-- Returns the same column shape as the standard agents SELECT in the API.
-- Agents without an embedding are excluded from results when semantic search
-- is in use (embedding IS NOT NULL guard).
CREATE OR REPLACE FUNCTION public.search_agents_hybrid(
  query_text    text,
  query_embedding vector(1536),
  match_count   int DEFAULT 20
)
RETURNS TABLE (
  id                  uuid,
  slug                text,
  agent_card          jsonb,
  readme              text,
  profile_image_url   text,
  a2a_url             text,
  owner_id            uuid,
  stars_count         integer,
  interactions_count  integer,
  approved            boolean,
  featured            boolean,
  published_at        timestamptz,
  created_at          timestamptz,
  updated_at          timestamptz,
  gateway_status      text,
  embedding           vector(1536)
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    a.id,
    a.slug,
    a.agent_card,
    a.readme,
    a.profile_image_url,
    a.a2a_url,
    a.owner_id,
    a.stars_count,
    a.interactions_count,
    a.approved,
    a.featured,
    a.published_at,
    a.created_at,
    a.updated_at,
    a.gateway_status,
    a.embedding,
    (
      0.4 * ts_rank(a.search_vector, websearch_to_tsquery('english', query_text))
      + 0.6 * (1.0 - (a.embedding <=> query_embedding))
    ) AS hybrid_score
  FROM public.agents a
  WHERE
    a.embedding IS NOT NULL
    AND a.published_at IS NOT NULL
    AND a.agent_card->'capabilities'->'extensions' @> '[{"uri":"https://web42.ai/ext/marketplace/v1","params":{"visibility":"public"}}]'::jsonb
  ORDER BY hybrid_score DESC
  LIMIT match_count;
$$;
