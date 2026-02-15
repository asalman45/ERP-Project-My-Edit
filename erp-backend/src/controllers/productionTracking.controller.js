// src/controllers/productionTracking.controller.js
import * as productionRecipeModel from '../models/productionRecipe.model.js';
import { logger } from '../utils/logger.js';
import socketService from '../services/socket.service.js';
import db from '../utils/db.js';

/**
 * Production Tracking Controller
 * Handles real-time production tracking and progress updates
 */

/**
 * GET /api/production-tracking/orders
 * Get all work orders with production tracking data
 */
export const getProductionOrders = async (req, res) => {
  try {
    const { limit = 100, offset = 0, status } = req.query;

    // Simple query to get work orders
    let query = `
      SELECT 
        wo.*,
        p.part_name as part_description,
        m.model_name as model,
        u.code as uom_code,
        u.name as uom_name
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN uom u ON wo.uom_id = u.uom_id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND wo.status = $${paramCount}`;
      values.push(status);
    }

    query += ` ORDER BY wo.created_at DESC`;
    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await db.query(query, values);
    const orders = result.rows;

    logger.info({ count: orders.length }, 'Production orders retrieved');

    return res.status(200).json({
      success: true,
      data: orders,
      count: orders.length
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get production orders');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve production orders'
    });
  }
};

/**
 * GET /api/production-tracking/orders/:wo_id
 * Get detailed production tracking for a specific work order
 */
export const getProductionOrderDetails = async (req, res) => {
  try {
    const { wo_id } = req.params;

    // Get work order details
    const workOrderQuery = `
      SELECT 
        wo.*,
        p.part_name as part_description,
        m.model_name as model,
        u.code as uom_code,
        u.name as uom_name
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN uom u ON wo.uom_id = u.uom_id
      WHERE wo.wo_id = $1
    `;

    const workOrderResult = await db.query(workOrderQuery, [wo_id]);
    
    if (workOrderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Work order not found'
      });
    }

    const workOrder = workOrderResult.rows[0];

    // Get operations with progress
    const operationsQuery = `
      SELECT 
        woo.*,
        pr.operation_name,
        pr.sequence_order,
        pr.work_center as operation_work_center,
        pr.setup_time_minutes,
        pr.run_time_per_piece_minutes,
        wc.name as work_center_name,
        m.machine_name,
        m.machine_code
      FROM work_order_operation woo
        LEFT JOIN production_routing pr ON woo.operation_code = pr.operation_code
      LEFT JOIN work_center wc ON pr.work_center = wc.code
      LEFT JOIN machine m ON woo.machine_id = m.machine_id
      WHERE woo.wo_id = $2
      ORDER BY pr.sequence_order
    `;

    const operationsResult = await db.query(operationsQuery, [wo_id]);
    workOrder.operations = operationsResult.rows;

    // Calculate overall progress
    const totalOperations = workOrder.operations.length;
    const completedOperations = workOrder.operations.filter(op => op.status === 'COMPLETED').length;
    const overallProgress = totalOperations > 0 ? (completedOperations / totalOperations) * 100 : 0;

    workOrder.overall_progress = overallProgress;
    workOrder.total_operations = totalOperations;
    workOrder.completed_operations = completedOperations;

    logger.info({ wo_id }, 'Production order details retrieved');

    return res.status(200).json({
      success: true,
      data: workOrder
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get production order details');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve production order details'
    });
  }
};

/**
 * PUT /api/production-tracking/orders/:wo_id/operations/:operation_id/progress
 * Update operation progress
 */
