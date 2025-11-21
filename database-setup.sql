-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  payment_transaction_id VARCHAR(255),
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create or update gift_cards table if needed
ALTER TABLE IF EXISTS gift_cards
  ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_order_id ON gift_cards(order_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);

-- Enable RLS for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert/select from orders
CREATE POLICY "Service role can insert orders" ON orders
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can read orders" ON orders
  FOR SELECT
  USING (auth.role() = 'service_role');
