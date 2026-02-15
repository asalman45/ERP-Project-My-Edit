// src/models/oem.model.js
import db from '../utils/db.js';

export const findAll = async () => {
  const res = await db.query('SELECT * FROM oem ORDER BY created_at DESC');
  return res.rows;
};

export const findById = async (id) => {
  const res = await db.query('SELECT * FROM oem WHERE oem_id = $1', [id]);
  return res.rows[0];
};

export const create = async (payload) => {
  const { oem_name } = payload;
  const res = await db.query(
    'INSERT INTO oem (oem_id, oem_name) VALUES (gen_random_uuid(), $1) RETURNING *',
    [oem_name]
  );
  return res.rows[0];
};

export const update = async (id, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(id);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [id, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE oem SET ${setParts} WHERE oem_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (id) => {
  await db.query('DELETE FROM oem WHERE oem_id = $1', [id]);
  return true;
};
