-- Migration: Add Inventory Allocation Fields to Sales Order Item
-- These fields track how much inventory is allocated from stock vs needs production

-- Add allocation tracking fields
ALTER TABLE "public"."sales_order_item" 
ADD COLUMN IF NOT EXISTS "qty_allocated_from_stock" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "qty_to_produce" DOUBLE PRECISION DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN "public"."sales_order_item"."qty_allocated_from_stock" IS 'Quantity allocated from finished goods inventory (pre-made stock)';
COMMENT ON COLUMN "public"."sales_order_item"."qty_to_produce" IS 'Quantity that needs to be produced (shortage after allocation)';

-- Note: Existing records will have DEFAULT 0. 
-- The application logic will set qty_to_produce = qty_ordered when Sales Orders are approved.

