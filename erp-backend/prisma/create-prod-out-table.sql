
CREATE TABLE IF NOT EXISTS production_output (
    output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_type TEXT,
    item_name TEXT,
    quantity_planned DOUBLE PRECISION,
    quantity_good DOUBLE PRECISION,
    quantity_rejected DOUBLE PRECISION DEFAULT 0,
    quantity_rework DOUBLE PRECISION DEFAULT 0,
    rejection_reason TEXT,
    recorded_by TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
