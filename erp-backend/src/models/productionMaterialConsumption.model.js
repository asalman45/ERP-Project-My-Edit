// src/models/productionMaterialConsumption.model.js
import db from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

// Create production material consumption record
export const create = async (payload) => {
  const {
    production_order_id,
    product_id,
    blank_spec_id,
    sub_assembly_name,
    material_id,
    planned_quantity,
    consumed_quantity,
    scrap_quantity,
    consumption_type, // 'FRESH', 'SCRAP', 'MIXED'
    created_by
  } = payload;

  const consumption_id = uuidv4();
  const res = await db.query(
    `INSERT INTO production_material_consumption (
      consumption_id, production_order_id, product_id, blank_spec_id, 
      sub_assembly_name, material_id, planned_quantity, consumed_quantity, 
      scrap_quantity, consumption_type, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
     RETURNING *`,
    [
      consumption_id, production_order_id, product_id, blank_spec_id,
      sub_assembly_name, material_id, planned_quantity, consumed_quantity,
      scrap_quantity, consumption_type, created_by
    ]
  );
  return res.rows[0];
};

// Get consumption by production order
export const findByProductionOrder = async (productionOrderId) => {
  const res = await db.query(
    `SELECT pmc.*, p.part_name, p.product_code, m.material_code, m.name as material_name,
            bs.width_mm, bs.length_mm, bs.thickness_mm, bs.quantity as blank_quantity
     FROM production_material_consumption pmc
     JOIN product p ON pmc.product_id = p.product_id
     LEFT JOIN material m ON pmc.material_id = m.material_id
     LEFT JOIN blank_spec bs ON pmc.blank_spec_id = bs.blank_id
     WHERE pmc.production_order_id = $1
     ORDER BY pmc.created_at`,
    [productionOrderId]
  );
  return res.rows;
};

// Get consumption by product
export const findByProduct = async (productId) => {
  const res = await db.query(
    `SELECT pmc.*, po.production_order_number, po.status as po_status,
            p.part_name, p.product_code, m.material_code, m.name as material_name
     FROM production_material_consumption pmc
     JOIN production_order po ON pmc.production_order_id = po.production_order_id
     JOIN product p ON pmc.product_id = p.product_id
     LEFT JOIN material m ON pmc.material_id = m.material_id
     WHERE pmc.product_id = $1
     ORDER BY pmc.created_at DESC`,
    [productId]
  );
  return res.rows;
};

// Update consumption quantities
export const updateConsumption = async (consumptionId, updates) => {
  const {
    consumed_quantity,
    scrap_quantity,
    consumption_type,
    updated_by
  } = updates;

  const res = await db.query(
    `UPDATE production_material_consumption 
     SET consumed_quantity = $2, scrap_quantity = $3, consumption_type = $4, 
         updated_by = $5, updated_at = NOW()
     WHERE consumption_id = $1
     RETURNING *`,
    [consumptionId, consumed_quantity, scrap_quantity, consumption_type, updated_by]
  );
  return res.rows[0];
};

// Get consumption summary by material
export const getConsumptionSummary = async (filters = {}) => {
  let query = `
    SELECT 
      pmc.material_id,
      m.material_code,
      m.name as material_name,
      COUNT(*) as total_consumptions,
      SUM(pmc.planned_quantity) as total_planned,
      SUM(pmc.consumed_quantity) as total_consumed,
      SUM(pmc.scrap_quantity) as total_scrap,
      AVG(pmc.consumed_quantity / NULLIF(pmc.planned_quantity, 0)) as efficiency_ratio
    FROM production_material_consumption pmc
    LEFT JOIN material m ON pmc.material_id = m.material_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  if (filters.start_date) {
    query += ` AND pmc.created_at >= $${paramIndex}`;
    params.push(filters.start_date);
    paramIndex++;
  }

  if (filters.end_date) {
    query += ` AND pmc.created_at <= $${paramIndex}`;
    params.push(filters.end_date);
    paramIndex++;
  }

  if (filters.product_id) {
    query += ` AND pmc.product_id = $${paramIndex}`;
    params.push(filters.product_id);
    paramIndex++;
  }

  query += `
    GROUP BY pmc.material_id, m.material_code, m.name
    ORDER BY total_consumed DESC
  `;

  const res = await db.query(query, params);
  return res.rows;
};

