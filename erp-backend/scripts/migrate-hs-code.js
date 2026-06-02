// scripts/migrate-hs-code.js
import pool from '../src/utils/db.js';
import { logger } from '../src/utils/logger.js';

const migrationQuery = `
  -- 1. Alter tables to add hs_code column if they do not exist
  ALTER TABLE product ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE material ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE raw_material ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE purchase_order_item ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE goods_receipt_item ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE sales_order_item ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE dispatch_item ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE customer_invoice_item ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);
  ALTER TABLE invoice_item ADD COLUMN IF NOT EXISTS hs_code VARCHAR(20);

  -- 2. Create trigger function for items referencing product or material
  CREATE OR REPLACE FUNCTION populate_item_hs_code()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.hs_code IS NULL THEN
      IF NEW.product_id IS NOT NULL THEN
        NEW.hs_code := (SELECT hs_code FROM product WHERE product_id = NEW.product_id);
      ELSIF NEW.material_id IS NOT NULL THEN
        NEW.hs_code := (SELECT hs_code FROM material WHERE material_id = NEW.material_id);
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- 3. Create trigger function for sales order items (resolving by product_id or item_code)
  CREATE OR REPLACE FUNCTION populate_soi_hs_code()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.hs_code IS NULL THEN
      IF NEW.product_id IS NOT NULL THEN
        NEW.hs_code := (SELECT hs_code FROM product WHERE product_id = NEW.product_id);
      ELSIF NEW.item_code IS NOT NULL THEN
        NEW.hs_code := (SELECT hs_code FROM product WHERE product_code = NEW.item_code LIMIT 1);
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- 4. Create trigger function for items referencing product only
  CREATE OR REPLACE FUNCTION populate_product_item_hs_code()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.hs_code IS NULL THEN
      IF NEW.product_id IS NOT NULL THEN
        NEW.hs_code := (SELECT hs_code FROM product WHERE product_id = NEW.product_id);
      END IF;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- 5. Attach triggers to transactional tables
  
  -- purchase_order_item
  DROP TRIGGER IF EXISTS trg_populate_poi_hs_code ON purchase_order_item;
  CREATE TRIGGER trg_populate_poi_hs_code
  BEFORE INSERT OR UPDATE ON purchase_order_item
  FOR EACH ROW EXECUTE FUNCTION populate_item_hs_code();

  -- goods_receipt_item
  DROP TRIGGER IF EXISTS trg_populate_gri_hs_code ON goods_receipt_item;
  CREATE TRIGGER trg_populate_gri_hs_code
  BEFORE INSERT OR UPDATE ON goods_receipt_item
  FOR EACH ROW EXECUTE FUNCTION populate_item_hs_code();

  -- sales_order_item
  DROP TRIGGER IF EXISTS trg_populate_soi_hs_code ON sales_order_item;
  CREATE TRIGGER trg_populate_soi_hs_code
  BEFORE INSERT OR UPDATE ON sales_order_item
  FOR EACH ROW EXECUTE FUNCTION populate_soi_hs_code();

  -- dispatch_item
  DROP TRIGGER IF EXISTS trg_populate_di_hs_code ON dispatch_item;
  CREATE TRIGGER trg_populate_di_hs_code
  BEFORE INSERT OR UPDATE ON dispatch_item
  FOR EACH ROW EXECUTE FUNCTION populate_product_item_hs_code();

  -- customer_invoice_item
  DROP TRIGGER IF EXISTS trg_populate_cii_hs_code ON customer_invoice_item;
  CREATE TRIGGER trg_populate_cii_hs_code
  BEFORE INSERT OR UPDATE ON customer_invoice_item
  FOR EACH ROW EXECUTE FUNCTION populate_product_item_hs_code();

  -- invoice_item
  DROP TRIGGER IF EXISTS trg_populate_ii_hs_code ON invoice_item;
  CREATE TRIGGER trg_populate_ii_hs_code
  BEFORE INSERT OR UPDATE ON invoice_item
  FOR EACH ROW EXECUTE FUNCTION populate_item_hs_code();
`;

const runMigration = async () => {
  logger.info('Starting HS Code Database Migration...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migrationQuery);
    await client.query('COMMIT');
    logger.info('HS Code Database Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Database Migration failed!');
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

runMigration();
