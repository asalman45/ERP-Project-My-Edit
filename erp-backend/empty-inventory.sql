-- Script to empty all inventory and clear material information
-- WARNING: This will set all inventory quantities to 0, clear material references, and delete orphaned records
-- Run this script at your own risk!

BEGIN;

-- Set all inventory quantities to 0
UPDATE inventory 
SET quantity = 0, 
    updated_at = CURRENT_TIMESTAMP;

-- Clear material information from inventory
UPDATE inventory 
SET material_id = NULL, 
    batch_no = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE material_id IS NOT NULL;

-- Delete orphaned inventory records (no material_id and no product_id)
DELETE FROM inventory 
WHERE material_id IS NULL AND product_id IS NULL;

-- Optional: Clear inventory transaction history (uncomment if needed)
-- DELETE FROM inventory_txn;

-- Optional: Clear scrap inventory (uncomment if needed)
-- UPDATE scrap_inventory SET weight_kg = 0, status = 'CONSUMED';

COMMIT;

-- Verify the changes
SELECT 
    COUNT(*) as total_inventory_records, 
    SUM(quantity) as total_quantity,
    COUNT(material_id) as records_with_materials,
    COUNT(product_id) as records_with_products
FROM inventory;

