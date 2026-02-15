// src/models/routing.model.js
import db from '../utils/db.js';

export const findByProductId = async (productId, primaryOnly = false) => {
  let query = `
    SELECT r.*, p.part_name, p.product_code
    FROM routing r
    JOIN product p ON r.product_id = p.product_id
    WHERE r.product_id = $1
  `;
  
  const params = [productId];
  
  if (primaryOnly) {
    query += ` AND r.is_primary_path = true`;
  }
  
  query += ` ORDER BY r.step_no`;

  const res = await db.query(query, params);
  return res.rows;
};

export const findAlternativeFlows = async (productId) => {
  const res = await db.query(
    `SELECT r.*, p.part_name, p.product_code
     FROM routing r
     JOIN product p ON r.product_id = p.product_id
     WHERE r.product_id = $1 AND r.is_primary_path = false
     ORDER BY r.step_no`,
    [productId]
  );
  return res.rows;
};

export const findById = async (routingId) => {
  const res = await db.query(
    `SELECT r.*, p.part_name, p.product_code
     FROM routing r
     JOIN product p ON r.product_id = p.product_id
     WHERE r.routing_id = $1`,
    [routingId]
  );
  return res.rows[0];
};

export const create = async (payload) => {
  const {
    product_id,
    step_no,
    operation,
    work_center,
    duration,
    cost_rate,
    is_primary_path = true,
    alternative_path_id = null,
    description
  } = payload;

  const safeOperation = (operation ?? '').toString().trim();
  const safeWorkCenter = (work_center ?? '').toString();
  const safeDuration = Number.isFinite(Number(duration)) ? Number(duration) : 0;
  const safeCostRate = Number.isFinite(Number(cost_rate)) ? Number(cost_rate) : 0;

  const res = await db.query(
    `INSERT INTO routing (
      routing_id, product_id, step_no, operation, work_center, duration, cost_rate,
      is_primary_path, alternative_path_id, description, created_at, updated_at
    ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING *`,
    [
      product_id, step_no, safeOperation, safeWorkCenter, safeDuration, safeCostRate,
      is_primary_path, alternative_path_id, description
    ]
  );
  return res.rows[0];
};

export const update = async (routingId, payload) => {
  const {
    step_no,
    operation,
    work_center,
    duration,
    cost_rate,
    is_primary_path,
    alternative_path_id,
    description
  } = payload;

  const res = await db.query(
    `UPDATE routing SET 
      step_no = $2, operation = $3, work_center = $4, duration = $5, cost_rate = $6,
      is_primary_path = $7, alternative_path_id = $8, description = $9, updated_at = NOW()
     WHERE routing_id = $1
     RETURNING *`,
    [
      routingId, step_no, operation, work_center, duration, cost_rate,
      is_primary_path, alternative_path_id, description
    ]
  );
  return res.rows[0];
};

export const remove = async (routingId) => {
  await db.query('DELETE FROM routing WHERE routing_id = $1', [routingId]);
  return true;
};

export const removePrimaryByProductId = async (productId) => {
  await db.query('DELETE FROM routing WHERE product_id = $1 AND is_primary_path = true', [productId]);
  return true;
};

export const findByStepNumber = async (productId, stepNo) => {
  const res = await db.query(
    `SELECT r.*, p.part_name, p.product_code
     FROM routing r
     JOIN product p ON r.product_id = p.product_id
     WHERE r.product_id = $1 AND r.step_no = $2`,
    [productId, stepNo]
  );
  return res.rows[0];
};

export const getProcessFlowSummary = async (productId) => {
  const res = await db.query(
    `SELECT 
       COUNT(*) as total_steps,
       COUNT(CASE WHEN is_primary_path = true THEN 1 END) as primary_steps,
       COUNT(CASE WHEN is_primary_path = false THEN 1 END) as alternative_steps,
       SUM(duration) as total_duration,
       AVG(duration) as average_duration,
       SUM(cost_rate) as total_cost_rate,
       AVG(cost_rate) as average_cost_rate,
       COUNT(CASE WHEN work_center IS NOT NULL THEN 1 END) as steps_with_work_centers
     FROM routing 
     WHERE product_id = $1`,
    [productId]
  );
  return res.rows[0];
};

export const findStepsByWorkCenter = async (workCenter) => {
  const res = await db.query(
    `SELECT r.*, p.part_name, p.product_code
     FROM routing r
     JOIN product p ON r.product_id = p.product_id
     WHERE r.work_center = $1
     ORDER BY r.product_id, r.step_no`,
    [workCenter]
  );
  return res.rows;
};

export const findStepsByOperation = async (operation) => {
  const res = await db.query(
    `SELECT r.*, p.part_name, p.product_code
     FROM routing r
     JOIN product p ON r.product_id = p.product_id
     WHERE r.operation ILIKE $1
     ORDER BY r.product_id, r.step_no`,
    [`%${operation}%`]
  );
  return res.rows;
};
