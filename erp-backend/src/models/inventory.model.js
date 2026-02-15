// src/models/inventory.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0, product_id, material_id, location_id } = opts;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramCount = 0;

  if (product_id) {
    paramCount++;
    whereClause += ` AND i.product_id = $${paramCount}`;
    params.push(product_id);
  }
  if (material_id) {
    paramCount++;
    whereClause += ` AND i.material_id = $${paramCount}`;
    params.push(material_id);
  }
  if (location_id) {
    paramCount++;
    whereClause += ` AND i.location_id = $${paramCount}`;
    params.push(location_id);
  }

  const res = await db.query(
    `SELECT i.*, 
            p.product_code, p.part_name as product_name,
            m.material_code, m.name as material_name,
            l.code as location_code, l.name as location_name,
            u.code as uom_code, u.name as uom_name
     FROM inventory i
     LEFT JOIN product p ON i.product_id = p.product_id
     LEFT JOIN material m ON i.material_id = m.material_id
     LEFT JOIN location l ON i.location_id = l.location_id
     LEFT JOIN uom u ON i.uom_id = u.uom_id
     ${whereClause}
     ORDER BY i.updated_at DESC
     LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    [...params, limit, offset]
  );
  return res.rows;
};

export const findById = async (inventoryId) => {
  const res = await db.query(
    `SELECT i.*, 
            p.product_code, p.part_name as product_name,
            m.material_code, m.name as material_name,
            l.code as location_code, l.name as location_name,
            u.code as uom_code, u.name as uom_name
     FROM inventory i
     LEFT JOIN product p ON i.product_id = p.product_id
     LEFT JOIN material m ON i.material_id = m.material_id
     LEFT JOIN location l ON i.location_id = l.location_id
     LEFT JOIN uom u ON i.uom_id = u.uom_id
     WHERE i.inventory_id = $1`,
    [inventoryId]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const {
    product_id, material_id, quantity, location_id, batch_no, uom_id, status
  } = payload;
  const res = await db.query(
    `INSERT INTO inventory (product_id, material_id, quantity, location_id, batch_no, uom_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [product_id, material_id, quantity, location_id, batch_no, uom_id, status]
  );
  return res.rows[0];
};

export const update = async (inventoryId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(inventoryId);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [inventoryId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE inventory SET ${setParts} WHERE inventory_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (inventoryId) => {
  await db.query('DELETE FROM inventory WHERE inventory_id = $1', [inventoryId]);
  return true;
};
