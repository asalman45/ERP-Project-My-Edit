// src/models/purchase_order_item.model.js
import db from '../utils/db.js';
import crypto from 'crypto';

export const findByPOId = async (poId) => {
  const res = await db.query(
    `SELECT poi.*, 
            p.product_code, p.part_name as product_name,
            m.material_code, m.name as material_name,
            u.code as uom_code, u.name as uom_name
     FROM purchase_order_item poi
     LEFT JOIN product p ON poi.product_id = p.product_id
     LEFT JOIN material m ON poi.material_id = m.material_id
     LEFT JOIN uom u ON poi.uom_id = u.uom_id
     WHERE poi.po_id = $1
     ORDER BY poi.po_item_id`,
    [poId]
  );
  return res.rows;
};

export const create = async (payload) => {
  const { po_id, product_id, material_id, uom_id, quantity, unit_price } = payload;
  const po_item_id = crypto.randomUUID();
  const res = await db.query(
    `INSERT INTO purchase_order_item (po_item_id, po_id, product_id, material_id, uom_id, quantity, unit_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [po_item_id, po_id, product_id, material_id, uom_id, quantity, unit_price]
  );
  return res.rows[0];
};

export const update = async (poItemId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return null;

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [poItemId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE purchase_order_item SET ${setParts} WHERE po_item_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (poItemId) => {
  await db.query('DELETE FROM purchase_order_item WHERE po_item_id = $1', [poItemId]);
  return true;
};
