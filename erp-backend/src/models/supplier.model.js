// src/models/supplier.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0 } = opts;
  const res = await db.query(
    `SELECT * FROM supplier
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (supplierId) => {
  const res = await db.query(
    'SELECT * FROM supplier WHERE supplier_id = $1',
    [supplierId]
  );
  return res.rows[0];
};

export const findByCode = async (supplierCode) => {
  const res = await db.query(
    'SELECT * FROM supplier WHERE code = $1',
    [supplierCode]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const { code, name, contact, phone, email, address, lead_time_days } = payload;
  const res = await db.query(
    `INSERT INTO supplier (supplier_id, code, name, contact, phone, email, address, lead_time_days)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [code, name, contact, phone, email, address, lead_time_days]
  );
  return res.rows[0];
};

export const update = async (supplierId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(supplierId);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [supplierId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE supplier SET ${setParts} WHERE supplier_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (supplierId) => {
  await db.query('DELETE FROM supplier WHERE supplier_id = $1', [supplierId]);
  return true;
};
