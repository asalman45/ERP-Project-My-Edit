// src/services/hierarchicalWorkOrderService.js
// MWO-first Work Order Service - Create MWO only, manual child work order creation

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { checkMaterialAvailability } from '../models/bom.model.js';

/**
 * Create Master Work Order (MWO) only - MWO-first workflow
 * @param {Object} params - Work order generation parameters
 * @param {string} params.productId - Product ID
 * @param {number} params.quantity - Quantity to produce
 * @param {Date} params.dueDate - Due date for completion
 * @param {string} params.createdBy - User creating the WO
 * @param {string} params.customer - Customer name
 * @param {string} params.sales_order_ref - Sales order reference
 * @param {string} params.purchase_order_ref - Purchase order reference
 * @returns {Promise<Object>} - Created master work order
 */
export async function createMasterWorkOrder(params) {
  const { productId, quantity, dueDate, startDate, createdBy, customer, sales_order_ref, purchase_order_ref } = params;
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info({ productId, quantity }, 'Creating Master Work Order (MWO)');
    
    // Create Master Work Order only
    const woNo = `MWO-${Date.now()}`;
    const masterWOResult = await client.query(`
      INSERT INTO work_order (
        wo_id,
        wo_no,
        product_id,
        quantity,
        scheduled_start,
        scheduled_end,
        status,
        created_by,
        created_at,
        customer,
        sales_order_ref,
        purchase_order_ref
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, $9, $10, $11)
      RETURNING wo_id, wo_no
    `, [
      uuidv4(),
      woNo,
      productId,
      quantity,
      startDate,
      dueDate,
      'PLANNED',
      createdBy,
      customer || null,
      sales_order_ref || null,
      purchase_order_ref || null
    ]);
    
    const masterWO = masterWOResult.rows[0];
    
    await client.query('COMMIT');
    
    logger.info({ masterWOId: masterWO.wo_id, woNo: masterWO.wo_no }, 'Master work order created successfully');
    
    return {
      success: true,
      data: {
        master_wo_id: masterWO.wo_id,
        wo_no: masterWO.wo_no,
        product_id: productId,
        quantity: quantity,
        status: 'PLANNED',
        customer: customer,
        sales_order_ref: sales_order_ref,
        purchase_order_ref: purchase_order_ref
      }
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message }, 'Failed to create master work order');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create Child Work Order manually
 * @param {Object} params - Child work order parameters
 * @param {string} params.parent_wo_id - Parent MWO ID
 * @param {string} params.operation_type - Operation type (CUTTING, FORMING, ASSEMBLY, QC)
 * @param {number} params.quantity - Quantity
 * @param {string} params.createdBy - User creating the WO
 * @param {string} params.customer - Customer name
 * @param {string} params.sales_order_ref - Sales order reference
 * @returns {Promise<Object>} - Created child work order
 */
export async function createChildWorkOrder(params) {
  const { parent_wo_id, operation_type, quantity, createdBy, customer, sales_order_ref } = params;
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info({ parent_wo_id, operation_type, quantity }, 'Creating Child Work Order');
    
    // Get parent work order details
    const parentResult = await client.query(`
      SELECT product_id, scheduled_start, scheduled_end FROM work_order WHERE wo_id = $1
    `, [parent_wo_id]);
    
    if (parentResult.rows.length === 0) {
      throw new Error('Parent work order not found');
    }
    
    const parentWO = parentResult.rows[0];
    
    // Create Child Work Order
    const woNo = `WO-${operation_type}-${Date.now()}`;
    const childWOResult = await client.query(`
      INSERT INTO work_order (
        wo_id,
        wo_no,
        product_id,
        quantity,
        parent_wo_id,
        operation_type,
        scheduled_start,
        scheduled_end,
        status,
        created_by,
        created_at,
        customer,
        sales_order_ref
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11, $12)
      RETURNING wo_id, wo_no
    `, [
      uuidv4(),
      woNo,
      parentWO.product_id,
      quantity,
      parent_wo_id,
      operation_type,
      parentWO.scheduled_start,
      parentWO.scheduled_end,
      'PLANNED',
      createdBy,
      customer || null,
      sales_order_ref || null
    ]);
    
    const childWO = childWOResult.rows[0];
    
    await client.query('COMMIT');
    
    logger.info({ childWOId: childWO.wo_id, woNo: childWO.wo_no }, 'Child work order created successfully');
    
    return {
      success: true,
      data: {
        child_wo_id: childWO.wo_id,
        wo_no: childWO.wo_no,
        parent_wo_id: parent_wo_id,
        operation_type: operation_type,
        quantity: quantity,
        status: 'PLANNED',
        customer: customer,
        sales_order_ref: sales_order_ref
      }
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message }, 'Failed to create child work order');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get work order hierarchy
 * @param {string} masterWOId - Master work order ID
 * @returns {Promise<Object>} - Work order hierarchy
 */
