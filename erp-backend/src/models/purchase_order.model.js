// src/models/purchase_order.model.js
import db from '../utils/db.js';
import crypto from 'crypto';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0, supplier_id, status } = opts;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 0;

  if (supplier_id) {
    paramCount++;
    whereClause += ` AND po.supplier_id = $${paramCount}`;
    params.push(supplier_id);
  }
  if (status) {
    paramCount++;
    whereClause += ` AND po.status = $${paramCount}`;
    params.push(status);
  }

  const res = await db.query(
    `SELECT po.*, 
            s.code as supplier_code, 
            s.name as supplier_name,
            COALESCE(SUM(poi.quantity * poi.unit_price), 0) as total_amount
     FROM purchase_order po
     JOIN supplier s ON po.supplier_id = s.supplier_id
     LEFT JOIN purchase_order_item poi ON po.po_id = poi.po_id
     ${whereClause}
     GROUP BY po.po_id, s.code, s.name
     ORDER BY po.created_at DESC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    [...params, limit, offset]
  );
  return res.rows;
};

export const findById = async (poId) => {
  const res = await db.query(
    `SELECT po.*, 
            s.code as supplier_code, 
            s.name as supplier_name,
            COALESCE(SUM(poi.quantity * poi.unit_price), 0) as total_amount
     FROM purchase_order po
     JOIN supplier s ON po.supplier_id = s.supplier_id
     LEFT JOIN purchase_order_item poi ON po.po_id = poi.po_id
     WHERE po.po_id = $1
     GROUP BY po.po_id, s.code, s.name`,
    [poId]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const { po_no, supplier_id, order_date, expected_date, status, created_by } = payload;
  const po_id = crypto.randomUUID();
  const res = await db.query(
    `INSERT INTO purchase_order (po_id, po_no, supplier_id, order_date, expected_date, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [po_id, po_no, supplier_id, order_date, expected_date, status, created_by]
  );
  return res.rows[0];
};

export const update = async (poId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(poId);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [poId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE purchase_order SET ${setParts} WHERE po_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (poId) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // First, delete all purchase order items
    await client.query('DELETE FROM purchase_order_item WHERE po_id = $1', [poId]);
    
    // Then delete the purchase order
    const result = await client.query('DELETE FROM purchase_order WHERE po_id = $1 RETURNING *', [poId]);
    
    if (result.rows.length === 0) {
      throw new Error('Purchase order not found');
    }
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
