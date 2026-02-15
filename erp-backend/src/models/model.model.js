// src/models/model.model.js
import db from '../utils/db.js';

export const findAll = async () => {
  const res = await db.query(
    `SELECT m.*, o.oem_name 
     FROM model m
     JOIN oem o ON m.oem_id = o.oem_id
     ORDER BY m.created_at DESC`
  );
  return res.rows;
};

export const findById = async (id) => {
  const res = await db.query(
    `SELECT m.*, o.oem_name
     FROM model m
     JOIN oem o ON m.oem_id = o.oem_id
     WHERE m.model_id = $1`,
    [id]
  );
  return res.rows[0];
};

export const findByOEM = async (oemId) => {
  const res = await db.query(
    'SELECT * FROM model WHERE oem_id = $1 ORDER BY model_name',
    [oemId]
  );
  return res.rows;
};

export const create = async (payload) => {
  const { oem_id, model_name, model_year } = payload;
  const res = await db.query(
    `INSERT INTO model (model_id, oem_id, model_name, model_year) 
     VALUES (gen_random_uuid(), $1, $2, $3) RETURNING *`,
    [oem_id, model_name, model_year]
  );
  return res.rows[0];
};

export const update = async (id, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(id);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [id, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE model SET ${setParts} WHERE model_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (id) => {
  await db.query('DELETE FROM model WHERE model_id = $1', [id]);
  return true;
};
