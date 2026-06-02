
-- Create sales_order_work_order join table with TEXT types to match schema
CREATE TABLE IF NOT EXISTS sales_order_work_order (
    sales_order_id TEXT NOT NULL,
    sales_order_item_id TEXT NOT NULL,
    work_order_id TEXT NOT NULL,
    quantity DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sales_order_id, sales_order_item_id, work_order_id)
    -- Foreign keys omitted for now because of potential type casting issues between TEXT and UUID in related tables
);

-- Create sales_order_status_history table
CREATE TABLE IF NOT EXISTS sales_order_status_history (
    history_id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sales_order_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    change_reason TEXT,
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
