-- ============================================================
-- EMPCL ERP — GIL & HINOPAK Manufacturing Parts
-- Full Implementation Migration Script
-- Run against: empcl-local-postgres (erp_db)
-- ============================================================

-- ============================================================
-- PHASE 2: SCHEMA ENHANCEMENTS
-- ============================================================

-- 1. Add BOM versioning date columns
ALTER TABLE bom 
  ADD COLUMN IF NOT EXISTS effective_from DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS effective_to DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS change_reason TEXT DEFAULT NULL;

-- 2. Add routing detail columns
ALTER TABLE routing 
  ADD COLUMN IF NOT EXISTS setup_time_minutes NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cycle_time_minutes NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS standard_man_hours NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_check_point BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS machine_code VARCHAR(50) DEFAULT NULL;

-- 3. Add batch traceability fields
ALTER TABLE batch
  ADD COLUMN IF NOT EXISTS heat_number VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coil_number VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sheet_lot VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mill_certificate_no VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS production_batch VARCHAR(100) DEFAULT NULL;

-- 4. Link batch to production consumption
ALTER TABLE production_material_consumption
  ADD COLUMN IF NOT EXISTS batch_id TEXT DEFAULT NULL;

-- 5. Create Engineering Change Notice table
CREATE TABLE IF NOT EXISTS engineering_change (
  ecn_id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  ecn_number      VARCHAR(50) UNIQUE NOT NULL,
  product_id      TEXT REFERENCES product(product_id) ON DELETE CASCADE,
  change_type     VARCHAR(50) NOT NULL DEFAULT 'BOM_CHANGE',
  description     TEXT NOT NULL,
  requested_by    VARCHAR(100),
  approved_by     VARCHAR(100),
  status          VARCHAR(30) DEFAULT 'DRAFT',
  effective_date  DATE,
  old_bom_version INTEGER,
  new_bom_version INTEGER,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add LTR and ROLL UOM if not exists
INSERT INTO uom (uom_id, code, name) VALUES
  (gen_random_uuid()::text, 'LTR', 'Liters'),
  (gen_random_uuid()::text, 'ROLL', 'Roll')
ON CONFLICT (code) DO NOTHING;

-- 7. Ensure work_center table has required work centers
INSERT INTO work_center (work_center_id, code, name, description)
VALUES
  (gen_random_uuid()::text, 'CUTTING',  'Sheet Cutting',     'CNC/Plasma/Laser cutting operations'),
  (gen_random_uuid()::text, 'PRESS',    'Press & Forming',   'Press braking, roll forming, stamping'),
  (gen_random_uuid()::text, 'WELDING',  'Welding',           'MIG/TIG/Arc welding operations'),
  (gen_random_uuid()::text, 'GRINDING', 'Grinding & Finish', 'Weld dressing, deburring, grinding'),
  (gen_random_uuid()::text, 'PAINTING', 'Painting & Coating','Shot blast, Red-oxide, black paint'),
  (gen_random_uuid()::text, 'QC',       'Quality Control',   'Inspection, testing, leak test'),
  (gen_random_uuid()::text, 'PACKING',  'Packing',           'Assembly, packing, labeling')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- PHASE 1: MASTER DATA SEEDING (PL/pgSQL Block)
-- ============================================================

DO $$
DECLARE
  v_kg_uom    TEXT;
  v_pcs_uom   TEXT;
  v_ltr_uom   TEXT;
  v_roll_uom  TEXT;

  v_gil_oem      TEXT;
  v_hinopak_oem  TEXT;

  v_fxz_model   TEXT;
  v_nlr_model   TEXT;
  v_nmr_model   TEXT;
  v_fvr_model   TEXT;
  v_fg8j_model  TEXT;

  v_hrc30_mat   TEXT;
  v_hrc40_mat   TEXT;
  v_hrc45_mat   TEXT;
  v_crc12_mat   TEXT;
  v_crc20_mat   TEXT;

  v_shaft25_mat TEXT;
  v_shaft28_mat TEXT;
  v_shaft32_mat TEXT;
  v_shaft36_mat TEXT;

  v_wire12_mat    TEXT;
  v_redoxide_mat  TEXT;
  v_paintblk_mat  TEXT;
  v_petrol_mat    TEXT;
  v_cap14_mat     TEXT;
  v_cap38_mat     TEXT;
  v_cap12_mat     TEXT;
  v_cap34_mat     TEXT;
  v_poly_mat      TEXT;
  v_carton_mat    TEXT;
  v_nut_m8_mat    TEXT;
  v_bolt_m8_mat   TEXT;
  v_bolt_m10_mat  TEXT;
  v_cabletie_mat  TEXT;

  v_prod1_id  TEXT;
  v_prod2_id  TEXT;
  v_prod3_id  TEXT;
  v_prod4_id  TEXT;
  v_prod5_id  TEXT;
  v_prod6_id  TEXT;

BEGIN

  -- ============================================================
  -- FETCH REFERENCE IDs
  -- ============================================================
  SELECT uom_id INTO v_kg_uom FROM uom WHERE code = 'KG' LIMIT 1;
  SELECT uom_id INTO v_pcs_uom FROM uom WHERE code = 'PCS' LIMIT 1;
  SELECT uom_id INTO v_ltr_uom FROM uom WHERE code = 'LTR' LIMIT 1;
  SELECT uom_id INTO v_roll_uom FROM uom WHERE code = 'ROLL' LIMIT 1;

  SELECT oem_id INTO v_gil_oem FROM oem WHERE oem_name ILIKE '%Ghandhara Industries%' LIMIT 1;
  SELECT oem_id INTO v_hinopak_oem FROM oem WHERE oem_name ILIKE '%Hinopak%' LIMIT 1;

  SELECT model_id INTO v_fxz_model FROM model WHERE model_name ILIKE '%FXZ%' LIMIT 1;
  SELECT model_id INTO v_nlr_model FROM model WHERE model_name ILIKE '%NLR%' LIMIT 1;
  SELECT model_id INTO v_nmr_model FROM model WHERE model_name ILIKE '%NMR%' LIMIT 1;
  SELECT model_id INTO v_fvr_model FROM model WHERE model_name ILIKE '%FVR%' LIMIT 1;
  SELECT model_id INTO v_fg8j_model FROM model WHERE model_name ILIKE '%FG8J%' LIMIT 1;

  RAISE NOTICE 'OEM IDs: GIL=%, HINOPAK=%', v_gil_oem, v_hinopak_oem;
  RAISE NOTICE 'Model IDs: FXZ=%, NLR=%, NMR=%, FVR=%, FG8J=%', v_fxz_model, v_nlr_model, v_nmr_model, v_fvr_model, v_fg8j_model;

  -- ============================================================
  -- RAW MATERIALS — SHEET METAL
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHEET-HRC-3.0') THEN
    v_hrc30_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_hrc30_mat, 'SHEET-HRC-3.0', 'HRC Sheet 3.0mm', 'Hot Rolled Carbon Steel Sheet 3.0mm thick, 4x8 feet, 70.10 kg/sheet', 'RAW_MATERIAL', v_kg_uom, 'SHEET_METAL');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHEET-HRC-3.0', 'HRC Sheet 3.0mm', 'Hot Rolled Carbon Steel Sheet 3.0mm thick, 4x8 feet, 70.10 kg/sheet', v_kg_uom, 'SHEET_METAL', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_hrc30_mat FROM material WHERE material_code = 'SHEET-HRC-3.0';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHEET-HRC-4.0') THEN
    v_hrc40_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_hrc40_mat, 'SHEET-HRC-4.0', 'HRC Sheet 4.0mm', 'Hot Rolled Carbon Steel Sheet 4.0mm thick, 4x8 feet, 93.47 kg/sheet', 'RAW_MATERIAL', v_kg_uom, 'SHEET_METAL');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHEET-HRC-4.0', 'HRC Sheet 4.0mm', 'Hot Rolled Carbon Steel Sheet 4.0mm thick, 4x8 feet, 93.47 kg/sheet', v_kg_uom, 'SHEET_METAL', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_hrc40_mat FROM material WHERE material_code = 'SHEET-HRC-4.0';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHEET-HRC-4.5') THEN
    v_hrc45_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_hrc45_mat, 'SHEET-HRC-4.5', 'HRC Sheet 4.5mm', 'Hot Rolled Carbon Steel Sheet 4.5mm thick, 4x8 feet, 105.16 kg/sheet', 'RAW_MATERIAL', v_kg_uom, 'SHEET_METAL');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHEET-HRC-4.5', 'HRC Sheet 4.5mm', 'Hot Rolled Carbon Steel Sheet 4.5mm thick, 4x8 feet, 105.16 kg/sheet', v_kg_uom, 'SHEET_METAL', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_hrc45_mat FROM material WHERE material_code = 'SHEET-HRC-4.5';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHEET-CRC-1.2') THEN
    v_crc12_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_crc12_mat, 'SHEET-CRC-1.2', 'CRC Sheet 1.2mm', 'Cold Rolled Carbon Steel Sheet 1.2mm thick, 4x8 feet, 28.04 kg/sheet', 'RAW_MATERIAL', v_kg_uom, 'SHEET_METAL');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHEET-CRC-1.2', 'CRC Sheet 1.2mm', 'Cold Rolled Carbon Steel Sheet 1.2mm thick, 4x8 feet, 28.04 kg/sheet', v_kg_uom, 'SHEET_METAL', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_crc12_mat FROM material WHERE material_code = 'SHEET-CRC-1.2';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHEET-CRC-2.0') THEN
    v_crc20_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_crc20_mat, 'SHEET-CRC-2.0', 'CRC Sheet 2.0mm', 'Cold Rolled Carbon Steel Sheet 2.0mm thick, 4x8 feet, 46.74 kg/sheet', 'RAW_MATERIAL', v_kg_uom, 'SHEET_METAL');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHEET-CRC-2.0', 'CRC Sheet 2.0mm', 'Cold Rolled Carbon Steel Sheet 2.0mm thick, 4x8 feet, 46.74 kg/sheet', v_kg_uom, 'SHEET_METAL', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_crc20_mat FROM material WHERE material_code = 'SHEET-CRC-2.0';
  END IF;

  -- ============================================================
  -- RAW MATERIALS — BAR/SHAFT STOCK
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHAFT-25') THEN
    v_shaft25_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_shaft25_mat, 'SHAFT-25', 'MS Round Bar Dia 25mm', 'Mild Steel Round Bar 25mm diameter, tracked by kg', 'RAW_MATERIAL', v_kg_uom, 'BAR_STOCK');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHAFT-25', 'MS Round Bar Dia 25mm', 'Mild Steel Round Bar 25mm diameter', v_kg_uom, 'BAR_STOCK', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_shaft25_mat FROM material WHERE material_code = 'SHAFT-25';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHAFT-28') THEN
    v_shaft28_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_shaft28_mat, 'SHAFT-28', 'MS Round Bar Dia 28mm', 'Mild Steel Round Bar 28mm diameter, tracked by kg', 'RAW_MATERIAL', v_kg_uom, 'BAR_STOCK');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHAFT-28', 'MS Round Bar Dia 28mm', 'Mild Steel Round Bar 28mm diameter', v_kg_uom, 'BAR_STOCK', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_shaft28_mat FROM material WHERE material_code = 'SHAFT-28';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHAFT-32') THEN
    v_shaft32_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_shaft32_mat, 'SHAFT-32', 'MS Round Bar Dia 32mm', 'Mild Steel Round Bar 32mm diameter, tracked by kg', 'RAW_MATERIAL', v_kg_uom, 'BAR_STOCK');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHAFT-32', 'MS Round Bar Dia 32mm', 'Mild Steel Round Bar 32mm diameter', v_kg_uom, 'BAR_STOCK', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_shaft32_mat FROM material WHERE material_code = 'SHAFT-32';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'SHAFT-36') THEN
    v_shaft36_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_shaft36_mat, 'SHAFT-36', 'MS Round Bar Dia 36mm', 'Mild Steel Round Bar 36mm diameter, tracked by kg', 'RAW_MATERIAL', v_kg_uom, 'BAR_STOCK');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'SHAFT-36', 'MS Round Bar Dia 36mm', 'Mild Steel Round Bar 36mm diameter', v_kg_uom, 'BAR_STOCK', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_shaft36_mat FROM material WHERE material_code = 'SHAFT-36';
  END IF;

  -- ============================================================
  -- RAW MATERIALS — CONSUMABLES & HARDWARE
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'WELD-WIRE-1.2') THEN
    v_wire12_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_wire12_mat, 'WELD-WIRE-1.2', 'Welding Wire Dia 1.2mm', 'MIG Welding Wire 1.2mm, tracked by kg', 'RAW_MATERIAL', v_kg_uom, 'CONSUMABLE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'WELD-WIRE-1.2', 'Welding Wire Dia 1.2mm', 'MIG Welding Wire 1.2mm dia', v_kg_uom, 'CONSUMABLE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_wire12_mat FROM material WHERE material_code = 'WELD-WIRE-1.2';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'REDOXIDE') THEN
    v_redoxide_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_redoxide_mat, 'REDOXIDE', 'Red Oxide Primer', 'Red Oxide Anti-rust Primer paint, tracked by kg', 'RAW_MATERIAL', v_kg_uom, 'CONSUMABLE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'REDOXIDE', 'Red Oxide Primer', 'Red Oxide Anti-rust Primer paint', v_kg_uom, 'CONSUMABLE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_redoxide_mat FROM material WHERE material_code = 'REDOXIDE';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'PAINT-BLACK') THEN
    v_paintblk_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_paintblk_mat, 'PAINT-BLACK', 'Black Paint', 'Black Enamel Paint for metal, tracked by kg', 'RAW_MATERIAL', v_kg_uom, 'CONSUMABLE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'PAINT-BLACK', 'Black Paint', 'Black Enamel Paint for metal finish', v_kg_uom, 'CONSUMABLE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_paintblk_mat FROM material WHERE material_code = 'PAINT-BLACK';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'PETROL') THEN
    v_petrol_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_petrol_mat, 'PETROL', 'Petrol (Degreaser)', 'Petrol for degreasing before painting, tracked by litres', 'RAW_MATERIAL', v_ltr_uom, 'CONSUMABLE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'PETROL', 'Petrol (Degreaser)', 'Petrol for degreasing metal surfaces', v_ltr_uom, 'CONSUMABLE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_petrol_mat FROM material WHERE material_code = 'PETROL';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'PLASTIC-CAP-14') THEN
    v_cap14_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_cap14_mat, 'PLASTIC-CAP-14', 'Plastic Cap 1/4 inch', 'Plastic port cap 1/4 inch BSP', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'PLASTIC-CAP-14', 'Plastic Cap 1/4 inch', 'Plastic port cap 1/4 BSP', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_cap14_mat FROM material WHERE material_code = 'PLASTIC-CAP-14';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'PLASTIC-CAP-38') THEN
    v_cap38_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_cap38_mat, 'PLASTIC-CAP-38', 'Plastic Cap 3/8 inch', 'Plastic port cap 3/8 inch BSP', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'PLASTIC-CAP-38', 'Plastic Cap 3/8 inch', 'Plastic port cap 3/8 BSP', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_cap38_mat FROM material WHERE material_code = 'PLASTIC-CAP-38';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'PLASTIC-CAP-12') THEN
    v_cap12_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_cap12_mat, 'PLASTIC-CAP-12', 'Plastic Cap 1/2 inch', 'Plastic port cap 1/2 inch BSP', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'PLASTIC-CAP-12', 'Plastic Cap 1/2 inch', 'Plastic port cap 1/2 BSP', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_cap12_mat FROM material WHERE material_code = 'PLASTIC-CAP-12';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'PLASTIC-CAP-34') THEN
    v_cap34_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_cap34_mat, 'PLASTIC-CAP-34', 'Plastic Cap 3/4 inch', 'Plastic port cap 3/4 inch BSP', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'PLASTIC-CAP-34', 'Plastic Cap 3/4 inch', 'Plastic port cap 3/4 BSP', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_cap34_mat FROM material WHERE material_code = 'PLASTIC-CAP-34';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'POLYTHENE') THEN
    v_poly_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_poly_mat, 'POLYTHENE', 'Polythene Packaging Sheet', 'Polythene sheet for wrapping finished goods', 'RAW_MATERIAL', v_pcs_uom, 'PACKAGING');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'POLYTHENE', 'Polythene Packaging Sheet', 'Polythene wrap for finished product', v_pcs_uom, 'PACKAGING', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_poly_mat FROM material WHERE material_code = 'POLYTHENE';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'CARTON-ROLL-24') THEN
    v_carton_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_carton_mat, 'CARTON-ROLL-24', 'Corrugated Carton Roll 24 inch', 'Corrugated carton roll 24 inch for packaging', 'RAW_MATERIAL', v_roll_uom, 'PACKAGING');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'CARTON-ROLL-24', 'Corrugated Carton Roll 24 inch', 'Corrugated carton roll 24 inch', v_roll_uom, 'PACKAGING', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_carton_mat FROM material WHERE material_code = 'CARTON-ROLL-24';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'NUT-M8-125') THEN
    v_nut_m8_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_nut_m8_mat, 'NUT-M8-125', 'Nut M8x1.25', 'M8x1.25 pitch hex nut', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'NUT-M8-125', 'Nut M8x1.25', 'M8 hex nut 1.25 pitch', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_nut_m8_mat FROM material WHERE material_code = 'NUT-M8-125';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'BOLT-M8-25') THEN
    v_bolt_m8_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_bolt_m8_mat, 'BOLT-M8-25', 'Bolt M8x25 L25', 'M8x25mm hex bolt L25', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'BOLT-M8-25', 'Bolt M8x25 L25', 'Hex bolt M8 L25mm', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_bolt_m8_mat FROM material WHERE material_code = 'BOLT-M8-25';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'BOLT-M10-30') THEN
    v_bolt_m10_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_bolt_m10_mat, 'BOLT-M10-30', 'Bolt M10x30 L35', 'M10x30mm hex bolt L35', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'BOLT-M10-30', 'Bolt M10x30 L35', 'Hex bolt M10 L35mm', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_bolt_m10_mat FROM material WHERE material_code = 'BOLT-M10-30';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM material WHERE material_code = 'CABLE-TIE-8') THEN
    v_cabletie_mat := gen_random_uuid()::text;
    INSERT INTO material (material_id, material_code, name, description, category, uom_id, sub_category)
    VALUES (v_cabletie_mat, 'CABLE-TIE-8', 'Cable Tie 8 inch', 'Nylon cable tie 8 inch', 'RAW_MATERIAL', v_pcs_uom, 'HARDWARE');
    INSERT INTO raw_material (raw_material_id, material_code, name, description, uom_id, sub_category, created_at, updated_at)
    VALUES (gen_random_uuid()::text, 'CABLE-TIE-8', 'Cable Tie 8 inch', 'Nylon cable tie 8 inch', v_pcs_uom, 'HARDWARE', NOW(), NOW());
  ELSE
    SELECT material_id INTO v_cabletie_mat FROM material WHERE material_code = 'CABLE-TIE-8';
  END IF;

  -- Ensure all material IDs are populated
  SELECT material_id INTO v_hrc30_mat FROM material WHERE material_code = 'SHEET-HRC-3.0';
  SELECT material_id INTO v_hrc40_mat FROM material WHERE material_code = 'SHEET-HRC-4.0';
  SELECT material_id INTO v_hrc45_mat FROM material WHERE material_code = 'SHEET-HRC-4.5';
  SELECT material_id INTO v_crc12_mat FROM material WHERE material_code = 'SHEET-CRC-1.2';
  SELECT material_id INTO v_crc20_mat FROM material WHERE material_code = 'SHEET-CRC-2.0';
  SELECT material_id INTO v_shaft25_mat FROM material WHERE material_code = 'SHAFT-25';
  SELECT material_id INTO v_shaft28_mat FROM material WHERE material_code = 'SHAFT-28';
  SELECT material_id INTO v_shaft32_mat FROM material WHERE material_code = 'SHAFT-32';
  SELECT material_id INTO v_shaft36_mat FROM material WHERE material_code = 'SHAFT-36';
  SELECT material_id INTO v_wire12_mat FROM material WHERE material_code = 'WELD-WIRE-1.2';
  SELECT material_id INTO v_redoxide_mat FROM material WHERE material_code = 'REDOXIDE';
  SELECT material_id INTO v_paintblk_mat FROM material WHERE material_code = 'PAINT-BLACK';
  SELECT material_id INTO v_petrol_mat FROM material WHERE material_code = 'PETROL';
  SELECT material_id INTO v_cap14_mat FROM material WHERE material_code = 'PLASTIC-CAP-14';
  SELECT material_id INTO v_cap38_mat FROM material WHERE material_code = 'PLASTIC-CAP-38';
  SELECT material_id INTO v_cap12_mat FROM material WHERE material_code = 'PLASTIC-CAP-12';
  SELECT material_id INTO v_cap34_mat FROM material WHERE material_code = 'PLASTIC-CAP-34';
  SELECT material_id INTO v_poly_mat FROM material WHERE material_code = 'POLYTHENE';
  SELECT material_id INTO v_carton_mat FROM material WHERE material_code = 'CARTON-ROLL-24';
  SELECT material_id INTO v_nut_m8_mat FROM material WHERE material_code = 'NUT-M8-125';
  SELECT material_id INTO v_bolt_m8_mat FROM material WHERE material_code = 'BOLT-M8-25';
  SELECT material_id INTO v_bolt_m10_mat FROM material WHERE material_code = 'BOLT-M10-30';
  SELECT material_id INTO v_cabletie_mat FROM material WHERE material_code = 'CABLE-TIE-8';

  RAISE NOTICE 'All 23 raw materials ready.';

  -- ============================================================
  -- FINISHED PRODUCTS
  -- ============================================================

  IF NOT EXISTS (SELECT 1 FROM product WHERE product_code = '88486-0580') THEN
    v_prod1_id := gen_random_uuid()::text;
    INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, category, standard_cost, created_at)
    VALUES (v_prod1_id, '88486-0580', 'Large Tank', v_gil_oem, v_fxz_model, v_pcs_uom, 'FINISHED_GOOD', 0, NOW());
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod1_id, v_fxz_model) ON CONFLICT DO NOTHING;
  ELSE
    SELECT product_id INTO v_prod1_id FROM product WHERE product_code = '88486-0580';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE product_code = '898486-3830') THEN
    v_prod2_id := gen_random_uuid()::text;
    INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, category, standard_cost, created_at)
    VALUES (v_prod2_id, '898486-3830', 'CM 1st Crossmember', v_gil_oem, v_nlr_model, v_pcs_uom, 'FINISHED_GOOD', 0, NOW());
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod2_id, v_nlr_model) ON CONFLICT DO NOTHING;
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod2_id, v_nmr_model) ON CONFLICT DO NOTHING;
  ELSE
    SELECT product_id INTO v_prod2_id FROM product WHERE product_code = '898486-3830';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE product_code = '898072-148M') THEN
    v_prod3_id := gen_random_uuid()::text;
    INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, category, standard_cost, created_at)
    VALUES (v_prod3_id, '898072-148M', 'Bracket Exhaust', v_gil_oem, v_nmr_model, v_pcs_uom, 'FINISHED_GOOD', 0, NOW());
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod3_id, v_nmr_model) ON CONFLICT DO NOTHING;
  ELSE
    SELECT product_id INTO v_prod3_id FROM product WHERE product_code = '898072-148M';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE product_code = '898323-4500') THEN
    v_prod4_id := gen_random_uuid()::text;
    INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, category, standard_cost, created_at)
    VALUES (v_prod4_id, '898323-4500', 'Bracket Fuel Filter', v_gil_oem, v_nmr_model, v_pcs_uom, 'FINISHED_GOOD', 0, NOW());
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod4_id, v_nmr_model) ON CONFLICT DO NOTHING;
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod4_id, v_nlr_model) ON CONFLICT DO NOTHING;
  ELSE
    SELECT product_id INTO v_prod4_id FROM product WHERE product_code = '898323-4500';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE product_code = '898184-7830') THEN
    v_prod5_id := gen_random_uuid()::text;
    INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, category, standard_cost, created_at)
    VALUES (v_prod5_id, '898184-7830', 'Large Tank FVR', v_gil_oem, v_fvr_model, v_pcs_uom, 'FINISHED_GOOD', 0, NOW());
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod5_id, v_fvr_model) ON CONFLICT DO NOTHING;
  ELSE
    SELECT product_id INTO v_prod5_id FROM product WHERE product_code = '898184-7830';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM product WHERE product_code = 'S4410-E0F70') THEN
    v_prod6_id := gen_random_uuid()::text;
    INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, category, standard_cost, created_at)
    VALUES (v_prod6_id, 'S4410-E0F70', 'Tank Assy Air 10-1305', v_hinopak_oem, v_fg8j_model, v_pcs_uom, 'FINISHED_GOOD', 0, NOW());
    INSERT INTO product_model (product_id, model_id) VALUES (v_prod6_id, v_fg8j_model) ON CONFLICT DO NOTHING;
  ELSE
    SELECT product_id INTO v_prod6_id FROM product WHERE product_code = 'S4410-E0F70';
  END IF;

  RAISE NOTICE 'All 6 products ready.';

  -- ============================================================
  -- BOM + BLANK_SPEC — PRODUCT 1: 88486-0580 Large Tank FXZ
  -- ============================================================
  DELETE FROM blank_spec WHERE product_id = v_prod1_id;
  DELETE FROM bom WHERE product_id = v_prod1_id;

  INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, uom_id, item_type, item_name, is_critical, scrap_allowance_pct, operation_code, bom_version, version, is_active, effective_from, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod1_id, v_hrc30_mat, 1,    'Shell HRC',   1,  false, v_kg_uom,  'CUT_PART',   'Shell HRC 700x903x3.0',        true,  36, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_hrc30_mat, 3,    'Dish HRC',    2,  false, v_kg_uom,  'CUT_PART',   'Dish HRC 358x358x3.0',          true,  23, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_shaft28_mat, 1.15,'Shafts',     3,  false, v_kg_uom,  'BOUGHT_OUT', 'MS Bar Dia28mm (14 pcs)',        true,   2, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_wire12_mat,  0.26,'Consumables',4,  false, v_kg_uom,  'CONSUMABLE', 'Welding Wire 1.2mm',             false,  5, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_redoxide_mat,0.15,'Consumables',5,  false, v_kg_uom,  'CONSUMABLE', 'Red Oxide Primer',               false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_paintblk_mat,0.20,'Consumables',6,  false, v_kg_uom,  'CONSUMABLE', 'Black Paint',                    false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_petrol_mat,  0.05,'Consumables',7,  false, v_ltr_uom, 'CONSUMABLE', 'Petrol Degreaser',               false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_cap14_mat,   3,   'Hardware',   8,  false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 1/4 inch',           false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_cap38_mat,   11,  'Hardware',   9,  false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 3/8 inch',           false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, v_poly_mat,    2,   'Packaging',  10, false, v_pcs_uom, 'BOUGHT_OUT', 'Polythene Sheet 20x30',          false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW());

  INSERT INTO blank_spec (blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity, blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg, total_blanks, consumption_pct, material_type, created_at, updated_at, created_by) VALUES
    (gen_random_uuid()::text, v_prod1_id, 'Shell HRC', 700, 903, 3.0, 1, 14.89, 3,  64, '4x8', 70.10, 44.66, 64, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod1_id, 'Dish HRC',  358, 358, 3.0, 3, 3.02, 18,  77, '4x8', 70.10, 54.33, 77, 'HRC', NOW(), NOW(), 'system');

  -- ============================================================
  -- BOM + BLANK_SPEC — PRODUCT 2: 898486-3830 CM 1st NLR/NMR
  -- ============================================================
  DELETE FROM blank_spec WHERE product_id = v_prod2_id;
  DELETE FROM bom WHERE product_id = v_prod2_id;

  INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, uom_id, item_type, item_name, is_critical, scrap_allowance_pct, operation_code, bom_version, version, is_active, effective_from, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod2_id, v_hrc40_mat,  1,    'Main',        1, false, v_kg_uom,  'CUT_PART',   'Main Body HRC 305x660x4.0',      true,  12, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, v_hrc30_mat,  2,    'Horn Bkt',    2, false, v_kg_uom,  'CUT_PART',   'Horn Bracket HRC 30x90x3.0',     false,  2, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, v_nut_m8_mat, 3,    'Hardware',    3, false, v_pcs_uom, 'BOUGHT_OUT', 'M8x1.25 Nuts',                   false,  1, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, v_shaft25_mat,1.48, 'Shafts',      4, false, v_kg_uom,  'BOUGHT_OUT', 'MS Bar Dia25mm (4 pcs)',          true,   2, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, v_paintblk_mat,0.10,'Consumables', 5, false, v_kg_uom,  'CONSUMABLE', 'Paint',                          false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, v_petrol_mat,  0.03,'Consumables', 6, false, v_ltr_uom, 'CONSUMABLE', 'Petrol Degreaser',               false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW());

  INSERT INTO blank_spec (blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity, blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg, total_blanks, consumption_pct, material_type, created_at, updated_at, created_by) VALUES
    (gen_random_uuid()::text, v_prod2_id, 'Main',     305, 660, 4.0, 1, 6.32,  13, 88, '4x8', 93.47, 82.17, 88, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod2_id, 'Horn Bkt',  30,  90, 3.0, 2, 0.06, 1080, 98, '4x8', 70.10, 68.67, 98, 'HRC', NOW(), NOW(), 'system');

  -- ============================================================
  -- BOM + BLANK_SPEC — PRODUCT 3: 898072-148M Brkt Exh NMR
  -- ============================================================
  DELETE FROM blank_spec WHERE product_id = v_prod3_id;
  DELETE FROM bom WHERE product_id = v_prod3_id;

  INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, uom_id, item_type, item_name, is_critical, scrap_allowance_pct, operation_code, bom_version, version, is_active, effective_from, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod3_id, v_hrc45_mat,   2, 'L x2',      1, false, v_kg_uom,  'CUT_PART',   'L-Bracket HRC 70x154x4.5 (x2)', true,  3, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, v_hrc45_mat,   1, 'U x1',      2, false, v_kg_uom,  'CUT_PART',   'U-Bracket HRC 70x227x4.5 (x1)', true,  4, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, v_bolt_m8_mat, 2, 'Hardware',  3, false, v_pcs_uom, 'BOUGHT_OUT', 'Bolt M8x25 L25',               false,  1, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, v_bolt_m10_mat,3, 'Hardware',  4, false, v_pcs_uom, 'BOUGHT_OUT', 'Bolt M10x30 L35',              false,  1, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW());

  INSERT INTO blank_spec (blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity, blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg, total_blanks, consumption_pct, material_type, created_at, updated_at, created_by) VALUES
    (gen_random_uuid()::text, v_prod3_id, 'L x2',  70, 154, 4.5, 2, 0.38, 268, 97, '4x8', 105.16, 102.06, 97, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod3_id, 'U x1',  70, 227, 4.5, 1, 0.56, 180, 96, '4x8', 105.16, 101.04, 96, 'HRC', NOW(), NOW(), 'system');

  -- ============================================================
  -- BOM + BLANK_SPEC — PRODUCT 4: 898323-4500 Bkt Fuel Filter
  -- ============================================================
  DELETE FROM blank_spec WHERE product_id = v_prod4_id;
  DELETE FROM bom WHERE product_id = v_prod4_id;

  INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, uom_id, item_type, item_name, is_critical, scrap_allowance_pct, operation_code, bom_version, version, is_active, effective_from, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod4_id, v_hrc45_mat,    1, 'Main Bkt',   1, false, v_kg_uom,  'CUT_PART',   'Main Bracket HRC 430x157x4.5', true,  9, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, v_hrc45_mat,    1, 'Base Plate', 2, false, v_kg_uom,  'CUT_PART',   'Base Plate HRC 145x70x4.5',    true,  5, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, v_crc20_mat,    1, 'Side Plate', 3, false, v_kg_uom,  'CUT_PART',   'Side Plate CRC 90x105x2.0',    true,  5, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, v_cabletie_mat, 1, 'Hardware',   4, false, v_pcs_uom, 'BOUGHT_OUT', 'Cable Tie 8 inch',             false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW());

  INSERT INTO blank_spec (blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity, blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg, total_blanks, consumption_pct, material_type, created_at, updated_at, created_by) VALUES
    (gen_random_uuid()::text, v_prod4_id, 'Main Bkt',   430, 157, 4.5, 1, 2.38,  40, 91, '4x8', 105.16,  95.39, 91, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod4_id, 'Base Plate', 145,  70, 4.5, 1, 0.36, 280, 95, '4x8', 105.16, 100.39, 95, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod4_id, 'Side Plate',  90, 105, 2.0, 1, 0.15, 299, 95, '4x8',  46.74,  44.36, 95, 'CRC', NOW(), NOW(), 'system');

  -- ============================================================
  -- BOM + BLANK_SPEC — PRODUCT 5: 898184-7830 Large Tank FVR
  -- ============================================================
  DELETE FROM blank_spec WHERE product_id = v_prod5_id;
  DELETE FROM bom WHERE product_id = v_prod5_id;

  INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, uom_id, item_type, item_name, is_critical, scrap_allowance_pct, operation_code, bom_version, version, is_active, effective_from, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod5_id, v_hrc30_mat,    1,    'Shell HRC',           1,  false, v_kg_uom,  'CUT_PART',   'Shell HRC 535x903x3.0',            true,  19, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_hrc30_mat,    3,    'Dish HRC',            2,  false, v_kg_uom,  'CUT_PART',   'Dish HRC 358x358x3.0',             true,  23, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_crc12_mat,    1,    'Inside Partition CRC',3,  false, v_kg_uom,  'CUT_PART',   'Inside Partition CRC 299x299x1.2', true,   4, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_shaft28_mat,  0.90, 'Shafts',              4,  false, v_kg_uom,  'BOUGHT_OUT', 'MS Bar Dia28mm (11 pcs)',           true,   2, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_shaft36_mat,  0.34, 'Shafts',              5,  false, v_kg_uom,  'BOUGHT_OUT', 'MS Bar Dia36mm (2 pcs)',            true,   2, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_wire12_mat,   0.29, 'Consumables',         6,  false, v_kg_uom,  'CONSUMABLE', 'Welding Wire 1.2mm',                false,  5, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_redoxide_mat, 0.15, 'Consumables',         7,  false, v_kg_uom,  'CONSUMABLE', 'Red Oxide Primer',                  false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_paintblk_mat, 0.20, 'Consumables',         8,  false, v_kg_uom,  'CONSUMABLE', 'Black Paint',                       false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_petrol_mat,   0.05, 'Consumables',         9,  false, v_ltr_uom, 'CONSUMABLE', 'Petrol Degreaser',                  false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_cap14_mat,    2,    'Hardware',            10, false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 1/4 inch',              false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_cap38_mat,    9,    'Hardware',            11, false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 3/8 inch',              false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_cap34_mat,    2,    'Hardware',            12, false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 3/4 inch',              false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, v_poly_mat,     1,    'Packaging',           13, false, v_pcs_uom, 'BOUGHT_OUT', 'Polythene Sheet 24x36',             false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW());

  INSERT INTO blank_spec (blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity, blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg, total_blanks, consumption_pct, material_type, created_at, updated_at, created_by) VALUES
    (gen_random_uuid()::text, v_prod5_id, 'Shell HRC',            535, 903, 3.0, 1, 11.38,  5, 81, '4x8',  70.10,  56.89, 81, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod5_id, 'Dish HRC',             358, 358, 3.0, 3,  3.02, 18, 77, '4x8',  70.10,  54.33, 77, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod5_id, 'Inside Partition CRC', 299, 299, 1.2, 1,  0.84, 32, 96, '4x8',  28.04,  26.95, 96, 'CRC', NOW(), NOW(), 'system');

  -- ============================================================
  -- BOM + BLANK_SPEC — PRODUCT 6: S4410-E0F70 Tank Assy Air HINOPAK FG8J
  -- ============================================================
  DELETE FROM blank_spec WHERE product_id = v_prod6_id;
  DELETE FROM bom WHERE product_id = v_prod6_id;

  INSERT INTO bom (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, uom_id, item_type, item_name, is_critical, scrap_allowance_pct, operation_code, bom_version, version, is_active, effective_from, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod6_id, v_hrc30_mat,    1,    'Shell HRC',       1,  false, v_kg_uom,  'CUT_PART',   'Shell HRC 530x903x3.0',         true,  20, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_hrc30_mat,    4,    'Dish HRC',        2,  false, v_kg_uom,  'CUT_PART',   'Dish HRC 358x358x3.0 (x4)',     true,  23, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_crc12_mat,    1,    'Name Plate CRC',  3,  false, v_kg_uom,  'CUT_PART',   'Name Plate CRC 18x55x1.2',      false,  1, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_hrc30_mat,    1,    'U Bracket HRC',   4,  false, v_kg_uom,  'CUT_PART',   'U Bracket HRC 30x70x3.0',       false,  0, 'OP-10', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_shaft28_mat,  0.99, 'Shafts',          5,  false, v_kg_uom,  'BOUGHT_OUT', 'MS Bar Dia28mm (12 pcs)',        true,   2, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_shaft32_mat,  0.24, 'Shafts',          6,  false, v_kg_uom,  'BOUGHT_OUT', 'MS Bar Dia32mm (2 pcs)',         true,   2, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_wire12_mat,   0.30, 'Consumables',     7,  false, v_kg_uom,  'CONSUMABLE', 'Welding Wire 1.2mm',             false,  5, 'OP-30', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_redoxide_mat, 0.15, 'Consumables',     8,  false, v_kg_uom,  'CONSUMABLE', 'Red Oxide Primer',               false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_paintblk_mat, 0.20, 'Consumables',     9,  false, v_kg_uom,  'CONSUMABLE', 'Black Paint',                    false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_petrol_mat,   0.05, 'Consumables',     10, false, v_ltr_uom, 'CONSUMABLE', 'Petrol Degreaser',               false, 10, 'OP-50', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_cap14_mat,    1,    'Hardware',        11, false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 1/4 inch',           false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_cap38_mat,    11,   'Hardware',        12, false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 3/8 inch',           false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_cap12_mat,    2,    'Hardware',        13, false, v_pcs_uom, 'BOUGHT_OUT', 'Plastic Cap 1/2 inch',           false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, v_carton_mat,   1,    'Packaging',       14, false, v_roll_uom,'BOUGHT_OUT', 'Corrugated Carton Roll 24 inch', false,  1, 'OP-70', 'v1.0', 1, true, CURRENT_DATE, NOW(), NOW());

  INSERT INTO blank_spec (blank_id, product_id, sub_assembly_name, width_mm, length_mm, thickness_mm, quantity, blank_weight_kg, pcs_per_sheet, sheet_util_pct, sheet_type, sheet_weight_kg, total_blanks, consumption_pct, material_type, created_at, updated_at, created_by) VALUES
    (gen_random_uuid()::text, v_prod6_id, 'Shell HRC',      530,  903, 3.0, 1, 11.27,    5, 80, '4x8', 70.10, 56.35, 80, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod6_id, 'Dish HRC',       358,  358, 3.0, 4,  3.02,   18, 77, '4x8', 70.10, 54.33, 77, 'HRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod6_id, 'Name Plate CRC',  18,   55, 1.2, 1,  0.01, 2970, 99, '4x8', 28.04, 27.70, 99, 'CRC', NOW(), NOW(), 'system'),
    (gen_random_uuid()::text, v_prod6_id, 'U Bracket HRC',   30,   70, 3.0, 1,  0.05, 1411,100, '4x8', 70.10, 69.78,100, 'HRC', NOW(), NOW(), 'system');

  RAISE NOTICE 'All BOM lines and blank specs created.';

  -- ============================================================
  -- ROUTING STEPS — 7 operations per product (42 total)
  -- ============================================================

  DELETE FROM routing WHERE product_id IN (v_prod1_id, v_prod2_id, v_prod3_id, v_prod4_id, v_prod5_id, v_prod6_id);

  -- Product 1: Large Tank FXZ
  INSERT INTO routing (routing_id, product_id, step_no, operation, work_center, duration, cost_rate, is_primary_path, description, setup_time_minutes, cycle_time_minutes, standard_man_hours, quality_check_point, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod1_id, 10, 'Sheet Cutting & Blanking',    'CUTTING',  20, 5.0,  true, 'Cut Shell and Dish blanks from HRC sheet',           15, 5,  0.33, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, 20, 'Roll Forming',                'PRESS',    30, 8.0,  true, 'Roll form shell to cylinder',                        20, 10, 0.50, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, 30, 'Welding & Assembly',          'WELDING',  40, 15.0, true, 'Weld Shell + Dish ends, fit shafts — leak test',     10, 25, 0.83, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, 40, 'Grinding & Dressing',         'GRINDING', 15, 4.0,  true, 'Dress weld seams, deburr edges',                    5,  10, 0.25, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, 50, 'Painting (RedOxide + Black)', 'PAINTING', 25, 6.0,  true, 'Degrease, apply red oxide, apply black paint',       30, 15, 0.75, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, 60, 'Quality Inspection',          'QC',       15, 5.0,  true, 'Pressure test, dimensional check, visual inspection', 5, 10, 0.33, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod1_id, 70, 'Packing & Dispatch Prep',     'PACKING',  10, 2.0,  true, 'Fit plastic caps, wrap polythene, label',             5,  5,  0.17, false, NOW(), NOW());

  -- Product 2: CM 1st NLR/NMR
  INSERT INTO routing (routing_id, product_id, step_no, operation, work_center, duration, cost_rate, is_primary_path, description, setup_time_minutes, cycle_time_minutes, standard_man_hours, quality_check_point, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod2_id, 10, 'Sheet Cutting & Blanking', 'CUTTING',  15, 5.0,  true, 'Cut Main body and Horn bracket blanks', 15, 5,  0.33, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, 20, 'Press Bending',            'PRESS',    20, 8.0,  true, 'Bend brackets to shape',               20, 8,  0.47, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, 30, 'Welding & Assembly',       'WELDING',  25, 15.0, true, 'Weld components, fit nuts and shafts', 10, 20, 0.50, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, 40, 'Grinding & Dressing',      'GRINDING', 10, 4.0,  true, 'Clean weld spatter, deburr',           5,  8,  0.22, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, 50, 'Painting',                 'PAINTING', 20, 6.0,  true, 'Degrease and apply final coat',         15, 12, 0.45, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, 60, 'Quality Inspection',       'QC',       10, 5.0,  true, 'Dimensional and visual inspection',     5,  8,  0.22, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod2_id, 70, 'Packing',                  'PACKING',  8,  2.0,  true, 'Tag and pack',                          5,  5,  0.17, false, NOW(), NOW());

  -- Product 3: Brkt Exh NMR
  INSERT INTO routing (routing_id, product_id, step_no, operation, work_center, duration, cost_rate, is_primary_path, description, setup_time_minutes, cycle_time_minutes, standard_man_hours, quality_check_point, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod3_id, 10, 'Sheet Cutting & Blanking', 'CUTTING',  10, 5.0,  true, 'Cut L and U bracket blanks from HRC 4.5', 15, 4, 0.32, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, 20, 'Press Bending',            'PRESS',    15, 8.0,  true, 'Bend to L and U shapes',                  20, 6, 0.43, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, 30, 'Welding & Assembly',       'WELDING',  15, 15.0, true, 'Weld, fit bolts',                         5, 12, 0.28, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, 40, 'Grinding & Dressing',      'GRINDING', 8,  4.0,  true, 'Clean welds',                             5,  5, 0.17, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, 50, 'Painting',                 'PAINTING', 12, 6.0,  true, 'Paint finish',                            15, 8, 0.38, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, 60, 'Quality Inspection',       'QC',       8,  5.0,  true, 'Dimensional check',                       5,  5, 0.17, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod3_id, 70, 'Packing',                  'PACKING',  5,  2.0,  true, 'Pack with tag',                           5,  3, 0.13, false, NOW(), NOW());

  -- Product 4: Bkt Fuel Filter NMR/NLR
  INSERT INTO routing (routing_id, product_id, step_no, operation, work_center, duration, cost_rate, is_primary_path, description, setup_time_minutes, cycle_time_minutes, standard_man_hours, quality_check_point, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod4_id, 10, 'Sheet Cutting & Blanking', 'CUTTING',  12, 5.0,  true, 'Cut Main, Base, Side plate blanks', 15, 4, 0.32, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, 20, 'Press Bending',            'PRESS',    18, 8.0,  true, 'Bend to bracket shape',             20, 7, 0.45, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, 30, 'Welding & Assembly',       'WELDING',  20, 15.0, true, 'Weld plates, fit cable tie',         5, 15, 0.33, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, 40, 'Grinding & Dressing',      'GRINDING', 8,  4.0,  true, 'Weld clean-up',                     5,  5, 0.17, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, 50, 'Painting',                 'PAINTING', 12, 6.0,  true, 'Paint finish',                      15, 8, 0.38, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, 60, 'Quality Inspection',       'QC',       8,  5.0,  true, 'Dimensional check',                 5,  5, 0.17, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod4_id, 70, 'Packing',                  'PACKING',  5,  2.0,  true, 'Pack',                              5,  3, 0.13, false, NOW(), NOW());

  -- Product 5: Large Tank FVR
  INSERT INTO routing (routing_id, product_id, step_no, operation, work_center, duration, cost_rate, is_primary_path, description, setup_time_minutes, cycle_time_minutes, standard_man_hours, quality_check_point, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod5_id, 10, 'Sheet Cutting & Blanking',    'CUTTING',  22, 5.0,  true, 'Cut Shell, Dish, Partition blanks',               15, 5,  0.33, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, 20, 'Roll Forming',                'PRESS',    28, 8.0,  true, 'Roll form shell cylinder',                        20, 10, 0.50, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, 30, 'Welding & Assembly',          'WELDING',  40, 15.0, true, 'Weld shell+dish+partition+shafts, pressure test', 10, 28, 0.63, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, 40, 'Grinding & Dressing',         'GRINDING', 15, 4.0,  true, 'Dress all welds',                                 5,  10, 0.25, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, 50, 'Painting (RedOxide + Black)', 'PAINTING', 25, 6.0,  true, 'Full paint cycle',                                30, 15, 0.75, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, 60, 'Quality Inspection',          'QC',       15, 5.0,  true, 'Pressure and leak test',                          5,  10, 0.33, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod5_id, 70, 'Packing & Dispatch Prep',     'PACKING',  10, 2.0,  true, 'Fit caps, wrap polythene',                        5,  5,  0.17, false, NOW(), NOW());

  -- Product 6: Tank Assy Air HINOPAK FG8J
  INSERT INTO routing (routing_id, product_id, step_no, operation, work_center, duration, cost_rate, is_primary_path, description, setup_time_minutes, cycle_time_minutes, standard_man_hours, quality_check_point, created_at, updated_at) VALUES
    (gen_random_uuid()::text, v_prod6_id, 10, 'Sheet Cutting & Blanking',    'CUTTING',  22, 5.0,  true, 'Cut Shell, Dish, Name plate, U-bracket',          15, 5,  0.33, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, 20, 'Roll Forming & Bending',      'PRESS',    30, 8.0,  true, 'Form shell cylinder, bend U-bracket',             20, 10, 0.50, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, 30, 'Welding & Assembly',          'WELDING',  45, 15.0, true, 'Weld all, fit shafts, name plate — pressure test',10, 30, 0.67, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, 40, 'Grinding & Dressing',         'GRINDING', 15, 4.0,  true, 'Dress welds, deburr',                             5,  10, 0.25, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, 50, 'Painting (HINOPAK spec)',      'PAINTING', 25, 6.0,  true, 'Full paint cycle per HINOPAK spec',               30, 15, 0.75, false, NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, 60, 'Quality Inspection',          'QC',       15, 5.0,  true, 'Pressure test + dimensional check',               5,  10, 0.33, true,  NOW(), NOW()),
    (gen_random_uuid()::text, v_prod6_id, 70, 'Packing',                     'PACKING',  12, 2.0,  true, 'Fit caps, carton roll wrap, label',               5,  5,  0.17, false, NOW(), NOW());

  RAISE NOTICE '=== MIGRATION COMPLETE ===';
  RAISE NOTICE '23 raw materials | 6 products | 51 BOM lines | 16 blank specs | 42 routing steps';

END $$;

-- ============================================================
-- VERIFICATION — Run to confirm everything worked
-- ============================================================
SELECT 'PRODUCTS'       as entity, COUNT(*) as count FROM product     WHERE product_code IN ('88486-0580','898486-3830','898072-148M','898323-4500','898184-7830','S4410-E0F70')
UNION ALL
SELECT 'RAW MATERIALS', COUNT(*) FROM material WHERE material_code IN ('SHEET-HRC-3.0','SHEET-HRC-4.0','SHEET-HRC-4.5','SHEET-CRC-1.2','SHEET-CRC-2.0','SHAFT-25','SHAFT-28','SHAFT-32','SHAFT-36','WELD-WIRE-1.2','REDOXIDE','PAINT-BLACK','PETROL','PLASTIC-CAP-14','PLASTIC-CAP-38','PLASTIC-CAP-12','PLASTIC-CAP-34','POLYTHENE','CARTON-ROLL-24','NUT-M8-125','BOLT-M8-25','BOLT-M10-30','CABLE-TIE-8')
UNION ALL
SELECT 'BOM LINES',     COUNT(*) FROM bom        WHERE product_id IN (SELECT product_id FROM product WHERE product_code IN ('88486-0580','898486-3830','898072-148M','898323-4500','898184-7830','S4410-E0F70'))
UNION ALL
SELECT 'BLANK SPECS',   COUNT(*) FROM blank_spec  WHERE product_id IN (SELECT product_id FROM product WHERE product_code IN ('88486-0580','898486-3830','898072-148M','898323-4500','898184-7830','S4410-E0F70'))
UNION ALL
SELECT 'ROUTING STEPS', COUNT(*) FROM routing     WHERE product_id IN (SELECT product_id FROM product WHERE product_code IN ('88486-0580','898486-3830','898072-148M','898323-4500','898184-7830','S4410-E0F70'))
UNION ALL
SELECT 'WORK CENTERS',  COUNT(*) FROM work_center  WHERE code IN ('CUTTING','PRESS','WELDING','GRINDING','PAINTING','QC','PACKING')
UNION ALL
SELECT 'ECN TABLE',     COUNT(*) FROM engineering_change;
