// Planned Production Model - Handles all database operations for planned production
// Allows production to be scheduled/produced before Sales Orders arrive

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { createMasterWorkOrder } from '../services/hierarchicalWorkOrderService.js';
import mrpService from '../services/mrpService.js';

/**
 * Create a new planned production
 * This creates production plan WITHOUT a sales order
 */
export const createPlannedProduction = async (planData) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'planned_production'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      throw new Error('planned_production table does not exist. Please run migrations first.');
    }
    
    const {
      product_id,
      quantity_planned,
      uom_id,
      forecast_method = 'MANUAL',
      start_date,
      end_date,
      delivery_date,
      priority = 1,
      created_by = 'system',
      forecast_data = null,
      material_requirements = null
    } = planData;
    
    // Validate required fields
    if (!product_id || !quantity_planned || !start_date) {
      throw new Error('Product ID, quantity planned, and start date are required');
    }
    
    // Generate plan number (fallback if function doesn't exist)
    let plan_number;
    try {
      const planNumberResult = await client.query('SELECT generate_plan_number() as plan_number');
      plan_number = planNumberResult.rows[0].plan_number;
    } catch (error) {
      // Fallback: Generate plan number manually
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const seqResult = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(plan_number FROM '\d+$') AS INTEGER)), 0) + 1 as seq
        FROM planned_production
        WHERE plan_number LIKE $1
      `, [`PP-${dateStr}-%`]);
      const seq = seqResult.rows[0].seq;
      plan_number = `PP-${dateStr}-${String(seq).padStart(3, '0')}`;
    }
    
    // Insert planned production
    const insertQuery = `
      INSERT INTO planned_production (
        planned_production_id, plan_number, product_id, quantity_planned, uom_id,
        forecast_method, start_date, end_date, delivery_date,
        status, priority, created_by, forecast_data, material_requirements,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const result = await client.query(insertQuery, [
      plan_number, product_id, quantity_planned, uom_id || null,
      forecast_method, start_date, end_date || null, delivery_date || null,
      'PLANNED', priority, created_by,
      forecast_data ? JSON.stringify(forecast_data) : null,
      material_requirements ? JSON.stringify(material_requirements) : null
    ]);
    
    await client.query('COMMIT');
    
    logger.info({
      planned_production_id: result.rows[0].planned_production_id,
      plan_number,
      product_id,
      quantity_planned
    }, 'Planned production created');
    
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, planData }, 'Failed to create planned production');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get all planned productions with filters
 */
