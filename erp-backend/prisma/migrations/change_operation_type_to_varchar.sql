-- Migration: Change operation_type from enum to VARCHAR
-- Date: 2025-11-03
-- Description: Allow any operation type name instead of restricting to enum values

-- Change operation_type column from enum to VARCHAR
ALTER TABLE "work_order" 
  ALTER COLUMN "operation_type" TYPE VARCHAR(255) USING operation_type::text;

-- Add comment
COMMENT ON COLUMN "work_order"."operation_type" IS 'Type of operation: Can be any operation name from process flow (e.g., "BLANKING OF HOOK", "CUTTING", "FORMING", etc.)';

