// src/models/internalPurchaseOrder.model.js
// Model for Internal Purchase Orders

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

export const createInternalPO = async (ipoData) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const {
      po_number,
      supplier_id,
      supplier_name,
      contact_person,
      contact_phone,
      supplier_address,
      supplier_email,
      supplier_ntn,
      supplier_strn,
      order_date,
      expected_date,
      notes,
      items = [],
      created_by = 'system'
    } = ipoData;

    // Insert IPO record
    const ipoQuery = `
      INSERT INTO internal_purchase_order (
        ipo_id, po_number, supplier_id, supplier_name, contact_person,
        contact_phone, supplier_address, supplier_email, supplier_ntn,
        supplier_strn, order_date, expected_date, notes, status,
        created_by, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP
      ) RETURNING *
    `;

    const ipoResult = await client.query(ipoQuery, [
      po_number, supplier_id, supplier_name, contact_person, contact_phone,
      supplier_address, supplier_email, supplier_ntn, supplier_strn,
      order_date, expected_date, notes, 'PENDING', created_by
    ]);

    const ipo = ipoResult.rows[0];

    // Insert IPO items
    const itemPromises = items.map(item => {
      const itemQuery = `
        INSERT INTO internal_purchase_order_item (
          ipo_item_id, ipo_id, material_id, item_name, description, quantity,
          unit_price, total_amount, uom_id, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
        ) RETURNING *
      `;
      
      return client.query(itemQuery, [
        ipo.ipo_id,
        item.material_id || null,
        item.item_name,
        item.description || '',
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
        item.uom_id || '88ed7640-5f9e-47c3-882c-a9bfbfbe0744' // Default to 'Pieces'
      ]);
    });

    const itemResults = await Promise.all(itemPromises);
    const ipoItems = itemResults.map(result => result.rows[0]);

    let linkedPurchaseOrder = null;

    if (supplier_id && ipoItems.some(item => item.material_id)) {
      try {
        const existingPO = await client.query(
          'SELECT po_id FROM purchase_order WHERE po_no = $1 LIMIT 1',
          [po_number]
        );

        if (existingPO.rows.length > 0) {
          linkedPurchaseOrder = existingPO.rows[0];
          await client.query('DELETE FROM purchase_order_item WHERE po_id = $1', [linkedPurchaseOrder.po_id]);
        } else {
          const poInsert = await client.query(
            `INSERT INTO purchase_order (
              po_id, po_no, supplier_id, order_date, expected_date, status, created_by, created_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, 'OPEN', $5, CURRENT_TIMESTAMP
            ) RETURNING *`,
            [
              po_number,
              supplier_id,
              order_date ? new Date(order_date) : new Date(),
              expected_date ? new Date(expected_date) : null,
              created_by
            ]
          );
          linkedPurchaseOrder = poInsert.rows[0];
        }

        if (linkedPurchaseOrder) {
          for (const item of ipoItems) {
            if (!item.material_id) {
              continue;
            }

            await client.query(
              `INSERT INTO purchase_order_item (
                po_item_id, po_id, material_id, quantity, received_qty, unit_price, uom_id, created_at
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, 0, $4, $5, CURRENT_TIMESTAMP
              )`,
              [
                linkedPurchaseOrder.po_id,
                item.material_id,
                item.quantity,
                item.unit_price,
                item.uom_id || null
              ]
            );
          }
        }
      } catch (syncError) {
        logger.error({
          error: syncError.message,
          po_number,
          supplier_id,
        }, 'Failed to synchronize internal PO with standard purchase_order');
      }
    } else {
      logger.warn({
        supplier_id,
        material_links: ipoItems.map(item => item.material_id),
      }, 'Skipping purchase_order synchronization due to missing supplier or material references');
    }

    await client.query('COMMIT');

    logger.info({
      ipo_id: ipo.ipo_id,
      po_number,
      supplier_name,
      items_count: items.length
    }, 'Internal Purchase Order created successfully');

    return {
      ...ipo,
      items: ipoItems,
      linked_po_id: linkedPurchaseOrder?.po_id || null
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, ipoData }, 'Failed to create Internal Purchase Order');
    throw error;
  } finally {
    client.release();
  }
};