export const getAllPlannedProductions = async (filters = {}) => {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      product_id,
      start_date_from,
      start_date_to
    } = filters;
    
    let query = `
      SELECT 
        pp.*,
        p.product_code,
        p.part_name as product_name,
        u.code as uom_code,
        u.name as uom_name
      FROM planned_production pp
      LEFT JOIN product p ON pp.product_id = p.product_id
      LEFT JOIN uom u ON pp.uom_id = u.uom_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND pp.status = $${paramCount}`;
      params.push(status);
    }
    
    if (product_id) {
      paramCount++;
      query += ` AND pp.product_id = $${paramCount}`;
      params.push(product_id);
    }
    
    if (start_date_from) {
      paramCount++;
      query += ` AND pp.start_date >= $${paramCount}`;
      params.push(start_date_from);
    }
    
    if (start_date_to) {
      paramCount++;
      query += ` AND pp.start_date <= $${paramCount}`;
      params.push(start_date_to);
    }
    
    query += ` ORDER BY pp.start_date DESC, pp.priority DESC
               LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    return result.rows;
    
  } catch (error) {
    // If it's a "relation does not exist" error (PostgreSQL error code 42P01), return empty array
    const errorMsg = (error.message || '').toLowerCase();
    const errorCode = error.code || '';
    
    // PostgreSQL error code 42P01 = undefined_table
    if (errorCode === '42P01' || 
        errorMsg.includes('does not exist') || 
        (errorMsg.includes('relation') && errorMsg.includes('planned_production'))) {
      logger.warn({ error: error.message, code: errorCode }, 'planned_production table does not exist. Please run migrations.');
      return [];
    }
    logger.error({ error: error.message, code: errorCode, stack: error.stack, filters }, 'Failed to get planned productions');
    throw error;
  }
};

/**
 * Get planned production by ID
 */
export const getPlannedProductionById = async (plannedProductionId) => {
  try {
    const query = `
      SELECT 
        pp.*,
        p.product_code,
        p.part_name as product_name,
        u.code as uom_code,
        u.name as uom_name
      FROM planned_production pp
      LEFT JOIN product p ON pp.product_id = p.product_id
      LEFT JOIN uom u ON pp.uom_id = u.uom_id
      WHERE pp.planned_production_id = $1
    `;
    
    const result = await db.query(query, [plannedProductionId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
    
  } catch (error) {
    logger.error({ error: error.message, plannedProductionId }, 
      'Failed to get planned production by ID');
    throw error;
  }
};

/**
 * Get planned production by plan number
 */
export const getPlannedProductionByNumber = async (planNumber) => {
  try {
    const query = `
      SELECT 
        pp.*,
        p.product_code,
        p.part_name as product_name,
        u.code as uom_code,
        u.name as uom_name
      FROM planned_production pp
      LEFT JOIN product p ON pp.product_id = p.product_id
      LEFT JOIN uom u ON pp.uom_id = u.uom_id
      WHERE pp.plan_number = $1
    `;
    
    const result = await db.query(query, [planNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
    
  } catch (error) {
    logger.error({ error: error.message, planNumber }, 
      'Failed to get planned production by number');
    throw error;
  }
};

/**
 * Update planned production
 */
export const updatePlannedProduction = async (plannedProductionId, updateData) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const allowedFields = [
      'quantity_planned', 'uom_id', 'forecast_method', 'start_date',
      'end_date', 'delivery_date', 'status', 'priority', 'forecast_data', 'material_requirements'
    ];
    
    const updateFields = [];
    const params = [];
    let paramCount = 0;
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        paramCount++;
        if (key === 'forecast_data' || key === 'material_requirements') {
          updateFields.push(`${key} = $${paramCount}::jsonb`);
          params.push(updateData[key] ? JSON.stringify(updateData[key]) : null);
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          params.push(updateData[key]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return await getPlannedProductionById(plannedProductionId);
    }
    
    paramCount++;
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(plannedProductionId);
    
    const query = `
      UPDATE planned_production
      SET ${updateFields.join(', ')}
      WHERE planned_production_id = $${paramCount}
      RETURNING *
    `;
    
    const result = await client.query(query, params);
    
    await client.query('COMMIT');
    
    logger.info({ planned_production_id: plannedProductionId }, 'Planned production updated');
    
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, plannedProductionId, updateData }, 
      'Failed to update planned production');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete planned production
 */
export const deletePlannedProduction = async (plannedProductionId) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if status allows deletion
    const checkQuery = `
      SELECT status FROM planned_production WHERE planned_production_id = $1
    `;
    const checkResult = await client.query(checkQuery, [plannedProductionId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error('Planned production not found');
    }
    
    const status = checkResult.rows[0].status;
    if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
      throw new Error(`Cannot delete planned production with status ${status}`);
    }
    
    const deleteQuery = `
      DELETE FROM planned_production
      WHERE planned_production_id = $1
      RETURNING *
    `;
    
    const result = await client.query(deleteQuery, [plannedProductionId]);
    
    await client.query('COMMIT');
    
    logger.info({ planned_production_id: plannedProductionId }, 'Planned production deleted');
    
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, plannedProductionId }, 
      'Failed to delete planned production');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Run MRP planning for planned production
 * This calculates material requirements and checks availability
 */
export const runMRPForPlannedProduction = async (plannedProductionId, createdBy = 'system') => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get planned production
    const planQuery = `
      SELECT pp.*, p.part_name as product_name
      FROM planned_production pp
      LEFT JOIN product p ON pp.product_id = p.product_id
      WHERE pp.planned_production_id = $1
    `;
    
    const planResult = await client.query(planQuery, [plannedProductionId]);
    
    if (planResult.rows.length === 0) {
      throw new Error('Planned production not found');
    }
    
    const plan = planResult.rows[0];
    
    if (plan.status !== 'PLANNED') {
      throw new Error(`Cannot run MRP for planned production with status ${plan.status}`);
    }
    
    // Run MRP
    const mrpResult = await mrpService.runMRP({
      productId: plan.product_id,
      quantity: plan.quantity_planned,
      requiredByDate: plan.delivery_date || plan.end_date || plan.start_date,
      createdBy
    });
    
    // Store MRP results in planned_production
    await client.query(`
      UPDATE planned_production
      SET 
        status = 'MRP_PLANNED',
        material_requirements = $1,
        forecast_data = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE planned_production_id = $3
    `, [
      JSON.stringify(mrpResult.material_requirements),
      JSON.stringify({
        mrp_run_timestamp: mrpResult.mrp_run_timestamp,
        summary: mrpResult.summary,
        bom_explosion: mrpResult.bom_explosion
      }),
      plannedProductionId
    ]);
    
    await client.query('COMMIT');
    
    logger.info({
      planned_production_id: plannedProductionId,
      plan_number: plan.plan_number,
      total_shortages: mrpResult.summary.total_shortages,
      can_proceed: mrpResult.summary.can_proceed
    }, 'MRP planning completed for planned production');
    
    return {
      planned_production_id: plannedProductionId,
      plan_number: plan.plan_number,
      mrp_result: mrpResult,
      status: 'MRP_PLANNED'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, plannedProductionId }, 'Failed to run MRP for planned production');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Convert planned production to work orders
 * This starts the actual production
 * NOTE: MRP planning must be completed first
 */
export const convertPlannedProductionToWorkOrders = async (plannedProductionId, createdBy = 'system') => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get planned production
    const planQuery = `
      SELECT pp.*, p.part_name as product_name
      FROM planned_production pp
      LEFT JOIN product p ON pp.product_id = p.product_id
      WHERE pp.planned_production_id = $1
    `;
    
    const planResult = await client.query(planQuery, [plannedProductionId]);
    
    if (planResult.rows.length === 0) {
      throw new Error('Planned production not found');
    }
    
    const plan = planResult.rows[0];
    
    if (plan.status !== 'MRP_PLANNED') {
      throw new Error(`Cannot convert planned production with status ${plan.status}. Please run MRP planning first.`);
    }
    
    // Check if MRP has been run (material_requirements should exist)
    if (!plan.material_requirements || Object.keys(plan.material_requirements).length === 0) {
      throw new Error('MRP planning must be completed before converting to work orders. Please run MRP planning first.');
    }
    
    // Create work order for the planned quantity
    const masterWOResult = await createMasterWorkOrder({
      productId: plan.product_id,
      quantity: plan.quantity_planned,
      dueDate: plan.delivery_date || plan.end_date,
      startDate: plan.start_date,
      createdBy,
      customer: 'Planned Production',
      sales_order_ref: plan.plan_number // Link to planned production
    });
    
    const masterWO = masterWOResult.data;
    
    // Update planned production status
    await client.query(`
      UPDATE planned_production
      SET status = 'IN_PROGRESS',
          updated_at = CURRENT_TIMESTAMP
      WHERE planned_production_id = $1
    `, [plannedProductionId]);
    
    await client.query('COMMIT');
    
    logger.info({
      planned_production_id: plannedProductionId,
      plan_number: plan.plan_number,
      work_order_id: masterWO.master_wo_id,
      wo_no: masterWO.wo_no
    }, 'Planned production converted to work order');
    
    return {
      planned_production_id: plannedProductionId,
      plan_number: plan.plan_number,
      work_order: masterWO,
      status: 'IN_PROGRESS'
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, plannedProductionId }, 
      'Failed to convert planned production to work orders');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Mark planned production as completed
 * Called when work order completes
 */
export const markPlannedProductionCompleted = async (plannedProductionId) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(`
      UPDATE planned_production
      SET status = 'COMPLETED',
          end_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
      WHERE planned_production_id = $1
      RETURNING *
    `, [plannedProductionId]);
    
    await client.query('COMMIT');
    
    logger.info({ planned_production_id: plannedProductionId }, 
      'Planned production marked as completed');
    
    return result.rows[0];
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, plannedProductionId }, 
      'Failed to mark planned production as completed');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get material requirements for planned production
 */
export const getMaterialRequirements = async (plannedProductionId) => {
  try {
    const plan = await getPlannedProductionById(plannedProductionId);
    
    if (!plan) {
      throw new Error('Planned production not found');
    }
    
    // Return material requirements if stored
    if (plan.material_requirements) {
      return typeof plan.material_requirements === 'string' 
        ? JSON.parse(plan.material_requirements)
        : plan.material_requirements;
    }
    
    return null;
    
  } catch (error) {
    logger.error({ error: error.message, plannedProductionId }, 
      'Failed to get material requirements');
    throw error;
  }
};

