-- Stripe Connect integration: seller accounts, orders, and refunds

-- 1. Add Stripe fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- 2. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  seller_amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_method TEXT NOT NULL DEFAULT 'stripe'
    CHECK (payment_method IN ('stripe', 'wallet')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  refund_eligible_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_agent_id ON orders(agent_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout ON orders(stripe_checkout_session_id);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  stripe_refund_id TEXT,
  amount_cents INTEGER NOT NULL,
  reason TEXT,
  refund_method TEXT NOT NULL DEFAULT 'stripe'
    CHECK (refund_method IN ('stripe', 'wallet')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);

-- 4. RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their agents"
  ON orders FOR SELECT
  USING (auth.uid() = seller_id);

-- Only the backend (service role) inserts/updates orders via webhooks
-- No direct insert/update from client

-- 5. RLS on refunds
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view refunds for their orders"
  ON refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = refunds.order_id
      AND orders.buyer_id = auth.uid()
    )
  );

-- 6. RLS for stripe fields on users (read own, no direct write from client)
CREATE POLICY "Users can view own stripe status"
  ON users FOR SELECT
  USING (auth.uid() = id);
