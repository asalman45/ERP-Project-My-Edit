// src/models/location.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0 } = opts;
  const res = await db.query(
    `SELECT * FROM location
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (locationId) => {
  const res = await db.query(
    'SELECT * FROM location WHERE location_id = $1',
    [locationId]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const { code, name, type } = payload;
  const res = await db.query(
    `INSERT INTO location (code, name, type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [code, name, type]
  );
  return res.rows[0];
};

export const update = async (locationId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return findById(locationId);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [locationId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE location SET ${setParts} WHERE location_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (locationId) => {
  await db.query('DELETE FROM location WHERE location_id = $1', [locationId]);
  return true;
};
