// src/controllers/api/productionApi.controller.js
// API Controller for Production Execution

import productionService from '../../services/productionExecutionService.js';
import { logger } from '../../utils/logger.js';
import db from '../../utils/db.js';

/**
 * Issue materials to a work order
 * POST /api/production/issue-material
 * Body: { workOrderId, materials: [{material_id, quantity_planned, quantity_issued, unit_cost}], issuedBy }
 */
export async function issueMaterial(req, res) {
  try {
    const { workOrderId, materials, issuedBy } = req.body;
    
    if (!workOrderId || !materials || !Array.isArray(materials)) {
      return res.status(400).json({
        success: false,
        error: 'Work Order ID and materials array are required'
      });
    }
    
    logger.info({ workOrderId, materialsCount: materials.length }, 'API: Issuing materials');
    
    const result = await productionService.issueMaterialToWorkOrder({
      workOrderId,
      materials,
      issuedBy: issuedBy || 'system'
    });
    
    res.json({
      success: true,
      data: result,
      message: `${materials.length} material(s) issued successfully`
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error issuing materials');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to issue materials'
    });
  }
}

/**
 * Record production output
 * POST /api/production/record-output
 * Body: { workOrderId, itemId, itemType, itemName, quantityPlanned, quantityGood, quantityRejected, quantityRework, rejectionReason, recordedBy }
 */
export async function recordOutput(req, res) {
  try {
    const {
      workOrderId,
      itemId,
      itemType,
      itemName,
      quantityPlanned,
      quantityGood,
      quantityRejected,
      quantityRework,
      rejectionReason,
      recordedBy
    } = req.body;
    
    if (!workOrderId || !itemId || quantityGood === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Work Order ID, Item ID, and quantity good are required'
      });
    }
    
    logger.info({ workOrderId, itemId, quantityGood }, 'API: Recording production output');
    
    const result = await productionService.recordProductionOutput({
      workOrderId,
      itemId,
      itemType: itemType || 'BLANK',
      itemName,
      quantityPlanned,
      quantityGood,
      quantityRejected: quantityRejected || 0,
      quantityRework: quantityRework || 0,
      rejectionReason,
      recordedBy: recordedBy || 'system'
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Production output recorded successfully'
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error recording production output');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record production output'
    });
  }
}

/**
 * Generate scrap from cutting operation
 * POST /api/production/generate-scrap
 * Body: { workOrderId, blankId, sheetsProcessed, createdBy }
 */
export async function generateScrap(req, res) {
  try {
    const { workOrderId, blankId, sheetsProcessed, createdBy } = req.body;
    
    if (!workOrderId || !blankId || !sheetsProcessed) {
      return res.status(400).json({
        success: false,
        error: 'Work Order ID, Blank ID, and sheets processed are required'
      });
    }
    
    logger.info({ workOrderId, blankId, sheetsProcessed }, 'API: Generating scrap from cutting');
    
    const scrapIds = await productionService.generateScrapFromCutting({
      workOrderId,
      blankId,
      sheetsProcessed,
      createdBy: createdBy || 'system'
    });
    
    res.json({
      success: true,
      data: { scrap_ids: scrapIds },
      message: `${scrapIds.length} scrap record(s) generated successfully`
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error generating scrap');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate scrap'
    });
  }
}

/**
 * Complete work order operation
 * POST /api/production/complete-operation
 * Body: { workOrderId, completedBy }
 */
export async function completeOperation(req, res) {
  try {
    const { workOrderId, completedBy } = req.body;
    
    if (!workOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Work Order ID is required'
      });
    }
    
    logger.info({ workOrderId }, 'API: Completing work order operation');
    
    const result = await productionService.completeWorkOrderOperation(
      workOrderId,
      completedBy || 'system'
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Work order operation completed successfully'
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error completing work order');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete work order operation'
    });
  }
}

/**
 * Get material issues for a work order
 * GET /api/production/material-issues/:workOrderId
 */
export async function getMaterialIssues(req, res) {
  try {
    const { workOrderId } = req.params;
    
    logger.info({ workOrderId }, 'API: Fetching material issues');
    
    const query = `
      SELECT 
        wmi.*,
        m.material_code,
        m.name as material_name
      FROM work_order_material_issue wmi
      LEFT JOIN material m ON wmi.material_id = m.material_id
      WHERE wmi.work_order_id = $1
      ORDER BY wmi.issued_at DESC
    `;
    
    const result = await db.query(query, [workOrderId]);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
    
  } catch (error) {
    logger.error({ error, workOrderId: req.params.workOrderId }, 'API: Error fetching material issues');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch material issues'
    });
  }
}

/**
 * Get production output for a work order
 * GET /api/production/output/:workOrderId
 */
