
CREATE TABLE IF NOT EXISTS work_order_material_issue (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    material_type TEXT DEFAULT 'SHEET',
    quantity_planned DOUBLE PRECISION,
    quantity_issued DOUBLE PRECISION NOT NULL,
    quantity_consumed DOUBLE PRECISION DEFAULT 0,
    unit_cost DOUBLE PRECISION,
    total_cost DOUBLE PRECISION,
    status TEXT DEFAULT 'ISSUED',
    issued_by TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
