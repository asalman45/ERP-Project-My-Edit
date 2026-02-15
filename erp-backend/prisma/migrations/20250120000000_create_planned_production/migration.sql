-- Migration: Create Planned Production Table
-- Allows production to be scheduled/produced before Sales Orders arrive

CREATE TABLE IF NOT EXISTS planned_production (
  planned_production_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number TEXT UNIQUE NOT NULL,
  product_id TEXT NOT NULL,
  quantity_planned FLOAT NOT NULL,
  uom_id TEXT,
  forecast_method TEXT DEFAULT 'MANUAL', -- MANUAL, MRP_BASED, HISTORICAL
  start_date DATE NOT NULL,
  end_date DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
  priority INTEGER DEFAULT 1,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  forecast_data JSONB,
  material_requirements JSONB,
  
  FOREIGN KEY (product_id) REFERENCES product(product_id),
  FOREIGN KEY (uom_id) REFERENCES uom(uom_id)
);

CREATE INDEX IF NOT EXISTS idx_planned_production_product ON planned_production(product_id);
CREATE INDEX IF NOT EXISTS idx_planned_production_status ON planned_production(status);
CREATE INDEX IF NOT EXISTS idx_planned_production_start_date ON planned_production(start_date);

CREATE OR REPLACE FUNCTION generate_plan_number() RETURNS TEXT AS $$
DECLARE
  date_str TEXT;
  seq_num INTEGER;
BEGIN
  date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(plan_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM planned_production
  WHERE plan_number LIKE 'PP-' || date_str || '-%';
  
  RETURN 'PP-' || date_str || '-' || LPAD(seq_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;


