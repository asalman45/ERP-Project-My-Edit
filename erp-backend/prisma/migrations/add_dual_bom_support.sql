-- Migration: Add Dual-BOM Support (Production Recipe + Cutting BOM Integration)
-- Date: 2025-10-10
-- Description: Adds fields to support dual-BOM architecture while maintaining backward compatibility

-- ============================================================================
-- 1. ADD ITEM TYPE ENUM FOR BOM
-- ============================================================================
CREATE TYPE "ItemType" AS ENUM ('CUT_PART', 'BOUGHT_OUT', 'CONSUMABLE', 'SUB_ASSEMBLY');

-- ============================================================================
-- 2. ADD OPERATION TYPE ENUM FOR WORK ORDERS
-- ============================================================================
CREATE TYPE "OperationType" AS ENUM (
  'CUTTING', 'FORMING', 'PIERCING', 'WELDING', 'ASSEMBLY', 
  'QC', 'PACKAGING', 'MACHINING', 'HEAT_TREATMENT', 'PAINTING'
);

-- ============================================================================
-- 3. ADD MATERIAL TYPE ENUM
-- ============================================================================
CREATE TYPE "MaterialType" AS ENUM ('SHEET', 'BOUGHT_OUT', 'CONSUMABLE', 'SEMI_FINISHED', 'RAW_MATERIAL');

-- ============================================================================
-- 4. ENHANCE BOM TABLE (Add new fields, keep existing ones)
-- ============================================================================
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "item_type" "ItemType";
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "reference_type" VARCHAR(50); -- 'blank_spec', 'material', 'product'
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "reference_id" TEXT; -- FK to blank_spec, material, or product
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "item_name" VARCHAR(255);
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "is_critical" BOOLEAN DEFAULT false;
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "scrap_allowance_pct" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "operation_code" VARCHAR(50);
ALTER TABLE "bom" ADD COLUMN IF NOT EXISTS "bom_version" VARCHAR(20) DEFAULT 'v1.0';

-- Add index for performance
CREATE INDEX IF NOT EXISTS "idx_bom_item_type" ON "bom"("product_id", "item_type");
CREATE INDEX IF NOT EXISTS "idx_bom_reference" ON "bom"("reference_type", "reference_id");

-- ============================================================================
-- 5. ENHANCE MATERIAL TABLE (Sheet-specific fields)
-- ============================================================================
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "material_type" "MaterialType";
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "unit_weight_kg" DECIMAL(12,4);
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "unit_cost" DECIMAL(15,2);
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "supplier_id" TEXT;
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "reorder_level" INTEGER;

-- Sheet-specific fields
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "sheet_width_mm" DECIMAL(10,2);
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "sheet_length_mm" DECIMAL(10,2);
ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "sheet_thickness_mm" DECIMAL(6,2);

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_material_type" ON "material"("material_type");
CREATE INDEX IF NOT EXISTS "idx_material_supplier" ON "material"("supplier_id");

-- ============================================================================
-- 6. ENHANCE WORK_ORDER TABLE (Hierarchical WO support)
-- ============================================================================
ALTER TABLE "work_order" ADD COLUMN IF NOT EXISTS "parent_wo_id" TEXT;
ALTER TABLE "work_order" ADD COLUMN IF NOT EXISTS "operation_type" "OperationType";
ALTER TABLE "work_order" ADD COLUMN IF NOT EXISTS "sheets_allocated" INTEGER;
ALTER TABLE "work_order" ADD COLUMN IF NOT EXISTS "dependency_status" VARCHAR(20) DEFAULT 'READY'; -- READY, WAITING, BLOCKED
ALTER TABLE "work_order" ADD COLUMN IF NOT EXISTS "depends_on_wo_id" TEXT; -- Direct dependency

-- Add foreign key for parent-child relationship
ALTER TABLE "work_order" 
  ADD CONSTRAINT "fk_work_order_parent" 
  FOREIGN KEY ("parent_wo_id") 
  REFERENCES "work_order"("wo_id") 
  ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_work_order_parent" ON "work_order"("parent_wo_id");
