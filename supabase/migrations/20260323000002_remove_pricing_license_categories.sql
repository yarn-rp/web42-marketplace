-- ⚠️ REQUIRES RICHARD SIGN-OFF BEFORE RUNNING ON PROD
--
-- Intent: Remove pricing, license, and categories from the marketplace.
-- Agents are no longer hosted products with prices or licenses.
-- Categories are replaced by tags for discoverability.
-- Drops agent_categories and categories tables entirely.
-- Removes price_cents_at_acquisition from agent_access since all access is now free.

-- Drop the join table first (FK dependency on categories)
DROP TABLE IF EXISTS agent_categories CASCADE;

-- Drop the categories table
DROP TABLE IF EXISTS categories CASCADE;

-- Remove price_cents_at_acquisition from agent_access
-- (all acquisitions are free; the column is meaningless)
ALTER TABLE agent_access
  DROP COLUMN IF EXISTS price_cents_at_acquisition;
