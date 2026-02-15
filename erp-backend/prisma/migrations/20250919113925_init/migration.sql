-- CreateEnum
CREATE TYPE "public"."Category" AS ENUM ('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'SCRAP_ITEM');

-- CreateEnum
CREATE TYPE "public"."InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ISSUED', 'DAMAGED', 'QUARANTINE', 'CONSUMED');

-- CreateEnum
CREATE TYPE "public"."TxnType" AS ENUM ('ISSUE', 'RECEIVE', 'TRANSFER', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "public"."WOStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."POStatus" AS ENUM ('OPEN', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PRStatus" AS ENUM ('OPEN', 'APPROVED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "public"."ScrapStatus" AS ENUM ('AVAILABLE', 'CONSUMED', 'SOLD', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "public"."ProductionStatus" AS ENUM ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."DispatchStatus" AS ENUM ('PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SOStatus" AS ENUM ('OPEN', 'PARTIALLY_SHIPPED', 'SHIPPED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LedgerItemType" AS ENUM ('PRODUCT', 'MATERIAL', 'SCRAP');

-- CreateEnum
CREATE TYPE "public"."ScrapTxnType" AS ENUM ('GENERATED', 'REUSED', 'ADJUSTED', 'CONSUMED', 'SOLD');

-- CreateTable
CREATE TABLE "public"."oem" (
    "oem_id" TEXT NOT NULL,
    "oem_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oem_pkey" PRIMARY KEY ("oem_id")
);

-- CreateTable
CREATE TABLE "public"."model" (
    "model_id" TEXT NOT NULL,
    "oem_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_year" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_pkey" PRIMARY KEY ("model_id")
);

-- CreateTable
CREATE TABLE "public"."uom" (
    "uom_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "uom_pkey" PRIMARY KEY ("uom_id")
);

-- CreateTable
CREATE TABLE "public"."product" (
    "product_id" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "part_name" TEXT NOT NULL,
    "description" TEXT,
    "standard_cost" DOUBLE PRECISION,
    "category" "public"."Category" NOT NULL DEFAULT 'FINISHED_GOOD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oem_id" TEXT,
    "model_id" TEXT,
    "uom_id" TEXT,
    "min_stock" DOUBLE PRECISION,
    "max_stock" DOUBLE PRECISION,
    "reorder_qty" DOUBLE PRECISION,

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "public"."material" (
    "material_id" TEXT NOT NULL,
    "material_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."Category" NOT NULL DEFAULT 'RAW_MATERIAL',
    "uom_id" TEXT,
    "min_stock" DOUBLE PRECISION,
    "max_stock" DOUBLE PRECISION,

    CONSTRAINT "material_pkey" PRIMARY KEY ("material_id")
);

-- CreateTable
CREATE TABLE "public"."bom" (
    "bom_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "bom_pkey" PRIMARY KEY ("bom_id")
);

-- CreateTable
CREATE TABLE "public"."routing" (
    "routing_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "step_no" INTEGER NOT NULL,
    "operation" TEXT NOT NULL,
    "work_center" TEXT,
    "duration" INTEGER,
    "cost_rate" DOUBLE PRECISION,

    CONSTRAINT "routing_pkey" PRIMARY KEY ("routing_id")
);

-- CreateTable
CREATE TABLE "public"."inventory" (
    "inventory_id" TEXT NOT NULL,
    "product_id" TEXT,
    "material_id" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "location_id" TEXT,
    "batch_no" TEXT,
    "uom_id" TEXT,
    "status" "public"."InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "public"."inventory_txn" (
    "txn_id" TEXT NOT NULL,
    "inventory_id" TEXT,
    "product_id" TEXT,
    "wastage_id" TEXT,
    "material_id" TEXT,
    "wo_id" TEXT,
    "po_id" TEXT,
    "txn_type" "public"."TxnType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION,
    "location_id" TEXT,
    "batch_no" TEXT,
    "reference" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_txn_pkey" PRIMARY KEY ("txn_id")
);

-- CreateTable
CREATE TABLE "public"."supplier" (
    "supplier_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "lead_time_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("supplier_id")
);

-- CreateTable
CREATE TABLE "public"."purchase_requisition" (
    "pr_id" TEXT NOT NULL,
    "pr_no" TEXT NOT NULL,
    "requested_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."PRStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,

    CONSTRAINT "purchase_requisition_pkey" PRIMARY KEY ("pr_id")
);

-- CreateTable
CREATE TABLE "public"."purchase_requisition_item" (
    "id" TEXT NOT NULL,
    "pr_id" TEXT NOT NULL,
    "product_id" TEXT,
    "material_id" TEXT,
    "uom_id" TEXT,
    "qty_requested" DOUBLE PRECISION NOT NULL,
    "qty_approved" DOUBLE PRECISION,

    CONSTRAINT "purchase_requisition_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order" (
    "po_id" TEXT NOT NULL,
    "po_no" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "pr_id" TEXT,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "status" "public"."POStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseRequisitionItemId" TEXT,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("po_id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_item" (
    "po_item_id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "product_id" TEXT,
    "material_id" TEXT,
    "uom_id" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "received_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_order_item_pkey" PRIMARY KEY ("po_item_id")
);

-- CreateTable
CREATE TABLE "public"."goods_receipt" (
    "grn_id" TEXT NOT NULL,
    "grn_no" TEXT NOT NULL,
    "po_id" TEXT,
    "supplier_id" TEXT,
    "received_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by" TEXT,
    "location_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "goods_receipt_pkey" PRIMARY KEY ("grn_id")
);

-- CreateTable
CREATE TABLE "public"."goods_receipt_item" (
    "gri_id" TEXT NOT NULL,
    "grn_id" TEXT NOT NULL,
    "po_item_id" TEXT,
    "product_id" TEXT,
    "material_id" TEXT,
    "qty_received" DOUBLE PRECISION NOT NULL,
    "uom_id" TEXT,

    CONSTRAINT "goods_receipt_item_pkey" PRIMARY KEY ("gri_id")
);

-- CreateTable
CREATE TABLE "public"."work_order" (
    "wo_id" TEXT NOT NULL,
    "wo_no" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "uom_id" TEXT,
    "priority" INTEGER DEFAULT 1,
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "status" "public"."WOStatus" NOT NULL DEFAULT 'PLANNED',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_pkey" PRIMARY KEY ("wo_id")
);

-- CreateTable
CREATE TABLE "public"."work_order_item" (
    "id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "work_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_order_step" (
    "step_id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "step_no" INTEGER NOT NULL,
    "routing_id" TEXT,
    "operation" TEXT NOT NULL,
    "work_center" TEXT,
    "assigned_to" TEXT,
    "planned_qty" DOUBLE PRECISION,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" "public"."StepStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_step_pkey" PRIMARY KEY ("step_id")
);

-- CreateTable
CREATE TABLE "public"."wastage" (
    "wastage_id" TEXT NOT NULL,
    "wo_id" TEXT NOT NULL,
    "step_id" TEXT,
    "material_id" TEXT NOT NULL,
    "reentry_txn_id" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "uom_id" TEXT,
    "location_id" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wastage_pkey" PRIMARY KEY ("wastage_id")
);

-- CreateTable
CREATE TABLE "public"."location" (
    "location_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "public"."work_center" (
    "work_center_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_center_pkey" PRIMARY KEY ("work_center_id")
);

-- CreateTable
CREATE TABLE "public"."operation" (
    "operation_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_pkey" PRIMARY KEY ("operation_id")
);

-- CreateTable
CREATE TABLE "public"."blank_spec" (
    "blank_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "width_mm" DOUBLE PRECISION NOT NULL,
    "length_mm" DOUBLE PRECISION NOT NULL,
    "thickness_mm" DOUBLE PRECISION NOT NULL,
    "blank_weight_kg" DOUBLE PRECISION,
    "pcs_per_sheet" INTEGER,
    "sheet_util_pct" DOUBLE PRECISION,
    "sheet_type" TEXT,
    "sheet_weight_kg" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blank_spec_pkey" PRIMARY KEY ("blank_id")
);

-- CreateTable
CREATE TABLE "public"."scrap_inventory" (
    "scrap_id" TEXT NOT NULL,
    "blank_id" TEXT,
    "material_id" TEXT,
    "width_mm" DOUBLE PRECISION,
    "length_mm" DOUBLE PRECISION,
    "thickness_mm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "location_id" TEXT,
    "status" "public"."ScrapStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "reference" TEXT,
    "consumed_by_po" TEXT,

    CONSTRAINT "scrap_inventory_pkey" PRIMARY KEY ("scrap_id")
);

-- CreateTable
CREATE TABLE "public"."scrap_transaction" (
    "txn_id" TEXT NOT NULL,
    "scrap_id" TEXT NOT NULL,
    "txn_type" "public"."ScrapTxnType" NOT NULL,
    "qty_used" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "scrap_transaction_pkey" PRIMARY KEY ("txn_id")
);

-- CreateTable
CREATE TABLE "public"."stock_ledger" (
    "ledger_id" TEXT NOT NULL,
    "item_type" "public"."LedgerItemType" NOT NULL,
    "product_id" TEXT,
    "material_id" TEXT,
    "scrap_id" TEXT,
    "txn_id" TEXT,
    "txn_type" "public"."TxnType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DOUBLE PRECISION,
    "total_cost" DOUBLE PRECISION,
    "location_id" TEXT,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("ledger_id")
);

-- CreateTable
CREATE TABLE "public"."production_order" (
    "po_id" TEXT NOT NULL,
    "po_no" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty_ordered" DOUBLE PRECISION NOT NULL,
    "qty_completed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" TEXT,
    "priority" INTEGER DEFAULT 1,
    "planned_start" TIMESTAMP(3),
    "planned_end" TIMESTAMP(3),
    "status" "public"."ProductionStatus" NOT NULL DEFAULT 'PLANNED',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produced_inventory_id" TEXT,

    CONSTRAINT "production_order_pkey" PRIMARY KEY ("po_id")
);

-- CreateTable
CREATE TABLE "public"."production_material_usage" (
    "usage_id" TEXT NOT NULL,
    "production_id" TEXT NOT NULL,
    "product_id" TEXT,
    "material_id" TEXT,
    "scrap_id" TEXT,
    "qty_required" DOUBLE PRECISION NOT NULL,
    "qty_issued" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_material_usage_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "public"."production_step" (
    "ps_id" TEXT NOT NULL,
    "production_id" TEXT NOT NULL,
    "step_no" INTEGER NOT NULL,
    "operation" TEXT NOT NULL,
    "planned_qty" DOUBLE PRECISION,
    "completed_qty" DOUBLE PRECISION DEFAULT 0,
    "status" "public"."StepStatus" NOT NULL DEFAULT 'PENDING',
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "production_step_pkey" PRIMARY KEY ("ps_id")
);

-- CreateTable
CREATE TABLE "public"."customer" (
    "customer_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "public"."sales_order" (
    "so_id" TEXT NOT NULL,
    "so_no" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "status" "public"."SOStatus" NOT NULL DEFAULT 'OPEN',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_order_pkey" PRIMARY KEY ("so_id")
);

-- CreateTable
CREATE TABLE "public"."sales_order_item" (
    "soi_id" TEXT NOT NULL,
    "so_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty_ordered" DOUBLE PRECISION NOT NULL,
    "qty_shipped" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" TEXT,

    CONSTRAINT "sales_order_item_pkey" PRIMARY KEY ("soi_id")
);

-- CreateTable
CREATE TABLE "public"."dispatch_order" (
    "dispatch_id" TEXT NOT NULL,
    "dispatch_no" TEXT NOT NULL,
    "so_id" TEXT,
    "customer_id" TEXT,
    "location_id" TEXT,
    "vehicle_no" TEXT,
    "driver_name" TEXT,
    "dispatch_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "status" "public"."DispatchStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "dispatch_order_pkey" PRIMARY KEY ("dispatch_id")
);

-- CreateTable
CREATE TABLE "public"."dispatch_item" (
    "di_id" TEXT NOT NULL,
    "dispatch_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "uom_id" TEXT,

    CONSTRAINT "dispatch_item_pkey" PRIMARY KEY ("di_id")
);

-- CreateTable
CREATE TABLE "public"."report_schedule" (
    "report_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cron_expr" TEXT NOT NULL,
    "last_run" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "params" JSONB,

    CONSTRAINT "report_schedule_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oem_oem_name_key" ON "public"."oem"("oem_name");

-- CreateIndex
CREATE UNIQUE INDEX "model_oem_id_model_name_key" ON "public"."model"("oem_id", "model_name");

-- CreateIndex
CREATE UNIQUE INDEX "uom_code_key" ON "public"."uom"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_product_code_key" ON "public"."product"("product_code");

-- CreateIndex
CREATE INDEX "product_product_code_idx" ON "public"."product"("product_code");

-- CreateIndex
CREATE UNIQUE INDEX "material_material_code_key" ON "public"."material"("material_code");

-- CreateIndex
CREATE INDEX "material_material_code_idx" ON "public"."material"("material_code");

-- CreateIndex
CREATE UNIQUE INDEX "bom_product_id_material_id_key" ON "public"."bom"("product_id", "material_id");

-- CreateIndex
CREATE UNIQUE INDEX "routing_product_id_step_no_key" ON "public"."routing"("product_id", "step_no");

-- CreateIndex
CREATE INDEX "inventory_product_id_idx" ON "public"."inventory"("product_id");

-- CreateIndex
CREATE INDEX "inventory_material_id_idx" ON "public"."inventory"("material_id");

-- CreateIndex
CREATE INDEX "inventory_location_id_idx" ON "public"."inventory"("location_id");

-- CreateIndex
CREATE INDEX "inventory_txn_product_id_material_id_po_id_wo_id_idx" ON "public"."inventory_txn"("product_id", "material_id", "po_id", "wo_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_code_key" ON "public"."supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requisition_pr_no_key" ON "public"."purchase_requisition"("pr_no");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_po_no_key" ON "public"."purchase_order"("po_no");

-- CreateIndex
CREATE INDEX "purchase_order_supplier_id_idx" ON "public"."purchase_order"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_order_item_product_id_material_id_idx" ON "public"."purchase_order_item"("product_id", "material_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_grn_no_key" ON "public"."goods_receipt"("grn_no");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_wo_no_key" ON "public"."work_order"("wo_no");

-- CreateIndex
CREATE INDEX "work_order_product_id_idx" ON "public"."work_order"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_step_wo_id_step_no_key" ON "public"."work_order_step"("wo_id", "step_no");

-- CreateIndex
CREATE UNIQUE INDEX "wastage_reentry_txn_id_key" ON "public"."wastage"("reentry_txn_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_code_key" ON "public"."location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "work_center_code_key" ON "public"."work_center"("code");

-- CreateIndex
CREATE UNIQUE INDEX "operation_code_key" ON "public"."operation"("code");

-- CreateIndex
CREATE INDEX "blank_spec_product_id_idx" ON "public"."blank_spec"("product_id");

-- CreateIndex
CREATE INDEX "scrap_inventory_status_idx" ON "public"."scrap_inventory"("status");

-- CreateIndex
CREATE INDEX "scrap_inventory_location_id_idx" ON "public"."scrap_inventory"("location_id");

-- CreateIndex
CREATE INDEX "scrap_transaction_txn_type_idx" ON "public"."scrap_transaction"("txn_type");

-- CreateIndex
CREATE INDEX "stock_ledger_product_id_material_id_scrap_id_idx" ON "public"."stock_ledger"("product_id", "material_id", "scrap_id");

-- CreateIndex
CREATE INDEX "stock_ledger_created_at_idx" ON "public"."stock_ledger"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "production_order_po_no_key" ON "public"."production_order"("po_no");

-- CreateIndex
CREATE UNIQUE INDEX "production_order_produced_inventory_id_key" ON "public"."production_order"("produced_inventory_id");

-- CreateIndex
CREATE INDEX "production_order_product_id_idx" ON "public"."production_order"("product_id");

-- CreateIndex
CREATE INDEX "production_material_usage_production_id_material_id_scrap_i_idx" ON "public"."production_material_usage"("production_id", "material_id", "scrap_id");

-- CreateIndex
CREATE UNIQUE INDEX "production_step_production_id_step_no_key" ON "public"."production_step"("production_id", "step_no");

-- CreateIndex
CREATE UNIQUE INDEX "customer_code_key" ON "public"."customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_so_no_key" ON "public"."sales_order"("so_no");

-- CreateIndex
CREATE INDEX "sales_order_customer_id_idx" ON "public"."sales_order"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispatch_order_dispatch_no_key" ON "public"."dispatch_order"("dispatch_no");

-- CreateIndex
CREATE INDEX "dispatch_order_so_id_idx" ON "public"."dispatch_order"("so_id");

-- AddForeignKey
ALTER TABLE "public"."model" ADD CONSTRAINT "model_oem_id_fkey" FOREIGN KEY ("oem_id") REFERENCES "public"."oem"("oem_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."model"("model_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_oem_id_fkey" FOREIGN KEY ("oem_id") REFERENCES "public"."oem"("oem_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product" ADD CONSTRAINT "product_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material" ADD CONSTRAINT "material_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bom" ADD CONSTRAINT "bom_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bom" ADD CONSTRAINT "bom_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."routing" ADD CONSTRAINT "routing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory" ADD CONSTRAINT "inventory_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_txn" ADD CONSTRAINT "inventory_txn_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_txn" ADD CONSTRAINT "inventory_txn_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("inventory_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_txn" ADD CONSTRAINT "inventory_txn_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "public"."work_order"("wo_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_txn" ADD CONSTRAINT "inventory_txn_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_order"("po_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_txn" ADD CONSTRAINT "inventory_txn_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_requisition_item" ADD CONSTRAINT "purchase_requisition_item_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "public"."purchase_requisition"("pr_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_requisition_item" ADD CONSTRAINT "purchase_requisition_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_requisition_item" ADD CONSTRAINT "purchase_requisition_item_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_requisition_item" ADD CONSTRAINT "purchase_requisition_item_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("supplier_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_pr_id_fkey" FOREIGN KEY ("pr_id") REFERENCES "public"."purchase_requisition"("pr_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order" ADD CONSTRAINT "purchase_order_purchaseRequisitionItemId_fkey" FOREIGN KEY ("purchaseRequisitionItemId") REFERENCES "public"."purchase_requisition_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_item" ADD CONSTRAINT "purchase_order_item_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_order"("po_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_item" ADD CONSTRAINT "purchase_order_item_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_item" ADD CONSTRAINT "purchase_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_item" ADD CONSTRAINT "purchase_order_item_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt" ADD CONSTRAINT "goods_receipt_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_order"("po_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt" ADD CONSTRAINT "goods_receipt_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt" ADD CONSTRAINT "goods_receipt_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("supplier_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "public"."goods_receipt"("grn_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_po_item_id_fkey" FOREIGN KEY ("po_item_id") REFERENCES "public"."purchase_order_item"("po_item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goods_receipt_item" ADD CONSTRAINT "goods_receipt_item_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order" ADD CONSTRAINT "work_order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order" ADD CONSTRAINT "work_order_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order_item" ADD CONSTRAINT "work_order_item_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "public"."work_order"("wo_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order_item" ADD CONSTRAINT "work_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order_step" ADD CONSTRAINT "work_order_step_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "public"."work_order"("wo_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_order_step" ADD CONSTRAINT "work_order_step_routing_id_fkey" FOREIGN KEY ("routing_id") REFERENCES "public"."routing"("routing_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wastage" ADD CONSTRAINT "wastage_wo_id_fkey" FOREIGN KEY ("wo_id") REFERENCES "public"."work_order"("wo_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wastage" ADD CONSTRAINT "wastage_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "public"."work_order_step"("step_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wastage" ADD CONSTRAINT "wastage_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wastage" ADD CONSTRAINT "wastage_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wastage" ADD CONSTRAINT "wastage_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wastage" ADD CONSTRAINT "wastage_reentry_txn_id_fkey" FOREIGN KEY ("reentry_txn_id") REFERENCES "public"."inventory_txn"("txn_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blank_spec" ADD CONSTRAINT "blank_spec_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scrap_inventory" ADD CONSTRAINT "scrap_inventory_blank_id_fkey" FOREIGN KEY ("blank_id") REFERENCES "public"."blank_spec"("blank_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scrap_inventory" ADD CONSTRAINT "scrap_inventory_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scrap_inventory" ADD CONSTRAINT "scrap_inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."scrap_transaction" ADD CONSTRAINT "scrap_transaction_scrap_id_fkey" FOREIGN KEY ("scrap_id") REFERENCES "public"."scrap_inventory"("scrap_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_ledger" ADD CONSTRAINT "stock_ledger_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_ledger" ADD CONSTRAINT "stock_ledger_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_ledger" ADD CONSTRAINT "stock_ledger_scrap_id_fkey" FOREIGN KEY ("scrap_id") REFERENCES "public"."scrap_inventory"("scrap_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_ledger" ADD CONSTRAINT "stock_ledger_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_order" ADD CONSTRAINT "production_order_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_order" ADD CONSTRAINT "production_order_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_order" ADD CONSTRAINT "production_order_produced_inventory_id_fkey" FOREIGN KEY ("produced_inventory_id") REFERENCES "public"."inventory"("inventory_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_material_usage" ADD CONSTRAINT "production_material_usage_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "public"."production_order"("po_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_material_usage" ADD CONSTRAINT "production_material_usage_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_material_usage" ADD CONSTRAINT "production_material_usage_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_material_usage" ADD CONSTRAINT "production_material_usage_scrap_id_fkey" FOREIGN KEY ("scrap_id") REFERENCES "public"."scrap_inventory"("scrap_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_material_usage" ADD CONSTRAINT "production_material_usage_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."production_step" ADD CONSTRAINT "production_step_production_id_fkey" FOREIGN KEY ("production_id") REFERENCES "public"."production_order"("po_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order" ADD CONSTRAINT "sales_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_item" ADD CONSTRAINT "sales_order_item_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "public"."sales_order"("so_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_item" ADD CONSTRAINT "sales_order_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_item" ADD CONSTRAINT "sales_order_item_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatch_order" ADD CONSTRAINT "dispatch_order_so_id_fkey" FOREIGN KEY ("so_id") REFERENCES "public"."sales_order"("so_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatch_order" ADD CONSTRAINT "dispatch_order_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatch_order" ADD CONSTRAINT "dispatch_order_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatch_item" ADD CONSTRAINT "dispatch_item_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "public"."dispatch_order"("dispatch_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatch_item" ADD CONSTRAINT "dispatch_item_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dispatch_item" ADD CONSTRAINT "dispatch_item_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;