export async function getWorkOrderHierarchy(masterWOId) {
  try {
    const result = await db.query(`
      SELECT 
        wo.wo_id,
        wo.wo_no,
        wo.product_id,
        p.part_name as product_name,
        wo.quantity,
        wo.status,
        wo.operation_type,
        wo.parent_wo_id,
        wo.scheduled_start,
        wo.scheduled_end,
        wo.priority,
        wo.created_at,
        wo.customer,
        wo.sales_order_ref,
        wo.purchase_order_ref
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      WHERE wo.wo_id = $1 OR wo.parent_wo_id = $1
      ORDER BY 
        CASE WHEN wo.parent_wo_id IS NULL THEN 0 ELSE 1 END,
        wo.created_at
    `, [masterWOId]);
    
    const workOrders = result.rows;
    const masterWO = workOrders.find(wo => wo.wo_id === masterWOId);
    const childWOs = workOrders.filter(wo => wo.parent_wo_id === masterWOId);
    
    return {
      success: true,
      data: {
        master: masterWO,
        children: childWOs,
        total_work_orders: workOrders.length
      }
    };
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get work order hierarchy');
    throw error;
  }
}

/**
 * Get child work orders for a parent work order
 * @param {string} parentWOId - Parent work order ID
 * @returns {Promise<Array>} - Child work orders
 */
export async function getChildWorkOrders(parentWOId) {
  try {
    const result = await db.query(`
      SELECT 
        wo.wo_id,
        wo.wo_no,
        wo.product_id,
        p.part_name as product_name,
        wo.quantity,
        wo.status,
        wo.operation_type,
        wo.parent_wo_id,
        wo.scheduled_start,
        wo.scheduled_end,
        wo.priority,
        wo.created_at,
        wo.customer,
        wo.sales_order_ref,
        wo.purchase_order_ref
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      WHERE wo.parent_wo_id = $1
      ORDER BY wo.created_at
    `, [parentWOId]);
    
    return result.rows;
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get child work orders');
    throw error;
  }
}

/**
 * Check work order dependencies
 * @param {string} woId - Work order ID
 * @returns {Promise<Object>} - Dependency information
 */
export async function checkWorkOrderDependencies(woId) {
  try {
    // Get the work order details
    const woResult = await db.query(`
      SELECT wo_id, operation_type, status, parent_wo_id
      FROM work_order 
      WHERE wo_id = $1
    `, [woId]);
    
    if (woResult.rows.length === 0) {
      throw new Error('Work order not found');
    }
    
    const workOrder = woResult.rows[0];
    
    // Define operation dependencies
    const dependencies = {
      'FORMING': ['CUTTING'],
      'ASSEMBLY': ['FORMING', 'CUTTING'], // Can assemble after forming OR cutting
      'WELDING': ['CUTTING'], // Welding can start after cutting (no forming required)
      'PAINTING': ['WELDING', 'ASSEMBLY'],
      'PACKAGING': ['PAINTING', 'QC'],
      'QC': ['ASSEMBLY', 'WELDING'] // QC after assembly or welding
    };
    
    const requiredOperations = dependencies[workOrder.operation_type] || [];
    
    if (requiredOperations.length === 0) {
      return {
        hasDependencies: false,
        canStart: true,
        requiredOperations: [],
        completedOperations: []
      };
    }
    
    // Get all child work orders for the same parent
    const childrenResult = await db.query(`
      SELECT operation_type, status
      FROM work_order 
      WHERE parent_wo_id = $1 AND wo_id != $2
    `, [workOrder.parent_wo_id, woId]);
    
    const allOperations = childrenResult.rows;
    
    // Check which required operations are completed
    const completedOperations = requiredOperations.filter(requiredOp => 
      allOperations.some(op => 
        op.operation_type === requiredOp && op.status === 'COMPLETED'
      )
    );
    
    const canStart = completedOperations.length === requiredOperations.length;
    
    return {
      hasDependencies: true,
      canStart: canStart,
      requiredOperations: requiredOperations,
      completedOperations: completedOperations,
      missingOperations: requiredOperations.filter(op => !completedOperations.includes(op))
    };
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to check work order dependencies');
    throw error;
  }
}