export const findInternalPOById = async (ipoId) => {
  try {
    const query = `
      SELECT 
        ipo.*,
        s.name as supplier_company_name
      FROM internal_purchase_order ipo
      LEFT JOIN supplier s ON ipo.supplier_id = s.supplier_id
      WHERE ipo.ipo_id = $1
    `;
    
    const result = await db.query(query, [ipoId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const ipo = result.rows[0];

    // Get IPO items
    const itemsQuery = `
      SELECT 
        ipoi.*,
        u.name as uom_name
      FROM internal_purchase_order_item ipoi
      LEFT JOIN uom u ON ipoi.uom_id = u.uom_id
      WHERE ipoi.ipo_id = $1
      ORDER BY ipoi.created_at
    `;
    
    const itemsResult = await db.query(itemsQuery, [ipoId]);
    ipo.items = itemsResult.rows;

    return ipo;

  } catch (error) {
    logger.error({ error: error.message, ipoId }, 'Failed to find Internal Purchase Order by ID');
    throw error;
  }
};

export const findInternalPOByNumber = async (poNumber) => {
  try {
    const query = `
      SELECT 
        ipo.*,
        s.name as supplier_company_name
      FROM internal_purchase_order ipo
      LEFT JOIN supplier s ON ipo.supplier_id = s.supplier_id
      WHERE ipo.po_number = $1
    `;
    
    const result = await db.query(query, [poNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const ipo = result.rows[0];

    // Get IPO items
    const itemsQuery = `
      SELECT 
        ipoi.*,
        u.name as uom_name
      FROM internal_purchase_order_item ipoi
      LEFT JOIN uom u ON ipoi.uom_id = u.uom_id
      WHERE ipoi.ipo_id = $1
      ORDER BY ipoi.created_at
    `;
    
    const itemsResult = await db.query(itemsQuery, [ipo.ipo_id]);
    ipo.items = itemsResult.rows;

    return ipo;

  } catch (error) {
    logger.error({ error: error.message, poNumber }, 'Failed to find Internal Purchase Order by number');
    throw error;
  }
};

export const findAllInternalPOs = async (filters = {}) => {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      supplier_id,
      start_date,
      end_date,
      search
    } = filters;

    let query = `
      SELECT 
        ipo.*,
        s.name as supplier_company_name,
        COALESCE(COUNT(ipo_items.ipo_item_id), 0)::INTEGER as items_count,
        COALESCE(SUM(ipo_items.total_amount), 0)::NUMERIC as total_amount
      FROM internal_purchase_order ipo
      LEFT JOIN supplier s ON ipo.supplier_id = s.supplier_id
      LEFT JOIN internal_purchase_order_item ipo_items ON ipo.ipo_id = ipo_items.ipo_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND ipo.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (supplier_id) {
      paramCount++;
      query += ` AND ipo.supplier_id = $${paramCount}`;
      queryParams.push(supplier_id);
    }

    if (start_date) {
      paramCount++;
      query += ` AND ipo.order_date >= $${paramCount}`;
      queryParams.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND ipo.order_date <= $${paramCount}`;
      queryParams.push(end_date);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        ipo.po_number ILIKE $${paramCount} OR 
        ipo.supplier_name ILIKE $${paramCount} OR 
        ipo.contact_person ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
    }

    query += `
      GROUP BY ipo.ipo_id, s.name
      ORDER BY ipo.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    
    return result.rows;

  } catch (error) {
    logger.error({ error: error.message, filters }, 'Failed to find Internal Purchase Orders');
    throw error;
  }
};

export const updateInternalPOStatus = async (ipoId, status, updatedBy) => {
  try {
    const query = `
      UPDATE internal_purchase_order 
      SET status = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE ipo_id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [status, updatedBy || 'system', ipoId]);
    
    if (result.rows.length === 0) {
      throw new Error('Internal Purchase Order not found');
    }

    logger.info({
      ipo_id: ipoId,
      status,
      updated_by: updatedBy
    }, 'Internal Purchase Order status updated');

    return result.rows[0];

  } catch (error) {
    logger.error({ error: error.message, ipoId, status }, 'Failed to update Internal Purchase Order status');
    throw error;
  }
};

export const getInternalPOStats = async () => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(CASE WHEN total_amount IS NOT NULL THEN total_amount ELSE 0 END) as total_value
      FROM (
        SELECT 
          ipo.status,
          SUM(ipoi.total_amount) as total_amount
        FROM internal_purchase_order ipo
        LEFT JOIN internal_purchase_order_item ipoi ON ipo.ipo_id = ipoi.ipo_id
        GROUP BY ipo.ipo_id, ipo.status
      ) as ipo_stats
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const result = await db.query(query);
    
    const stats = {
      total_orders: 0,
      total_value: 0,
      by_status: {}
    };

    result.rows.forEach(row => {
      stats.by_status[row.status] = {
        count: parseInt(row.count),
        value: parseFloat(row.total_value) || 0
      };
      stats.total_orders += parseInt(row.count);
      stats.total_value += parseFloat(row.total_value) || 0;
    });

    return stats;

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get Internal Purchase Order stats');
    throw error;
  }
};

export const deleteInternalPO = async (ipoId) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Delete IPO items first
    await client.query('DELETE FROM internal_purchase_order_item WHERE ipo_id = $1', [ipoId]);
    
    // Delete IPO
    const result = await client.query('DELETE FROM internal_purchase_order WHERE ipo_id = $1 RETURNING *', [ipoId]);
    
    if (result.rows.length === 0) {
      throw new Error('Internal Purchase Order not found');
    }

    await client.query('COMMIT');

    logger.info({ ipo_id: ipoId }, 'Internal Purchase Order deleted');

    return result.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, ipoId }, 'Failed to delete Internal Purchase Order');
    throw error;
  } finally {
    client.release();
  }
};
