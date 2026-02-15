-- AlterTable
ALTER TABLE "public"."inventory_txn" ADD COLUMN     "procurement_request_id" TEXT;

-- AlterTable
ALTER TABLE "public"."procurement_request" ADD COLUMN     "rejection_reason" TEXT;

-- AddForeignKey
ALTER TABLE "public"."inventory_txn" ADD CONSTRAINT "inventory_txn_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "public"."procurement_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;
