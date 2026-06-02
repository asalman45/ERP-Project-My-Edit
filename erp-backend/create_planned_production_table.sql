CREATE TABLE IF NOT EXISTS planned_production (
  planned_production_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_number VARCHAR(100) NOT NULL UNIQUE,
  product_id VARCHAR(100) NOT NULL REFERENCES product(product_id),
  quantity_planned NUMERIC(15,2) NOT NULL,
  uom_id VARCHAR(100) REFERENCES uom(uom_id),
  forecast_method VARCHAR(50) DEFAULT 'MANUAL',
  start_date DATE NOT NULL,
  end_date DATE,
  delivery_date DATE,
  status VARCHAR(50) DEFAULT 'PLANNED',
  priority INTEGER DEFAULT 1,
  created_by VARCHAR(100) DEFAULT 'system',
  forecast_data JSONB,
  material_requirements JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
