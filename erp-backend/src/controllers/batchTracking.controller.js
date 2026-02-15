// src/controllers/batchTracking.controller.js
import batchTrackingService from '../services/batchTracking.service.js';
import { logger } from '../utils/logger.js';

/**
 * Batch Tracking Controller
 * Handles FIFO/LIFO batch management and expiry tracking
 */

/**
 * POST /api/batch-tracking/batch
 * Create a new batch
 */
export const createBatch = async (req, res) => {
  try {
    const {
      inventory_id,
      batch_no,
      quantity,
      unit_cost,
      expiry_date,
      supplier_id,
      received_date,
      quality_status,
      created_by = req.user?.id || 'system'
    } = req.body;

    if (!inventory_id || !batch_no || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: inventory_id, batch_no, quantity'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }

    const batch = await batchTrackingService.createBatch({
      inventory_id,
      batch_no,
      quantity,
      unit_cost,
      expiry_date,
      supplier_id,
      received_date,
      quality_status,
      created_by
    });

    logger.info({ batch_id: batch.batch_id, batch_no, inventory_id }, 'Batch created successfully');

    return res.status(201).json({
      success: true,
      data: batch,
      message: 'Batch created successfully'
    });
  } catch (error) {
    logger.error({ error: error.message, body: req.body }, 'Failed to create batch');
    return res.status(500).json({
      success: false,
      error: 'Failed to create batch'
    });
  }
};

/**
 * GET /api/batch-tracking/inventory/:inventoryId
 * Get batches for inventory item
 */
export const getBatchesForItem = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { sort_method = 'FIFO' } = req.query;

    if (!['FIFO', 'LIFO'].includes(sort_method)) {
      return res.status(400).json({
        success: false,
        error: 'sort_method must be either FIFO or LIFO'
      });
    }

    const batches = await batchTrackingService.getBatchesForItem(inventoryId, sort_method);

    logger.info({ inventory_id: inventoryId, batch_count: batches.length, sort_method }, 'Batches retrieved');

    return res.status(200).json({
      success: true,
      data: {
        batches,
        total_batches: batches.length,
        sort_method,
        inventory_id: inventoryId
      }
    });
  } catch (error) {
    logger.error({ error: error.message, inventoryId: req.params.inventoryId }, 'Failed to get batches for item');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve batches'
    });
  }
};

/**
 * POST /api/batch-tracking/consume
 * Consume batch quantity using FIFO/LIFO
 */
export const consumeBatchQuantity = async (req, res) => {
  try {
    const {
      inventory_id,
      quantity,
      sort_method = 'FIFO',
      wo_id,
      reference,
      created_by = req.user?.id || 'system'
    } = req.body;

    if (!inventory_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: inventory_id, quantity'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }

    if (!['FIFO', 'LIFO'].includes(sort_method)) {
      return res.status(400).json({
        success: false,
        error: 'sort_method must be either FIFO or LIFO'
      });
    }

    const result = await batchTrackingService.consumeBatchQuantity(
      inventory_id, 
      quantity, 
      sort_method, 
      { wo_id, reference, created_by }
    );

    logger.info({ 
      inventory_id, 
      quantity, 
      sort_method, 
      batch_count: result.consumed_batches.length 
    }, 'Batch quantity consumed successfully');

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Batch quantity consumed successfully'
    });
  } catch (error) {
    logger.error({ error: error.message, body: req.body }, 'Failed to consume batch quantity');
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to consume batch quantity'
    });
  }
};

/**
 * GET /api/batch-tracking/expiry-warnings
 * Get expiry warnings for batches
 */
export const getExpiryWarnings = async (req, res) => {
  try {
    const { days_before_expiry = 30 } = req.query;

    const warnings = await batchTrackingService.getExpiryWarnings(parseInt(days_before_expiry));

    logger.info({ warning_count: warnings.length, days_before_expiry }, 'Expiry warnings retrieved');

    return res.status(200).json({
      success: true,
      data: {
        warnings,
        total_warnings: warnings.length,
        critical_count: warnings.filter(w => w.urgency === 'CRITICAL').length,
        high_count: warnings.filter(w => w.urgency === 'HIGH').length,
        medium_count: warnings.filter(w => w.urgency === 'MEDIUM').length,
        days_before_expiry: parseInt(days_before_expiry)
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get expiry warnings');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve expiry warnings'
    });
  }
};

/**
 * GET /api/batch-tracking/summary/:inventoryId
 * Get batch summary for inventory item
 */
export const getBatchSummary = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const summary = await batchTrackingService.getBatchSummary(inventoryId);

    logger.info({ inventory_id: inventoryId }, 'Batch summary retrieved');

    return res.status(200).json({
      success: true,
      data: {
        inventory_id: inventoryId,
        ...summary
      }
    });
  } catch (error) {
    logger.error({ error: error.message, inventoryId: req.params.inventoryId }, 'Failed to get batch summary');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve batch summary'
    });
  }
};
