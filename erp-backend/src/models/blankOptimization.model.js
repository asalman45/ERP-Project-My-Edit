// src/models/blankOptimization.model.js
import db from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

// Create optimization result
export const create = async (payload) => {
  const {
    blank_id,
    sheet_size_id,
    blank_width_mm,
    blank_length_mm,
    blank_thickness_mm,
    blank_quantity,
    weight_of_blank_kg,
    total_blank_weight_kg,
    best_direction,
    sheet_width_mm,
    sheet_length_mm,
    primary_blanks_per_sheet,
    extra_blanks_from_leftover,
    total_blanks_per_sheet,
    total_blanks_weight_kg,
    efficiency_percentage,
    scrap_percentage,
    utilization_percentage,
    leftover_area_mm2,
    leftover_width_mm,
    leftover_length_mm,
    leftover_reusable,
    horizontal_result,
    vertical_result,
    all_sheet_comparisons,
    optimization_mode = 'AUTO',
    calculated_by
  } = payload;

  const optimization_id = uuidv4();
  const res = await db.query(
    `INSERT INTO blank_optimization (
      optimization_id, blank_id, sheet_size_id,
      blank_width_mm, blank_length_mm, blank_thickness_mm, blank_quantity,
      weight_of_blank_kg, total_blank_weight_kg,
      best_direction, sheet_width_mm, sheet_length_mm,
      primary_blanks_per_sheet, extra_blanks_from_leftover, total_blanks_per_sheet,
      total_blanks_weight_kg, efficiency_percentage, scrap_percentage, utilization_percentage,
      leftover_area_mm2, leftover_width_mm, leftover_length_mm, leftover_reusable,
      horizontal_result, vertical_result, all_sheet_comparisons,
      optimization_mode, calculated_by, calculated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, NOW()
    )
     RETURNING *`,
    [
      optimization_id, blank_id, sheet_size_id,
      blank_width_mm, blank_length_mm, blank_thickness_mm, blank_quantity,
      weight_of_blank_kg, total_blank_weight_kg,
      best_direction, sheet_width_mm, sheet_length_mm,
      primary_blanks_per_sheet, extra_blanks_from_leftover, total_blanks_per_sheet,
      total_blanks_weight_kg, efficiency_percentage, scrap_percentage, utilization_percentage,
      leftover_area_mm2, leftover_width_mm, leftover_length_mm, leftover_reusable,
      JSON.stringify(horizontal_result), JSON.stringify(vertical_result), JSON.stringify(all_sheet_comparisons),
      optimization_mode, calculated_by
    ]
  );
  return res.rows[0];
};

// Get optimization by ID
export const findById = async (optimizationId) => {
  const res = await db.query(
    'SELECT * FROM blank_optimization WHERE optimization_id = $1',
    [optimizationId]
  );
  return res.rows[0];
};

// Get latest optimization for a blank
export const findLatestByBlankId = async (blankId) => {
  const res = await db.query(
    `SELECT * FROM blank_optimization 
     WHERE blank_id = $1 
     ORDER BY calculated_at DESC 
     LIMIT 1`,
    [blankId]
  );
  return res.rows[0];
};

// Get all optimizations for a blank
export const findAllByBlankId = async (blankId) => {
  const res = await db.query(
    `SELECT * FROM blank_optimization 
     WHERE blank_id = $1 
     ORDER BY calculated_at DESC`,
    [blankId]
  );
  return res.rows;
};

// Get optimizations by product (via blank_spec)
export const findByProductId = async (productId) => {
  const res = await db.query(
    `SELECT bo.*, bs.sub_assembly_name, bs.product_id, p.part_name, p.product_code
     FROM blank_optimization bo
     JOIN blank_spec bs ON bo.blank_id = bs.blank_id
     JOIN product p ON bs.product_id = p.product_id
     WHERE bs.product_id = $1
     ORDER BY bo.calculated_at DESC`,
    [productId]
  );
  return res.rows;
};

// Get optimization summary statistics
export const getOptimizationStats = async (filters = {}) => {
  let query = `
    SELECT 
      COUNT(*) as total_optimizations,
      AVG(efficiency_percentage) as avg_efficiency,
      AVG(scrap_percentage) as avg_scrap,
      SUM(CASE WHEN leftover_reusable = true THEN 1 ELSE 0 END) as reusable_leftovers_count,
      AVG(extra_blanks_from_leftover) as avg_extra_blanks
    FROM blank_optimization
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  if (filters.start_date) {
    query += ` AND calculated_at >= $${paramIndex}`;
    params.push(filters.start_date);
    paramIndex++;
  }

  if (filters.end_date) {
    query += ` AND calculated_at <= $${paramIndex}`;
    params.push(filters.end_date);
    paramIndex++;
  }

  const res = await db.query(query, params);
  return res.rows[0];
};

// Delete optimization
export const deleteById = async (optimizationId) => {
  const res = await db.query(
    'DELETE FROM blank_optimization WHERE optimization_id = $1 RETURNING *',
    [optimizationId]
  );
  return res.rows[0];
};
