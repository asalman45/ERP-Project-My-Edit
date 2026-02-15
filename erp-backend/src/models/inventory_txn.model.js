// src/models/inventory_txn.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0, product_id, material_id, txn_type, wo_id, po_id } = opts;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 0;

  if (product_id) {
    paramCount++;
    whereClause += ` AND it.product_id = $${paramCount}`;
    params.push(product_id);
  }
  if (material_id) {
    paramCount++;
    whereClause += ` AND it.material_id = $${paramCount}`;
    params.push(material_id);
  }
  if (txn_type) {
    paramCount++;
    whereClause += ` AND it.txn_type = $${paramCount}`;
    params.push(txn_type);
  }
  if (wo_id) {
    paramCount++;
    whereClause += ` AND it.wo_id = $${paramCount}`;
    params.push(wo_id);
  }
  if (po_id) {
    paramCount++;
    whereClause += ` AND it.po_id = $${paramCount}`;
    params.push(po_id);
  }

  const res = await db.query(
    `SELECT it.*, 
            p.product_code, p.part_name as product_name,
            m.material_code, m.name as material_name,
            l.code as location_code, l.name as location_name,
            wo.wo_no, po.po_no
     FROM inventory_txn it
     LEFT JOIN product p ON it.product_id = p.product_id
     LEFT JOIN material m ON it.material_id = m.material_id
     LEFT JOIN location l ON it.location_id = l.location_id
     LEFT JOIN work_order wo ON it.wo_id = wo.wo_id
     LEFT JOIN purchase_order po ON it.po_id = po.po_id
     ${whereClause}
     ORDER BY it.created_at DESC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    [...params, limit, offset]
  );
  return res.rows;
};

export const create = async (payload) => {
  const {
    inventory_id, product_id, material_id, wo_id, po_id, txn_type, 
    quantity, location_id, batch_no, reference, created_by
  } = payload;
  const res = await db.query(
    `INSERT INTO inventory_txn (inventory_id, product_id, material_id, wo_id, po_id, txn_type, quantity, location_id, batch_no, reference, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [inventory_id, product_id, material_id, wo_id, po_id, txn_type, quantity, location_id, batch_no, reference, created_by]
  );
  return res.rows[0];
};

export const findByInventoryId = async (inventoryId) => {
  const res = await db.query(
    `SELECT it.*, 
            p.product_code, p.part_name as product_name,
            m.material_code, m.name as material_name,
            l.code as location_code, l.name as location_name,
            wo.wo_no, po.po_no
     FROM inventory_txn it
     LEFT JOIN product p ON it.product_id = p.product_id
     LEFT JOIN material m ON it.material_id = m.material_id
     LEFT JOIN location l ON it.location_id = l.location_id
     LEFT JOIN work_order wo ON it.wo_id = wo.wo_id
     LEFT JOIN purchase_order po ON it.po_id = po.po_id
     WHERE it.inventory_id = $1
     ORDER BY it.created_at DESC`,
    [inventoryId]
  );
  return res.rows;
};
