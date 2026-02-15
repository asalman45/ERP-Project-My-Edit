-- Add customer and sales_order_ref columns to work_order table
-- Migration: Add customer and sales order reference support

ALTER TABLE work_order 
ADD COLUMN IF NOT EXISTS customer VARCHAR(255),
ADD COLUMN IF NOT EXISTS sales_order_ref VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN work_order.customer IS 'Customer name for the work order';
COMMENT ON COLUMN work_order.sales_order_ref IS 'Reference to the sales order that generated this work order';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_work_order_customer ON work_order(customer);
CREATE INDEX IF NOT EXISTS idx_work_order_sales_order_ref ON work_order(sales_order_ref);