/**
 * Trigger next work orders after completing one
 * @param {string} completedWOId - Completed work order ID
 * @returns {Promise<Array>} - Triggered work orders
 */
export async function triggerNextWorkOrders(completedWOId) {
  try {
    // Get the completed work order details
    const woResult = await db.query(`
      SELECT wo_id, operation_type, parent_wo_id
      FROM work_order 
      WHERE wo_id = $1
    `, [completedWOId]);
    
    if (woResult.rows.length === 0) {
      throw new Error('Work order not found');
    }
    
    const completedWO = woResult.rows[0];
    
    // Define which operations can be triggered by this completion
    const triggers = {
      'CUTTING': ['FORMING'],
      'FORMING': ['ASSEMBLY', 'WELDING'],
      'ASSEMBLY': ['QC', 'PAINTING'],
      'WELDING': ['QC', 'PAINTING'],
      'PAINTING': ['PACKAGING'],
      'QC': ['PACKAGING']
    };
    
    const triggeredOperations = triggers[completedWO.operation_type] || [];
    
    if (triggeredOperations.length === 0) {
      return [];
    }
    
    // Get all child work orders for the same parent
    const childrenResult = await db.query(`
      SELECT wo_id, operation_type, status
      FROM work_order 
      WHERE parent_wo_id = $1 AND status = 'PLANNED'
    `, [completedWO.parent_wo_id]);
    
    const plannedOperations = childrenResult.rows;
    
    // Find operations that can now be started
    const canStartOperations = plannedOperations.filter(op => 
      triggeredOperations.includes(op.operation_type)
    );
    
    // Update status to IN_PROGRESS for operations that can start
    const triggeredWOs = [];
    for (const op of canStartOperations) {
      await db.query(`
        UPDATE work_order 
        SET status = 'IN_PROGRESS', 
            scheduled_start = COALESCE(scheduled_start, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
        WHERE wo_id = $1
      `, [op.wo_id]);
      
      triggeredWOs.push({
        wo_id: op.wo_id,
        operation_type: op.operation_type,
        status: 'IN_PROGRESS'
      });
    }
    
    return triggeredWOs;
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to trigger next work orders');
    throw error;
  }
}

/**
 * Calculate sheet allocation for a product
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to produce
 * @returns {Promise<Object>} - Sheet allocation information
 */
export async function calculateSheetAllocation(productId, quantity) {
  try {
    // This is a placeholder implementation
    // In a real system, this would calculate optimal sheet usage
    return {
      productId: productId,
      quantity: quantity,
      estimatedSheets: Math.ceil(quantity / 10), // Placeholder calculation
      materialWaste: 0.05, // 5% waste
      costEstimate: quantity * 10 // Placeholder cost
    };
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to calculate sheet allocation');
    throw error;
  }
}

/**
 * Start a work order: check material availability and set IN_PROGRESS if sufficient
 * @param {string} woId
 * @returns {Promise<Object>} summary with shortages or start confirmation
 */
export async function startWorkOrder(woId) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // Fetch WO details
    const woRes = await client.query(`
      SELECT wo_id, product_id, quantity, status
      FROM work_order
      WHERE wo_id = $1
    `, [woId]);
    if (woRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return { started: false, error: 'WORK_ORDER_NOT_FOUND' };
    }
    const wo = woRes.rows[0];

    // If already in progress or completed, just return status
    if (wo.status === 'IN_PROGRESS' || wo.status === 'COMPLETED') {
      return { started: wo.status === 'IN_PROGRESS', already: true, status: wo.status };
    }

    // Check availability for full BOM (simple policy)
    let availability;
    try {
      availability = await checkMaterialAvailability(wo.product_id, wo.quantity);
    } catch (e) {
      await client.query('ROLLBACK');
      return { started: false, error: e.message || 'AVAILABILITY_CHECK_FAILED' };
    }
    if (availability.has_shortages) {
      await client.query('ROLLBACK');
      return { started: false, shortages: availability.shortages };
    }

    // Mark as IN_PROGRESS
    await client.query(`
      UPDATE work_order
      SET status = 'IN_PROGRESS', scheduled_start = CURRENT_TIMESTAMP
      WHERE wo_id = $1
    `, [woId]);

    await client.query('COMMIT');
    return { started: true, shortages: [] };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, woId }, 'Failed to start work order');
    return { started: false, error: error.message || 'START_FAILED' };
  } finally {
    client.release();
  }
}