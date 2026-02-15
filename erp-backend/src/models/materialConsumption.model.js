// src/models/materialConsumption.model.js
import db from '../utils/db.js';

export const findByProductId = async (productId) => {
  const res = await db.query(
    `SELECT mc.*, p.part_name, p.product_code, m.material_code, m.name as material_name
     FROM material_consumption mc
     JOIN product p ON mc.product_id = p.product_id
     LEFT JOIN material m ON mc.material_id = m.material_id
     WHERE mc.product_id = $1
     ORDER BY mc.sub_assembly_name, mc.created_at`,
    [productId]
  );
  return res.rows;
};

export const findByProductIdAndMaterial = async (productId, materialId) => {
  const res = await db.query(
    `SELECT mc.*, p.part_name, p.product_code, m.material_code, m.name as material_name
     FROM material_consumption mc
     JOIN product p ON mc.product_id = p.product_id
     LEFT JOIN material m ON mc.material_id = m.material_id
     WHERE mc.product_id = $1 AND mc.material_id = $2
     ORDER BY mc.sub_assembly_name, mc.created_at`,
    [productId, materialId]
  );
  return res.rows;
};

export const create = async (payload) => {
  const {
    product_id,
    material_id,
    sub_assembly_name,
    sheet_type,
    sheet_width_mm,
    sheet_length_mm,
    sheet_weight_kg,
    blank_width_mm,
    blank_length_mm,
    blank_thickness_mm,
    blank_weight_kg,
    pieces_per_sheet,
    utilization_pct,
    total_blanks,
    consumption_pct
  } = payload;

  const res = await db.query(
    `INSERT INTO material_consumption (
      product_id, material_id, sub_assembly_name, sheet_type, sheet_width_mm, sheet_length_mm,
      sheet_weight_kg, blank_width_mm, blank_length_mm, blank_thickness_mm, blank_weight_kg,
      pieces_per_sheet, utilization_pct, total_blanks, consumption_pct
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      product_id, material_id, sub_assembly_name, sheet_type, sheet_width_mm, sheet_length_mm,
      sheet_weight_kg, blank_width_mm, blank_length_mm, blank_thickness_mm, blank_weight_kg,
      pieces_per_sheet, utilization_pct, total_blanks, consumption_pct
    ]
  );
  return res.rows[0];
};

export const upsert = async (payload) => {
  const {
    product_id,
    material_id,
    sub_assembly_name,
    sheet_type,
    sheet_width_mm,
    sheet_length_mm,
    sheet_weight_kg,
    blank_width_mm,
    blank_length_mm,
    blank_thickness_mm,
    blank_weight_kg,
    pieces_per_sheet,
    utilization_pct,
    total_blanks,
    consumption_pct
  } = payload;

  const res = await db.query(
    `INSERT INTO material_consumption (
      product_id, material_id, sub_assembly_name, sheet_type, sheet_width_mm, sheet_length_mm,
      sheet_weight_kg, blank_width_mm, blank_length_mm, blank_thickness_mm, blank_weight_kg,
      pieces_per_sheet, utilization_pct, total_blanks, consumption_pct
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (product_id, material_id, sub_assembly_name, sheet_type)
     DO UPDATE SET 
       sheet_width_mm = EXCLUDED.sheet_width_mm,
       sheet_length_mm = EXCLUDED.sheet_length_mm,
       sheet_weight_kg = EXCLUDED.sheet_weight_kg,
       blank_width_mm = EXCLUDED.blank_width_mm,
       blank_length_mm = EXCLUDED.blank_length_mm,
       blank_thickness_mm = EXCLUDED.blank_thickness_mm,
       blank_weight_kg = EXCLUDED.blank_weight_kg,
       pieces_per_sheet = EXCLUDED.pieces_per_sheet,
       utilization_pct = EXCLUDED.utilization_pct,
       total_blanks = EXCLUDED.total_blanks,
       consumption_pct = EXCLUDED.consumption_pct,
       updated_at = NOW()
     RETURNING *`,
    [
      product_id, material_id, sub_assembly_name, sheet_type, sheet_width_mm, sheet_length_mm,
      sheet_weight_kg, blank_width_mm, blank_length_mm, blank_thickness_mm, blank_weight_kg,
      pieces_per_sheet, utilization_pct, total_blanks, consumption_pct
    ]
  );
  return res.rows[0];
};

export const update = async (consumptionId, payload) => {
  const {
    sheet_type,
    sheet_width_mm,
    sheet_length_mm,
    sheet_weight_kg,
    blank_width_mm,
    blank_length_mm,
    blank_thickness_mm,
    blank_weight_kg,
    pieces_per_sheet,
    utilization_pct,
    total_blanks,
    consumption_pct
  } = payload;

  const res = await db.query(
    `UPDATE material_consumption SET 
      sheet_type = $2, sheet_width_mm = $3, sheet_length_mm = $4, sheet_weight_kg = $5,
      blank_width_mm = $6, blank_length_mm = $7, blank_thickness_mm = $8, blank_weight_kg = $9,
      pieces_per_sheet = $10, utilization_pct = $11, total_blanks = $12, consumption_pct = $13,
      updated_at = NOW()
     WHERE consumption_id = $1
     RETURNING *`,
    [
      consumptionId, sheet_type, sheet_width_mm, sheet_length_mm, sheet_weight_kg,
      blank_width_mm, blank_length_mm, blank_thickness_mm, blank_weight_kg,
      pieces_per_sheet, utilization_pct, total_blanks, consumption_pct
    ]
  );
  return res.rows[0];
};

export const remove = async (consumptionId) => {
  await db.query('DELETE FROM material_consumption WHERE consumption_id = $1', [consumptionId]);
  return true;
};

export const getConsumptionSummary = async (productId) => {
  const res = await db.query(
    `SELECT 
       COUNT(*) as total_sub_assemblies,
       AVG(utilization_pct) as average_utilization,
       SUM(total_blanks) as total_blanks,
       SUM(consumption_pct) as total_consumption,
       sheet_type,
       COUNT(DISTINCT material_id) as unique_materials
     FROM material_consumption 
     WHERE product_id = $1
     GROUP BY sheet_type
     ORDER BY sheet_type`,
    [productId]
  );
  return res.rows;
};

export const findById = async (consumptionId) => {
  const res = await db.query(
    `SELECT mc.*, p.part_name, p.product_code, m.material_code, m.name as material_name
     FROM material_consumption mc
     JOIN product p ON mc.product_id = p.product_id
     LEFT JOIN material m ON mc.material_id = m.material_id
     WHERE mc.consumption_id = $1`,
    [consumptionId]
  );
  return res.rows[0];
};
