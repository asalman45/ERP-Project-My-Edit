// src/services/goodsReceipt.service.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * GRN (Goods Receipt Note) Service
 * Handles receiving materials from Purchase Orders and updating inventory
 */

/**
 * Create a Goods Receipt Note from a Purchase Order
 * @param {Object} grnData - GRN creation data
 * @param {string} grnData.po_id - Purchase Order ID
 * @param {string} grnData.supplier_id - Supplier ID
 * @param {string} grnData.received_by - User who received the materials
 * @param {string} grnData.location_id - Storage location ID
 * @param {string} grnData.notes - Optional notes
 * @param {Array} grnData.items - Array of items received
 * @returns {Promise<Object>} Created GRN with items
 */
export async function createGoodsReceipt(grnData) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    const { po_id, supplier_id, received_by, location_id, notes, items } = grnData;

    // Generate GRN number
    const grnNo = `GRN-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // 1. Create GRN header
    const grnQuery = `
      INSERT INTO goods_receipt (
        grn_id, grn_no, po_id, supplier_id, received_date, 
        received_by, location_id, notes, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP, 
        $4, $5, $6, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const grnResult = await client.query(grnQuery, [
      grnNo, po_id, supplier_id, received_by, location_id, notes
    ]);

    const grn = grnResult.rows[0];
    logger.info({ grn_id: grn.grn_id, grn_no: grnNo }, 'GRN created');

    // 2. Create GRN items and update inventory
    const grnItems = [];
    for (const item of items) {
      const { po_item_id, material_id, qty_received, uom_id, batch_no } = item;

      // Insert GRN item
      const grnItemQuery = `
        INSERT INTO goods_receipt_item (
          gri_id, grn_id, po_item_id, material_id, qty_received, uom_id
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5
        ) RETURNING *
      `;

      const grnItemResult = await client.query(grnItemQuery, [
        grn.grn_id, po_item_id, material_id, qty_received, uom_id
      ]);

      grnItems.push(grnItemResult.rows[0]);

      // 3. Update or create inventory record
      const inventoryCheckQuery = `
        SELECT inventory_id, quantity 
        FROM inventory 
        WHERE material_id = $1 
          AND location_id = $2 
          AND status = 'AVAILABLE'
      `;
      const inventoryCheck = await client.query(inventoryCheckQuery, [material_id, location_id]);

      if (inventoryCheck.rows.length > 0) {
        // Update existing inventory
        const updateInventoryQuery = `
          UPDATE inventory 
          SET quantity = quantity + $1, 
              updated_at = CURRENT_TIMESTAMP
          WHERE material_id = $2 
            AND location_id = $3 
            AND status = 'AVAILABLE'
          RETURNING *
        `;
        await client.query(updateInventoryQuery, [qty_received, material_id, location_id]);
        logger.info({ material_id, qty_received }, 'Inventory updated (added to existing)');
      } else {
        // Create new inventory record
        const insertInventoryQuery = `
          INSERT INTO inventory (
            inventory_id, material_id, location_id, quantity, 
            uom_id, status, updated_at, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, 'AVAILABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING *
        `;
        await client.query(insertInventoryQuery, [material_id, location_id, qty_received, uom_id]);
        logger.info({ material_id, qty_received }, 'New inventory record created');
      }

      // 4. Create inventory transaction record
      const inventoryTxnQuery = `
        INSERT INTO inventory_txn (
          txn_id, material_id, txn_type, quantity, location_id, 
          reference, created_at
        ) VALUES (
          gen_random_uuid(), $1, 'RECEIVE', $2, $3, $4, CURRENT_TIMESTAMP
        )
      `;
      await client.query(inventoryTxnQuery, [
        material_id, 
        qty_received, 
        location_id, 
        `GRN ${grnNo} - PO ${po_id} - Batch: ${batch_no || 'N/A'}`
      ]);

      // 5. Update PO item received quantity
      if (po_item_id) {
        const updatePOItemQuery = `
          UPDATE purchase_order_item 
          SET received_qty = COALESCE(received_qty, 0) + $1
          WHERE po_item_id = $2
        `;
        await client.query(updatePOItemQuery, [qty_received, po_item_id]);
      }
    }

    // 6. Update Purchase Order status if all items received
    if (po_id) {
      const checkPOQuery = `
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN received_qty >= quantity THEN 1 END) as received_items
        FROM purchase_order_item
        WHERE po_id = $1
      `;
      const poCheck = await client.query(checkPOQuery, [po_id]);
      const { total_items, received_items } = poCheck.rows[0];

      if (parseInt(total_items) === parseInt(received_items)) {
        // All items received - mark PO as RECEIVED
        await client.query(
          `UPDATE purchase_order SET status = 'RECEIVED' WHERE po_id = $1`,
          [po_id]
        );
        logger.info({ po_id }, 'Purchase Order marked as RECEIVED');

        // Also update procurement request status to FULFILLED
        const updateProcurementQuery = `
          UPDATE procurement_request 
          SET status = 'FULFILLED', updated_at = CURRENT_TIMESTAMP
          WHERE reference_po IN (
            SELECT po_no FROM purchase_order WHERE po_id = $1
          )
        `;
        await client.query(updateProcurementQuery, [po_id]);
        logger.info({ po_id }, 'Procurement requests marked as FULFILLED');
      } else {
        // Partially received
        await client.query(
          `UPDATE purchase_order SET status = 'PARTIALLY_RECEIVED' WHERE po_id = $1`,
          [po_id]
        );
        logger.info({ po_id }, 'Purchase Order marked as PARTIALLY_RECEIVED');
      }
    }

    await client.query('COMMIT');

    logger.info({ grn_id: grn.grn_id, items_count: grnItems.length }, 'GRN completed successfully');

    return {
      ...grn,
      items: grnItems
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, grnData }, 'Error creating goods receipt');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all Goods Receipts with filters
 */
