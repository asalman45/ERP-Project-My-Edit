// src/models/material.model.js
import db from '../utils/db.js';

export const findAll = async (opts = {}) => {
  const { limit = 100, offset = 0 } = opts;
  const res = await db.query(
    `SELECT m.*, u.code as uom_code, u.name as uom_name
     FROM material m
     LEFT JOIN uom u ON m.uom_id = u.uom_id
     ORDER BY m.material_id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return res.rows;
};

export const findById = async (materialId) => {
  const res = await db.query(
    `SELECT m.*, u.code as uom_code, u.name as uom_name
     FROM material m
     LEFT JOIN uom u ON m.uom_id = u.uom_id
     WHERE m.material_id = $1`,
    [materialId]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const {
    material_code, name, category, uom_id
  } = payload;
  const res = await db.query(
    `INSERT INTO material (material_id, material_code, name, category, uom_id)
     VALUES (gen_random_uuid(), $1, $2, $3, $4)
     RETURNING *`,
    [material_code, name, category, uom_id]
  );
  return res.rows[0];
};

export const update = async (materialId, payload) => {
  // simple patch: build dynamic SET
  const keys = Object.keys(payload);
  if (!keys.length) return findById(materialId);

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [materialId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE material SET ${setParts} WHERE material_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (materialId) => {
  await db.query('DELETE FROM material WHERE material_id = $1', [materialId]);
  return true;
};
