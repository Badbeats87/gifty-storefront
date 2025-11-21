-- Add CASCADE delete to foreign key constraints
-- This allows deleting businesses even if they have related orders/gift_cards

-- Drop existing constraints
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_business_id_fkey;

ALTER TABLE gift_cards
DROP CONSTRAINT IF EXISTS gift_cards_business_id_fkey;

-- Recreate with ON DELETE CASCADE
ALTER TABLE orders
ADD CONSTRAINT orders_business_id_fkey
FOREIGN KEY (business_id)
REFERENCES businesses(id)
ON DELETE CASCADE;

ALTER TABLE gift_cards
ADD CONSTRAINT gift_cards_business_id_fkey
FOREIGN KEY (business_id)
REFERENCES businesses(id)
ON DELETE CASCADE;
