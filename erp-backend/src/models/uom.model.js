// src/models/uom.model.js
import db from '../utils/db.js';

export const findAll = async () => {
  const res = await db.query('SELECT * FROM uom ORDER BY code ASC');
  return res.rows;
};

export const findById = async (id) => {
  const res = await db.query('SELECT * FROM uom WHERE uom_id = $1', [id]);
  return res.rows[0];
};

export const create = async (payload) => {
  const { code, name } = payload;
  const res = await db.query(
    'INSERT INTO uom (uom_id, code, name) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
    [code, name]
  );
  return res.rows[0];
};

export const update = async (id, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(id);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [id, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE uom SET ${setParts} WHERE uom_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (id) => {
  await db.query('DELETE FROM uom WHERE uom_id = $1', [id]);
  return true;
};
