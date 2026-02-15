// src/models/work_order_step.model.js
import db from '../utils/db.js';

export const findByWOId = async (woId) => {
  const res = await db.query(
    `SELECT wos.*, r.operation as routing_operation, r.work_center as routing_work_center, r.duration as routing_duration
     FROM work_order_step wos
     LEFT JOIN routing r ON wos.routing_id = r.routing_id
     WHERE wos.wo_id = $1
     ORDER BY wos.step_no`,
    [woId]
  );
  return res.rows;
};

export const create = async (payload) => {
  const { wo_id, step_no, routing_id, operation, work_center, assigned_to, planned_qty, start_time, end_time, status, remarks } = payload;
  const res = await db.query(
    `INSERT INTO work_order_step (wo_id, step_no, routing_id, operation, work_center, assigned_to, planned_qty, start_time, end_time, status, remarks)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [wo_id, step_no, routing_id, operation, work_center, assigned_to, planned_qty, start_time, end_time, status, remarks]
  );
  return res.rows[0];
};

export const update = async (stepId, payload) => {
  const keys = Object.keys(payload);
  if (!keys.length) return null;

  const setParts = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
  const values = [stepId, ...keys.map(k => payload[k])];

  const res = await db.query(
    `UPDATE work_order_step SET ${setParts} WHERE step_id = $1 RETURNING *`,
    values
  );
  return res.rows[0];
};

export const remove = async (stepId) => {
  await db.query('DELETE FROM work_order_step WHERE step_id = $1', [stepId]);
  return true;
};
