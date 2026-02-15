// src/models/product.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0 } = opts;
  const res = await db.query(
    `SELECT p.*, o.oem_name, m.model_name, u.code as uom_code, u.name as uom_name
     FROM product p
     LEFT JOIN oem o ON p.oem_id = o.oem_id
     LEFT JOIN model m ON p.model_id = m.model_id
     LEFT JOIN uom u ON p.uom_id = u.uom_id
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (productId) => {
  const res = await db.query(
    `SELECT p.*, o.oem_name, m.model_name, u.code as uom_code, u.name as uom_name
     FROM product p
     LEFT JOIN oem o ON p.oem_id = o.oem_id
     LEFT JOIN model m ON p.model_id = m.model_id
     LEFT JOIN uom u ON p.uom_id = u.uom_id
     WHERE p.product_id = $1`,
    [productId]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const {
    product_code, part_name, oem_id, model_id, uom_id, standard_cost, category
  } = payload;
  const res = await db.query(
    `INSERT INTO product (product_id, product_code, part_name, oem_id, model_id, uom_id, standard_cost, category)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [product_code, part_name, oem_id, model_id, uom_id, standard_cost, category]
  );
  return res.rows[0];
};

export const update = async (productId, payload) => {
  // simple patch: build dynamic SET
  const keys = Object.keys(payload);
  if (!keys.length) return findById(productId);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [productId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE product SET ${setParts} WHERE product_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (productId) => {
  await db.query('DELETE FROM product WHERE product_id = $1', [productId]);
  return true;
};
