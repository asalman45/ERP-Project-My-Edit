-- Migration: Add linked_po_id column to sales_order table
-- This allows linking sales orders to pre-existing purchase orders

ALTER TABLE sales_order 
  ADD COLUMN IF NOT EXISTS linked_po_id TEXT;
  
-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_sales_order_purchase_order'
  ) THEN
    ALTER TABLE sales_order 
      ADD CONSTRAINT fk_sales_order_purchase_order 
      FOREIGN KEY (linked_po_id) 
      REFERENCES purchase_order(po_id) 
      ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN sales_order.linked_po_id IS 'Links to a pre-existing purchase order for fast production workflow';

