// src/controllers/api/inventory/wastage.controller.js
import { PrismaClient } from '@prisma/client';
import inventoryService from '../../../services/inventory.service.js';
import { logger } from '../../../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Wastage API Controller
 * Handles material wastage recording and re-entry
 */

/**
 * POST /api/inventory/wastage
 * Record material wastage
 */
export const recordWastage = async (req, res) => {
  try {
    const {
      material_id,
      quantity,
      location_id,
      wo_id,
      step_id,
      reason = 'Production wastage',
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation
    if (!material_id || !quantity || !location_id || !wo_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: material_id, quantity, location_id, wo_id'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Wastage quantity must be positive'
      });
    }

    // Business Logic: Record Wastage
    const result = await inventoryService.recordWastage(material_id, quantity, location_id, {
      woId: wo_id,
      stepId: step_id,
      reason: reason,
      createdBy: created_by
    });

    logger.info({
      wastage_id: result.wastage.wastage_id,
      material_id,
      quantity,
      wo_id,
      step_id
    }, 'Wastage recorded successfully');

    return res.status(200).json({
      success: true,
      message: 'Wastage recorded successfully',
      data: {
        wastage: result.wastage,
        inventory_change: result.inventoryChange
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Failed to record wastage');

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to record wastage'
    });
  }
};

/**
 * POST /api/inventory/wastage/reentry
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
 * GET /api/inventory/wastage
 * Get wastage records
 */
export const getWastageRecords = async (req, res) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      material_id, 
      wo_id, 
      location_id, 
      start_date, 
      end_date 
    } = req.query;

    // Build query conditions
    const whereClause = {};
    
    if (material_id) whereClause.material_id = material_id;
    if (wo_id) whereClause.wo_id = wo_id;
    if (location_id) whereClause.location_id = location_id;
    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) whereClause.created_at.gte = new Date(start_date);
      if (end_date) whereClause.created_at.lte = new Date(end_date);
    }

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
    }, 'Failed to get wastage records');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve wastage records'
    });
  }
};

/**
 * GET /api/inventory/wastage/summary
 * Get wastage summary by material or work order
 */
export const getWastageSummary = async (req, res) => {
  try {
    const { group_by = 'material', wo_id, material_id } = req.query;

    let summary;

    if (group_by === 'material') {
      // Group by material
      summary = await prisma.wastage.groupBy({
        by: ['material_id'],
        _sum: { quantity: true },
        _count: { wastage_id: true },
        where: material_id ? { material_id } : {}
      });

      // Get material details
      const materials = await prisma.material.findMany({
        where: {
          material_id: {
            in: summary.map(s => s.material_id)
          }
        }
      });

      summary = summary.map(s => {
        const material = materials.find(m => m.material_id === s.material_id);
        return {
          material_id: s.material_id,
          material_name: material?.name || 'Unknown',
          material_code: material?.material_code || 'UNK',
          total_wastage: s._sum.quantity || 0,
          wastage_count: s._count.wastage_id
        };
      });

    } else if (group_by === 'work_order') {
      // Group by work order
      summary = await prisma.wastage.groupBy({
        by: ['wo_id'],
        _sum: { quantity: true },
        _count: { wastage_id: true },
        where: wo_id ? { wo_id } : {}
      });

      // Get work order details
      const workOrders = await prisma.workOrder.findMany({
        where: {
          wo_id: {
            in: summary.map(s => s.wo_id)
          }
        },
        include: {
          product: true
        }
      });

      summary = summary.map(s => {
        const workOrder = workOrders.find(wo => wo.wo_id === s.wo_id);
        return {
          wo_id: s.wo_id,
          wo_no: workOrder?.wo_no || 'Unknown',
          product_name: workOrder?.product?.part_name || 'Unknown',
          total_wastage: s._sum.quantity || 0,
          wastage_count: s._count.wastage_id
        };
      });
    }

    return res.status(200).json({
      success: true,
      data: summary,
      group_by: group_by
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get wastage summary');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve wastage summary'
    });
  }
};
