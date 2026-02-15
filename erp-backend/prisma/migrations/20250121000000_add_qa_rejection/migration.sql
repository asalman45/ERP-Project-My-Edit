-- CreateTable
CREATE TABLE "public"."qa_rejection" (
    "rejection_id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "rejection_reason" TEXT NOT NULL,
    "disposition" TEXT NOT NULL,
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "root_cause" TEXT,
    "corrective_action" TEXT,
    "rework_wo_id" TEXT,
    "scrap_id" TEXT,
    "disposal_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qa_rejection_pkey" PRIMARY KEY ("rejection_id")
);

-- CreateIndex
CREATE INDEX "qa_rejection_inventory_id_idx" ON "public"."qa_rejection"("inventory_id");

-- CreateIndex
CREATE INDEX "qa_rejection_product_id_idx" ON "public"."qa_rejection"("product_id");

-- CreateIndex
CREATE INDEX "qa_rejection_disposition_idx" ON "public"."qa_rejection"("disposition");

-- CreateIndex
CREATE INDEX "qa_rejection_rejected_at_idx" ON "public"."qa_rejection"("rejected_at");

-- AddForeignKey
ALTER TABLE "public"."qa_rejection" ADD CONSTRAINT "qa_rejection_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("inventory_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."qa_rejection" ADD CONSTRAINT "qa_rejection_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."qa_rejection" ADD CONSTRAINT "qa_rejection_rework_wo_id_fkey" FOREIGN KEY ("rework_wo_id") REFERENCES "public"."work_order"("wo_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."qa_rejection" ADD CONSTRAINT "qa_rejection_scrap_id_fkey" FOREIGN KEY ("scrap_id") REFERENCES "public"."scrap_inventory"("scrap_id") ON DELETE SET NULL ON UPDATE CASCADE;

