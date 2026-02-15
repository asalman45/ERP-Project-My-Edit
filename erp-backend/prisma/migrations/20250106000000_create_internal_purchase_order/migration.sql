-- Create IPO Status Enum
DO $$ BEGIN
    CREATE TYPE IPOStatus AS ENUM ('PENDING', 'APPROVED', 'SENT', 'RECEIVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Internal Purchase Order Table
CREATE TABLE IF NOT EXISTS internal_purchase_order (
    ipo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id TEXT REFERENCES supplier(supplier_id),
    supplier_name VARCHAR(255),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    supplier_address TEXT,
    supplier_email VARCHAR(255),
    supplier_ntn VARCHAR(50),
    supplier_strn VARCHAR(50),
    order_date DATE NOT NULL,
    expected_date DATE,
    status IPOStatus DEFAULT 'PENDING',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Internal Purchase Order Item Table
CREATE TABLE IF NOT EXISTS internal_purchase_order_item (
    ipo_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ipo_id UUID NOT NULL REFERENCES internal_purchase_order(ipo_id) ON DELETE CASCADE,
    material_id TEXT REFERENCES material(material_id),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity NUMERIC(18, 4) NOT NULL,
    unit_price NUMERIC(18, 4) NOT NULL,
    total_amount NUMERIC(18, 4) NOT NULL,
    uom_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ipo_supplier ON internal_purchase_order(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ipo_status ON internal_purchase_order(status);
CREATE INDEX IF NOT EXISTS idx_ipo_date ON internal_purchase_order(order_date);
CREATE INDEX IF NOT EXISTS idx_ipo_item_ipo ON internal_purchase_order_item(ipo_id);
CREATE INDEX IF NOT EXISTS idx_ipo_item_material ON internal_purchase_order_item(material_id);

-- Add comments for documentation
COMMENT ON TABLE internal_purchase_order IS 'Internal Purchase Orders for internal material transfers';
COMMENT ON TABLE internal_purchase_order_item IS 'Items within Internal Purchase Orders';
COMMENT ON COLUMN internal_purchase_order.status IS 'IPO Status: PENDING, APPROVED, SENT, RECEIVED, CANCELLED';
COMMENT ON COLUMN internal_purchase_order.po_number IS 'Unique Purchase Order Number';
COMMENT ON COLUMN internal_purchase_order_item.total_amount IS 'Calculated as quantity * unit_price';

