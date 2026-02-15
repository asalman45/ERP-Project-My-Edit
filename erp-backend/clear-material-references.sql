-- Clear references for raw material deletion
-- Material ID: 1c485b6a-baba-46b8-aa94-126749d73f56

BEGIN;

-- Clear inventory references
UPDATE inventory
SET material_id = NULL, updated_at = CURRENT_TIMESTAMP
WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56';

-- Delete purchase order items references
DELETE FROM purchase_order_item
WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56';

-- Delete internal purchase order items references
DELETE FROM internal_purchase_order_item
WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56';

-- Delete procurement request references
DELETE FROM procurement_request
WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56';

-- Delete goods receipt items references
DELETE FROM goods_receipt_item
WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56';

COMMIT;

-- Verify remaining references
SELECT 'inventory' as table_name, COUNT(*) as count FROM inventory WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56'
UNION ALL
SELECT 'purchase_order_item', COUNT(*) FROM purchase_order_item WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56'
UNION ALL
SELECT 'internal_purchase_order_item', COUNT(*) FROM internal_purchase_order_item WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56'
UNION ALL
SELECT 'procurement_request', COUNT(*) FROM procurement_request WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56'
UNION ALL
SELECT 'goods_receipt_item', COUNT(*) FROM goods_receipt_item WHERE material_id = '1c485b6a-baba-46b8-aa94-126749d73f56';

