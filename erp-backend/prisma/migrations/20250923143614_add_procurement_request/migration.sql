-- AlterTable
ALTER TABLE "public"."inventory_txn" ADD COLUMN     "procurement_request_id" TEXT;

-- CreateTable
CREATE TABLE "public"."raw_material" (
    "raw_material_id" TEXT NOT NULL,
    "material_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "uom_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_material_pkey" PRIMARY KEY ("raw_material_id")
);

-- CreateTable
CREATE TABLE "public"."procurement_request" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "received_by" TEXT,
    "notes" TEXT,
    "reference_po" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_material_material_code_key" ON "public"."raw_material"("material_code");

-- CreateIndex
CREATE INDEX "raw_material_material_code_idx" ON "public"."raw_material"("material_code");

-- AddForeignKey
ALTER TABLE "public"."raw_material" ADD CONSTRAINT "raw_material_material_code_fkey" FOREIGN KEY ("material_code") REFERENCES "public"."material"("material_code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."raw_material" ADD CONSTRAINT "raw_material_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "public"."uom"("uom_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_txn" ADD CONSTRAINT "inventory_txn_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "public"."procurement_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."procurement_request" ADD CONSTRAINT "procurement_request_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."material"("material_id") ON DELETE RESTRICT ON UPDATE CASCADE;
