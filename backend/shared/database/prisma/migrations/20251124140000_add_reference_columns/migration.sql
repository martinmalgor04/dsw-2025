-- Add reference columns for shipments if they don't exist yet
ALTER TABLE "shipments"
  ADD COLUMN IF NOT EXISTS "order_reference" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "user_reference" VARCHAR(100);

-- Ensure shipment products can store external references
ALTER TABLE "shipping_products"
  ADD COLUMN IF NOT EXISTS "product_reference" VARCHAR(100);