export async function getProductionOutput(req, res) {
  try {
    const { workOrderId } = req.params;
    
    logger.info({ workOrderId }, 'API: Fetching production output');
    
    const query = `
      SELECT * FROM production_output
      WHERE work_order_id = $1
      ORDER BY recorded_at DESC
    `;
    
    const result = await db.query(query, [workOrderId]);
    
    const summary = result.rows.reduce((acc, row) => ({
      total_good: acc.total_good + parseFloat(row.quantity_good || 0),
      total_rejected: acc.total_rejected + parseFloat(row.quantity_rejected || 0),
      total_rework: acc.total_rework + parseFloat(row.quantity_rework || 0)
    }), { total_good: 0, total_rejected: 0, total_rework: 0 });
    
    res.json({
      success: true,
      data: {
        output_records: result.rows,
        summary
      }
    });
    
  } catch (error) {
    logger.error({ error, workOrderId: req.params.workOrderId }, 'API: Error fetching production output');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch production output'
    });
  }
}

/**
 * Get production summary for a work order
 * GET /api/production/summary/:workOrderId
 */
export async function getProductionSummary(req, res) {
  try {
    const { workOrderId } = req.params;
    
    logger.info({ workOrderId }, 'API: Fetching production summary');
    
    // Get work order details
    const woQuery = await db.query(`
      SELECT * FROM work_order WHERE wo_id = $1
    `, [workOrderId]);
    
    if (woQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Work order not found'
      });
    }
    
    const workOrder = woQuery.rows[0];
    
    // Get material issues
    const issuesQuery = await db.query(`
      SELECT 
        COUNT(*) as issue_count,
        COALESCE(SUM(quantity_issued), 0) as total_issued,
        COALESCE(SUM(quantity_consumed), 0) as total_consumed,
        COALESCE(SUM(total_cost), 0) as total_cost
      FROM work_order_material_issue
      WHERE work_order_id = $1
    `, [workOrderId]);
    
    // Get production output
    const outputQuery = await db.query(`
      SELECT 
        COUNT(*) as output_count,
        COALESCE(SUM(quantity_good), 0) as total_good,
        COALESCE(SUM(quantity_rejected), 0) as total_rejected,
        COALESCE(SUM(quantity_rework), 0) as total_rework
      FROM production_output
      WHERE work_order_id = $1
    `, [workOrderId]);
    
    // Get scrap records
    const scrapQuery = await db.query(`
      SELECT 
        COUNT(*) as scrap_count,
        COALESCE(SUM(weight_kg), 0) as total_scrap_weight
      FROM scrap_inventory
      WHERE source_reference = $1
    `, [workOrderId]);
    
    res.json({
      success: true,
      data: {
        work_order: workOrder,
        material_issues: issuesQuery.rows[0],
        production_output: outputQuery.rows[0],
        scrap: scrapQuery.rows[0]
      }
    });
    
  } catch (error) {
    logger.error({ error, workOrderId: req.params.workOrderId }, 'API: Error fetching production summary');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch production summary'
    });
  }
}

/**
 * Start operation for a work order (Frontend API)
 * POST /api/production-api/start-operation/:woId
 */
export async function startOperation(req, res) {
  try {
    const { woId } = req.params;
    
    logger.info({ woId }, 'API: Starting operation');
    
    const query = `
      UPDATE work_order 
      SET status = 'IN_PROGRESS', 
          scheduled_start = COALESCE(scheduled_start, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE wo_id = $1
      RETURNING wo_id, wo_no, status, scheduled_start
    `;
    
    const result = await db.query(query, [woId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Work order not found'
      });
    }
    
    res.json({
      success: true,
      workOrder: result.rows[0],
      message: 'Operation started successfully'
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error starting operation');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start operation'
    });
  }
}

/**
 * Issue material to work order (Frontend API)
 * POST /api/production-api/issue-material/:woId
 * Body: { material_id, material_name, quantity, unit, location }
 */
export async function issueMaterialToWO(req, res) {
  try {
    const { woId } = req.params;
    const { material_id, material_name, quantity, unit, location } = req.body;
    
    if (!material_name || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Material name and quantity are required'
      });
    }
    
    logger.info({ woId, material_name, quantity }, 'API: Issuing material to work order');
    
    // Create material issue record
    const issueQuery = `
      INSERT INTO work_order_material_issue (
        issue_id, work_order_id, material_id, material_name, quantity_planned,
        quantity_issued, unit, unit_cost, issued_by, issued_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING issue_id
    `;
    
    const result = await db.query(issueQuery, [
      woId, material_id, material_name, quantity, unit, 0, 'system'
    ]);
    
    res.json({
      success: true,
      issueId: result.rows[0].issue_id,
      message: 'Material issued successfully'
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error issuing material');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to issue material'
    });
  }
}

