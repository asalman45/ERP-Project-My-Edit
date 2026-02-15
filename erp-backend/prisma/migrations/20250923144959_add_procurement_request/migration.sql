/*
  Warnings:

  - You are about to drop the column `procurement_request_id` on the `inventory_txn` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."inventory_txn" DROP CONSTRAINT "inventory_txn_procurement_request_id_fkey";

-- AlterTable
ALTER TABLE "public"."inventory_txn" DROP COLUMN "procurement_request_id";