export const updateOperationProgress = async (req, res) => {
  try {
    const { wo_id, operation_id } = req.params;
    const { progress_percentage, status, notes, machine_id } = req.body;

    if (progress_percentage < 0 || progress_percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress percentage must be between 0 and 100'
      });
    }

    const updates = {
      progress_percentage,
      status: status || (progress_percentage === 100 ? 'COMPLETED' : 'IN_PROGRESS'),
      updated_at: new Date()
    };

    if (notes) updates.notes = notes;
    if (machine_id) updates.machine_id = machine_id;

    const query = `
      UPDATE work_order_operation 
      SET progress_percentage = $1, status = $2, updated_at = $3, notes = $4, machine_id = $5
      WHERE operation_id = $6 AND wo_id = $7
      RETURNING *
    `;

    const result = await db.query(query, [
      updates.progress_percentage,
      updates.status,
      updates.updated_at,
      updates.notes || null,
      updates.machine_id || null,
      operation_id,
      wo_id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found'
      });
    }

    const updatedOperation = result.rows[0];

    // Emit real-time notification
    socketService.notifyProductionProgress(
      wo_id,
      operation_id,
      progress_percentage,
      updates.status
    );

    logger.info({ 
      wo_id, 
      operation_id, 
      progress_percentage 
    }, 'Operation progress updated');

    return res.status(200).json({
      success: true,
      data: updatedOperation,
      message: 'Operation progress updated successfully'
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to update operation progress');

    return res.status(500).json({
      success: false,
      error: 'Failed to update operation progress'
    });
  }
};

/**
 * POST /api/production-tracking/orders/:wo_id/operations/:operation_id/complete
 * Mark operation as completed
 */
export const completeOperation = async (req, res) => {
  try {
    const { wo_id, operation_id } = req.params;
    const { quality_notes, defects_found, completed_by } = req.body;

    const query = `
      UPDATE work_order_operation 
      SET 
        status = 'COMPLETED',
        progress_percentage = 100,
        completion_date = CURRENT_TIMESTAMP,
        quality_notes = $1,
        completed_by = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE operation_id = $3 AND wo_id = $4
      RETURNING *
    `;

    const result = await db.query(query, [
      quality_notes || null,
      completed_by || 'system',
      operation_id,
      wo_id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found'
      });
    }

    const completedOperation = result.rows[0];

    // Emit real-time notification
    socketService.notifyProductionProgress(
      wo_id,
      operation_id,
      100,
      'COMPLETED'
    );

    // Check if all operations are completed
    const allOperationsQuery = `
      SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed
      FROM work_order_operation 
      WHERE wo_id = $1
    `;

    const allOpsResult = await db.query(allOperationsQuery, [wo_id]);
    const { total, completed } = allOpsResult.rows[0];

    // If all operations are completed, update work order status
    if (parseInt(total) === parseInt(completed)) {
      await workOrderModel.update(wo_id, { 
        status: 'COMPLETED', 
        completion_date: new Date() 
      });

      // Emit work order completion notification
      socketService.notifyWorkOrderStatusChange(
        wo_id,
        'IN_PROGRESS',
        'COMPLETED',
        completed_by || 'system'
      );
    }

    logger.info({ wo_id, operation_id }, 'Operation completed');

    return res.status(200).json({
      success: true,
      data: completedOperation,
      message: 'Operation completed successfully'
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to complete operation');

    return res.status(500).json({
      success: false,
      error: 'Failed to complete operation'
    });
  }
};

/**
 * GET /api/production-tracking/dashboard
 * Get production tracking dashboard data
 */
export const getProductionDashboard = async (req, res) => {
  try {
    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'PLANNED' THEN 1 END) as planned_orders,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders
      FROM work_order
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const statsResult = await db.query(statsQuery);
    const stats = statsResult.rows[0];

    // Get recent work orders
    const recentOrdersQuery = `
      SELECT 
        wo.wo_no,
        wo.status,
        wo.created_at,
        p.part_name,
        m.model_name
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      LEFT JOIN model m ON p.model_id = m.model_id
      ORDER BY wo.created_at DESC
      LIMIT 10
    `;

    const recentOrdersResult = await db.query(recentOrdersQuery);
    const recentOrders = recentOrdersResult.rows;

    const dashboardData = {
      stats,
      recentOrders
    };

    logger.info('Production dashboard data retrieved');

    return res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get production dashboard');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve production dashboard'
    });
  }
};