/**
 * Record production output (Frontend API)
 * POST /api/production-api/record-output/:woId
 * Body: { output_type, product_id, blank_id, quantity, location, quality_status }
 */
export async function recordOutputForWO(req, res) {
  try {
    const { woId } = req.params;
    const { output_type, product_id, blank_id, quantity, location, quality_status } = req.body;
    
    if (!output_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Output type and quantity are required'
      });
    }
    
    logger.info({ woId, output_type, quantity }, 'API: Recording production output');
    
    // Create production output record
    const outputQuery = `
      INSERT INTO production_output (
        output_id, work_order_id, product_id, blank_id, item_type, item_name,
        quantity_planned, quantity_good, quantity_rejected, quantity_rework,
        quality_status, recorded_by, recorded_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, 0, 0, $7, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING output_id
    `;
    
    const itemName = output_type === 'BLANK' ? 'Blank' : 
                    output_type === 'FINISHED_GOOD' ? 'Finished Good' : 'Intermediate Product';
    
    const result = await db.query(outputQuery, [
      woId, product_id, blank_id, output_type, itemName, quantity, quality_status || 'PASS'
    ]);
    
    res.json({
      success: true,
      outputId: result.rows[0].output_id,
      message: 'Production output recorded successfully'
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error recording output');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record production output'
    });
  }
}

/**
 * Generate scrap (Frontend API)
 * POST /api/production-api/generate-scrap/:woId
 * Body: { material_name, quantity, source, reason, leftover_area_mm2 }
 */
export async function generateScrapForWO(req, res) {
  try {
    const { woId } = req.params;
    const { material_name, quantity, source, reason, leftover_area_mm2 } = req.body;
    
    if (!material_name || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Material name and quantity are required'
      });
    }
    
    logger.info({ woId, material_name, quantity }, 'API: Generating scrap');
    
    // Create scrap entry
    const scrapQuery = `
      INSERT INTO scrap_inventory (
        scrap_id, material_name, quantity, unit, source, reason, status,
        leftover_area_mm2, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'kg', $3, $4, 'AVAILABLE', $5, 'system', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING scrap_id
    `;
    
    const result = await db.query(scrapQuery, [
      material_name, quantity, source || 'Production', reason || 'Cutting loss', leftover_area_mm2 || 0
    ]);
    
    res.json({
      success: true,
      scrapId: result.rows[0].scrap_id,
      message: 'Scrap generated and recorded successfully'
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error generating scrap');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate scrap'
    });
  }
}

/**
 * Check operation dependencies (Frontend API)
 * GET /api/production-api/check-dependencies/:woId
 */
export async function checkOperationDependencies(req, res) {
  try {
    const { woId } = req.params;
    
    logger.info({ woId }, 'API: Checking operation dependencies');
    
    // Import the hierarchical work order service functions
    const { checkWorkOrderDependencies } = await import('../../services/hierarchicalWorkOrderService.js');
    
    const result = await checkWorkOrderDependencies(woId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error checking dependencies');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check dependencies'
    });
  }
}

/**
 * Complete operation (Frontend API)
 * POST /api/production-api/complete-operation/:woId
 */
export async function completeOperationForWO(req, res) {
  try {
    const { woId } = req.params;
    
    logger.info({ woId }, 'API: Completing operation');
    
    // Import the hierarchical work order service functions
    const { triggerNextWorkOrders } = await import('../../services/hierarchicalWorkOrderService.js');
    
    const query = `
      UPDATE work_order 
      SET status = 'COMPLETED',
          scheduled_end = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE wo_id = $1
      RETURNING wo_id, wo_no, status, operation_type, parent_wo_id, scheduled_start, scheduled_end
    `;
    
    const result = await db.query(query, [woId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Work order not found'
      });
    }
    
    const completedWorkOrder = result.rows[0];
    
    // Trigger next work orders that can now start
    let triggeredWorkOrders = [];
    try {
      triggeredWorkOrders = await triggerNextWorkOrders(woId);
      logger.info({ woId, triggeredCount: triggeredWorkOrders.length }, 'Triggered next work orders');
    } catch (triggerError) {
      logger.warn({ woId, error: triggerError.message }, 'Failed to trigger next work orders');
      // Don't fail the completion if triggering fails
    }
    
    res.json({
      success: true,
      workOrder: completedWorkOrder,
      triggeredWorkOrders: triggeredWorkOrders,
      message: `Operation completed successfully. ${triggeredWorkOrders.length} dependent operation(s) triggered.`
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error completing operation');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete operation'
    });
  }
}

export default {
  issueMaterial,
  recordOutput,
  generateScrap,
  completeOperation,
  getMaterialIssues,
  getProductionOutput,
  getProductionSummary,
  startOperation,
  issueMaterialToWO,
  recordOutputForWO,
  generateScrapForWO,
  completeOperationForWO,
  checkOperationDependencies
};