CREATE INDEX IF NOT EXISTS "idx_work_order_operation" ON "work_order"("operation_type");
CREATE INDEX IF NOT EXISTS "idx_work_order_dependency" ON "work_order"("depends_on_wo_id");

-- ============================================================================
-- 7. ENHANCE BLANK_SPEC TABLE (Add sheet dimensions if not present)
-- ============================================================================
ALTER TABLE "blank_spec" ADD COLUMN IF NOT EXISTS "sheet_width_mm" DECIMAL(10,2);
ALTER TABLE "blank_spec" ADD COLUMN IF NOT EXISTS "sheet_length_mm" DECIMAL(10,2);
ALTER TABLE "blank_spec" ADD COLUMN IF NOT EXISTS "material_type" VARCHAR(50);
ALTER TABLE "blank_spec" ADD COLUMN IF NOT EXISTS "cutting_direction" VARCHAR(20); -- HORIZONTAL, VERTICAL, SMART_MIXED
ALTER TABLE "blank_spec" ADD COLUMN IF NOT EXISTS "efficiency_pct" DECIMAL(5,2);
ALTER TABLE "blank_spec" ADD COLUMN IF NOT EXISTS "scrap_pct" DECIMAL(5,2);

-- ============================================================================
-- 8. CREATE MATERIAL_REQUISITION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS "material_requisition" (
  "requisition_id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" TEXT,
  "work_order_id" TEXT,
  "material_id" TEXT NOT NULL,
  "material_code" VARCHAR(100),
  "material_name" VARCHAR(255),
  "material_type" VARCHAR(50),
  "quantity_required" DECIMAL(15,4) NOT NULL,
  "quantity_available" DECIMAL(15,4) DEFAULT 0,
  "quantity_shortage" DECIMAL(15,4) DEFAULT 0,
  "unit_cost" DECIMAL(15,2),
  "total_cost" DECIMAL(15,2),
  "status" VARCHAR(30) DEFAULT 'PENDING', -- PENDING, APPROVED, PARTIALLY_FULFILLED, FULFILLED, CANCELLED
  "priority" VARCHAR(20) DEFAULT 'NORMAL', -- HIGH, NORMAL, LOW
  "required_by_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "created_by" TEXT,
  "approved_at" TIMESTAMP,
  "approved_by" TEXT,
  
  CONSTRAINT "fk_material_requisition_material" 
    FOREIGN KEY ("material_id") 
    REFERENCES "material"("material_id") 
    ON DELETE CASCADE,
    
  CONSTRAINT "fk_material_requisition_work_order" 
    FOREIGN KEY ("work_order_id") 
    REFERENCES "work_order"("wo_id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_mat_req_sales_order" ON "material_requisition"("sales_order_id");
CREATE INDEX IF NOT EXISTS "idx_mat_req_work_order" ON "material_requisition"("work_order_id");
CREATE INDEX IF NOT EXISTS "idx_mat_req_status" ON "material_requisition"("status");
CREATE INDEX IF NOT EXISTS "idx_mat_req_priority" ON "material_requisition"("priority");

-- ============================================================================
-- 9. CREATE BOM_EXPLOSION_LOG TABLE (Track MRP runs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "bom_explosion_log" (
  "explosion_id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "sales_order_id" TEXT,
  "product_id" TEXT NOT NULL,
  "quantity" DECIMAL(15,4) NOT NULL,
  "explosion_data" JSONB, -- Store the complete explosion result
  "total_sheet_count" INTEGER,
  "total_bought_items_count" INTEGER,
  "total_consumables_count" INTEGER,
  "total_material_cost" DECIMAL(15,2),
  "exploded_by" TEXT,
  "exploded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "fk_bom_explosion_product" 
    FOREIGN KEY ("product_id") 
    REFERENCES "product"("product_id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_bom_explosion_sales_order" ON "bom_explosion_log"("sales_order_id");
CREATE INDEX IF NOT EXISTS "idx_bom_explosion_product" ON "bom_explosion_log"("product_id");

-- ============================================================================
-- 10. CREATE WORK_ORDER_MATERIAL_ISSUE TABLE (Track material issuance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "work_order_material_issue" (
  "issue_id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "work_order_id" TEXT NOT NULL,
  "material_id" TEXT NOT NULL,
  "material_type" VARCHAR(50),
  "quantity_planned" DECIMAL(15,4),
  "quantity_issued" DECIMAL(15,4),
  "quantity_consumed" DECIMAL(15,4),
  "quantity_returned" DECIMAL(15,4) DEFAULT 0,
  "unit_cost" DECIMAL(15,2),
  "total_cost" DECIMAL(15,2),
  "issued_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "issued_by" TEXT,
  "status" VARCHAR(30) DEFAULT 'ISSUED', -- PLANNED, ISSUED, CONSUMED, RETURNED
  
  CONSTRAINT "fk_wo_material_issue_wo" 
    FOREIGN KEY ("work_order_id") 
    REFERENCES "work_order"("wo_id") 
    ON DELETE CASCADE,
    
  CONSTRAINT "fk_wo_material_issue_material" 
    FOREIGN KEY ("material_id") 
    REFERENCES "material"("material_id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_wo_mat_issue_wo" ON "work_order_material_issue"("work_order_id");
CREATE INDEX IF NOT EXISTS "idx_wo_mat_issue_material" ON "work_order_material_issue"("material_id");
CREATE INDEX IF NOT EXISTS "idx_wo_mat_issue_status" ON "work_order_material_issue"("status");

-- ============================================================================
-- 11. CREATE PRODUCTION_OUTPUT TABLE (Track work order output)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "production_output" (
  "output_id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "work_order_id" TEXT NOT NULL,
  "item_id" TEXT, -- Could be blank_id, product_id, etc.
  "item_type" VARCHAR(50), -- BLANK, SUB_ASSEMBLY, FINISHED_GOOD
  "item_name" VARCHAR(255),
  "quantity_planned" DECIMAL(15,4),
  "quantity_good" DECIMAL(15,4),
  "quantity_rejected" DECIMAL(15,4) DEFAULT 0,
  "quantity_rework" DECIMAL(15,4) DEFAULT 0,
  "rejection_reason" TEXT,
  "recorded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "recorded_by" TEXT,
  
  CONSTRAINT "fk_production_output_wo" 
    FOREIGN KEY ("work_order_id") 
    REFERENCES "work_order"("wo_id") 
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_prod_output_wo" ON "production_output"("work_order_id");
CREATE INDEX IF NOT EXISTS "idx_prod_output_item" ON "production_output"("item_id", "item_type");

-- ============================================================================
-- 12. DATA MIGRATION: Set default values for existing records
-- ============================================================================

-- Set default item_type for existing BOM records (assume BOUGHT_OUT)
UPDATE "bom" SET "item_type" = 'BOUGHT_OUT' WHERE "item_type" IS NULL;

-- Set default material_type for existing materials
UPDATE "material" SET "material_type" = 'RAW_MATERIAL' WHERE "material_type" IS NULL;

-- ============================================================================
-- 13. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE "material_requisition" IS 'Material requirements from BOM explosion, linked to sales orders or work orders';
COMMENT ON TABLE "bom_explosion_log" IS 'Audit log of BOM explosions for traceability';
COMMENT ON TABLE "work_order_material_issue" IS 'Tracks material issuance from inventory to production';
COMMENT ON TABLE "production_output" IS 'Records production output including good, rejected, and rework quantities';

COMMENT ON COLUMN "bom"."item_type" IS 'Type of BOM item: CUT_PART (from blank_spec), BOUGHT_OUT, CONSUMABLE, SUB_ASSEMBLY';
COMMENT ON COLUMN "bom"."reference_type" IS 'Type of referenced entity: blank_spec, material, product';
COMMENT ON COLUMN "bom"."reference_id" IS 'ID of the referenced entity (polymorphic relation)';

COMMENT ON COLUMN "work_order"."parent_wo_id" IS 'Parent work order ID for hierarchical work orders';
COMMENT ON COLUMN "work_order"."operation_type" IS 'Type of operation: CUTTING, FORMING, WELDING, etc.';
COMMENT ON COLUMN "work_order"."sheets_allocated" IS 'Number of sheets allocated for cutting operations';
COMMENT ON COLUMN "work_order"."dependency_status" IS 'Dependency status: READY, WAITING, BLOCKED';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