export async function getAllGoodsReceipts(filters = {}) {
  try {
    const { limit = 100, offset = 0, status, supplier_id, from_date, to_date } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (supplier_id) {
      paramCount++;
      whereClause += ` AND gr.supplier_id = $${paramCount}`;
      params.push(supplier_id);
    }

    if (from_date) {
      paramCount++;
      whereClause += ` AND gr.received_date >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      whereClause += ` AND gr.received_date <= $${paramCount}`;
      params.push(to_date);
    }

    const query = `
      SELECT 
        gr.*,
        po.po_no,
        s.name as supplier_name,
        l.name as location_name,
        COUNT(gri.gri_id) as items_count,
        SUM(gri.qty_received) as total_qty_received
      FROM goods_receipt gr
      LEFT JOIN purchase_order po ON gr.po_id = po.po_id
      LEFT JOIN supplier s ON gr.supplier_id = s.supplier_id
      LEFT JOIN location l ON gr.location_id = l.location_id
      LEFT JOIN goods_receipt_item gri ON gr.grn_id = gri.grn_id
      ${whereClause}
      GROUP BY gr.grn_id, po.po_no, s.name, l.name
      ORDER BY gr.received_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const result = await db.query(query, [...params, limit, offset]);
    return result.rows;

  } catch (error) {
    logger.error({ error, filters }, 'Error fetching goods receipts');
    throw error;
  }
}

/**
 * Get Goods Receipt by ID with items
 */
export async function getGoodsReceiptById(grnId) {
  try {
    const grnQuery = `
      SELECT 
        gr.*,
        po.po_no,
        s.name as supplier_name,
        l.name as location_name
      FROM goods_receipt gr
      LEFT JOIN purchase_order po ON gr.po_id = po.po_id
      LEFT JOIN supplier s ON gr.supplier_id = s.supplier_id
      LEFT JOIN location l ON gr.location_id = l.location_id
      WHERE gr.grn_id = $1
    `;

    const grnResult = await db.query(grnQuery, [grnId]);

    if (grnResult.rows.length === 0) {
      return null;
    }

    const grn = grnResult.rows[0];

    // Get GRN items
    const itemsQuery = `
      SELECT 
        gri.*,
        m.name as material_name,
        m.material_code,
        u.code as uom_code
      FROM goods_receipt_item gri
      LEFT JOIN material m ON gri.material_id = m.material_id
      LEFT JOIN uom u ON gri.uom_id = u.uom_id
      WHERE gri.grn_id = $1
    `;

    const itemsResult = await db.query(itemsQuery, [grnId]);

    return {
      ...grn,
      items: itemsResult.rows
    };

  } catch (error) {
    logger.error({ error, grnId }, 'Error fetching goods receipt by ID');
    throw error;
  }
}

/**
 * Get stock-in records (for Stock-In page)
 */
export async function getStockInRecords(filters = {}) {
  try {
    const { limit = 100, offset = 0, material_id, location_id, from_date, to_date } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (material_id) {
      paramCount++;
      whereClause += ` AND gr.material_id = $${paramCount}`;
      params.push(material_id);
    }

    if (location_id) {
      paramCount++;
      whereClause += ` AND gr.location_id = $${paramCount}`;
      params.push(location_id);
    }

    if (from_date) {
      paramCount++;
      whereClause += ` AND gr.received_date >= $${paramCount}`;
      params.push(from_date);
    }

    if (to_date) {
      paramCount++;
      whereClause += ` AND gr.received_date <= $${paramCount}`;
      params.push(to_date);
    }

    const query = `
      SELECT 
        gri.gri_id as stock_in_id,
        m.material_id,
        m.name as material_name,
        m.material_code,
        gri.qty_received as quantity,
        u.code as unit,
        l.name as location,
        s.name as supplier,
        po.po_no as purchase_order_ref,
        poi.unit_price as cost_per_unit,
        (gri.qty_received * COALESCE(poi.unit_price, 0)) as total_cost,
        gr.received_date,
        gr.received_by,
        CASE 
          WHEN po.status = 'RECEIVED' THEN 'COMPLETED'
          WHEN po.status = 'PARTIALLY_RECEIVED' THEN 'PARTIAL'
          ELSE 'PENDING'
        END as status,
        gr.grn_no
      FROM goods_receipt_item gri
      INNER JOIN goods_receipt gr ON gri.grn_id = gr.grn_id
      LEFT JOIN material m ON gri.material_id = m.material_id
      LEFT JOIN uom u ON gri.uom_id = u.uom_id
      LEFT JOIN location l ON gr.location_id = l.location_id
      LEFT JOIN supplier s ON gr.supplier_id = s.supplier_id
      LEFT JOIN purchase_order po ON gr.po_id = po.po_id
      LEFT JOIN purchase_order_item poi ON gri.po_item_id = poi.po_item_id
      ${whereClause}
      ORDER BY gr.received_date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const result = await db.query(query, [...params, limit, offset]);
    return result.rows;

  } catch (error) {
    logger.error({ error, filters }, 'Error fetching stock-in records');
    throw error;
  }
}

export default {
  createGoodsReceipt,
  getAllGoodsReceipts,
  getGoodsReceiptById,
  getStockInRecords
};

