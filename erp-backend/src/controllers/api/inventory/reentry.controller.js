// src/controllers/api/inventory/reentry.controller.js
import { PrismaClient } from '@prisma/client';
import inventoryService from '../../../services/inventory.service.js';
import { logger } from '../../../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Re-entry API Controller
 * Handles wastage re-entry and scrap reprocessing
 */

/**
 * POST /api/inventory/reentry
 * Re-entry wastage back to inventory
 */
export const reentryWastage = async (req, res) => {
  try {
    const {
      wastage_id,
      quantity,
      location_id,
      reason = 'Wastage re-entry',
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation
    if (!wastage_id || !quantity || !location_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: wastage_id, quantity, location_id'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Re-entry quantity must be positive'
      });
    }

    // Business Logic: Re-entry Wastage
    const result = await inventoryService.reentryWastage(wastage_id, quantity, location_id, {
      createdBy: created_by,
      reason: reason
    });

    logger.info({
      wastage_id,
      quantity_reentered: quantity,
      location_id
    }, 'Wastage re-entry completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Wastage re-entry completed successfully',
      data: {
        wastage: result.wastage,
        stock_added: result.stockAdded
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Failed to re-entry wastage');

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to re-entry wastage'
    });
  }
};

/**
 * POST /api/inventory/reentry/bulk
 * Bulk re-entry multiple wastage records
 */
export const bulkReentryWastage = async (req, res) => {
  try {
    const {
      reentries,
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation
    if (!reentries || !Array.isArray(reentries) || reentries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: reentries (array)'
      });
    }

    const results = [];
    const errors = [];

    // Process each re-entry
    for (const reentry of reentries) {
      try {
        if (!reentry.wastage_id || !reentry.quantity || !reentry.location_id) {
          errors.push({
            wastage_id: reentry.wastage_id,
            error: 'Missing required fields: wastage_id, quantity, location_id'
          });
          continue;
        }

        const result = await inventoryService.reentryWastage(
          reentry.wastage_id,
          reentry.quantity,
          reentry.location_id,
          {
            createdBy: created_by,
            reason: reentry.reason || 'Bulk wastage re-entry'
          }
        );

        results.push({
          wastage_id: reentry.wastage_id,
          success: true,
          result: result
        });

      } catch (error) {
        errors.push({
          wastage_id: reentry.wastage_id,
          error: error.message
        });
      }
    }

    logger.info({
      reentries_count: reentries.length,
      successful: results.length,
      failed: errors.length
    }, 'Bulk wastage re-entry completed');

    return res.status(200).json({
      success: true,
      message: `Bulk wastage re-entry completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Bulk wastage re-entry failed');

    return res.status(500).json({
      success: false,
      error: 'Failed to process bulk wastage re-entry'
    });
  }
};

/**
 * GET /api/inventory/reentry/history
 * Get re-entry history
 */
export const getReentryHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, material_id, location_id, start_date, end_date } = req.query;

    // Build query conditions
    const whereClause = {
      txn_type: 'RECEIVE',
      reference: { contains: 'REENTRY' }
    };

    if (material_id) whereClause.material_id = material_id;
    if (location_id) whereClause.location_id = location_id;
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) whereClause.created_at.gte = new Date(start_date);
      if (end_date) whereClause.created_at.lte = new Date(end_date);
    }

    const transactions = await prisma.inventoryTxn.findMany({
      where: whereClause,
      include: {
        material: true,
        location: true,
        wastage: true
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: transactions.length
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get re-entry history');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve re-entry history'
    });
  }
};

/**
 * GET /api/inventory/reentry/available
 * Get available wastage for re-entry
 */
export const getAvailableWastageForReentry = async (req, res) => {
  try {
    const { limit = 50, offset = 0, material_id, location_id, wo_id } = req.query;

    // Build query conditions
    const whereClause = {
      quantity: { gt: 0 } // Only wastage with available quantity
    };

    if (material_id) whereClause.material_id = material_id;
    if (location_id) whereClause.location_id = location_id;
    if (wo_id) whereClause.wo_id = wo_id;

    const wastages = await prisma.wastage.findMany({
      where: whereClause,
      include: {
        material: true,
        location: true,
        workOrder: {
          include: {
            product: true
          }
        },
        step: true
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: wastages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: wastages.length
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get available wastage for re-entry');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve available wastage for re-entry'
    });
  }
};
