-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to agents table for semantic search
-- Uses 1536 dimensions to match OpenAI text-embedding-3-small output
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index for fast approximate nearest-neighbor search
-- Uses cosine distance which is appropriate for normalized text embeddings
CREATE INDEX IF NOT EXISTS agents_embedding_idx
  ON public.agents
  USING hnsw (embedding vector_cosine_ops);
