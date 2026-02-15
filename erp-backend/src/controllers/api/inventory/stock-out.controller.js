// src/controllers/api/inventory/stock-out.controller.js
import { PrismaClient } from '@prisma/client';
import inventoryService from '../../../services/inventory.service.js';
import { logger } from '../../../utils/logger.js';
import db from '../../../utils/db.js';

const prisma = new PrismaClient();

async function getDefaultLocationId(provided) {
  if (provided) return provided;
  try {
    const def = await prisma.location.findFirst({ where: { is_default: true }, select: { location_id: true } });
    if (def?.location_id) return def.location_id;
  } catch {}
  const any = await prisma.location.findFirst({ select: { location_id: true } });
  return any?.location_id || null;
}

/**
 * Stock Out API Controller
 * Handles material consumption for production
 */

/**
 * POST /api/inventory/stock-out
 * Reduce inventory (Stock Out for Production)
 */
export const stockOut = async (req, res) => {
  try {
    const {
      material_id,
      quantity,
      location_id: provided_location_id,
      wo_id,
      reference,
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation
    const location_id = await getDefaultLocationId(provided_location_id);
    if (!material_id || !quantity || !location_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: material_id, quantity, location_id (no default found)'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }

    // Business Logic: Stock Out
    const result = await inventoryService.stockOut(material_id, quantity, location_id, {
      woId: wo_id,
      createdBy: created_by,
      reference: reference
    });

    logger.info({
      material_id,
      quantity,
      location_id,
      wo_id,
      inventory_id: result.inventory.inventory_id
    }, 'Stock out completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Stock reduced successfully',
      data: {
        inventory: result.inventory,
        transaction: result.transaction,
        new_quantity: result.newQuantity,
        quantity_consumed: result.quantityChange
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Stock out failed');

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reduce stock'
    });
  }
};

/**
 * POST /api/inventory/stock-out/bulk
 * Bulk stock out for multiple materials (Production Issue)
 */
export const bulkStockOut = async (req, res) => {
  try {
    const {
      wo_id,
      materials,
      location_id: provided_location_id,
      reference,
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation
    if (!wo_id || !materials || !Array.isArray(materials) || materials.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: wo_id, materials (array)'
      });
    }

    const location_id = await getDefaultLocationId(provided_location_id);
    if (!location_id) {
      return res.status(400).json({ success: false, error: 'Missing location_id and no default found' });
    }

    const results = [];
    const errors = [];

    // Process each material
    for (const material of materials) {
      try {
        if (!material.material_id || !material.quantity) {
          errors.push({
            material_id: material.material_id,
            error: 'Missing material_id or quantity'
          });
          continue;
        }

        const result = await inventoryService.stockOut(
          material.material_id,
          material.quantity,
          location_id,
          {
            woId: wo_id,
            createdBy: created_by,
            reference: reference || `BULK-ISSUE-${wo_id}`
          }
        );

        // ✅ Also create work_order_material_issue record for scrap calculation
        if (wo_id) {
          try {
            await db.query(`
              INSERT INTO work_order_material_issue (
                work_order_id,
                material_id,
                material_type,
                quantity_planned,
                quantity_issued,
                unit_cost,
                total_cost,
                issued_by,
                status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              wo_id,
              material.material_id,
              material.material_type || 'SHEET',
              material.quantity,
              material.quantity,
              material.unit_cost || 0,
              material.quantity * (material.unit_cost || 0),
              created_by,
              'ISSUED'
            ]);
            
            logger.info({ wo_id, material_id: material.material_id, quantity: material.quantity }, 
              'Created work_order_material_issue record for scrap calculation');
          } catch (issueError) {
            logger.warn({ wo_id, material_id: material.material_id, error: issueError.message }, 
              'Failed to create work_order_material_issue record (non-critical)');
          }
        }

        results.push({
          material_id: material.material_id,
          success: true,
          result: result
        });

      } catch (error) {
        errors.push({
          material_id: material.material_id,
          error: error.message
        });
      }
    }

    logger.info({
      wo_id,
      materials_count: materials.length,
      successful: results.length,
      failed: errors.length
    }, 'Bulk stock out completed');

    return res.status(200).json({
      success: true,
      message: `Bulk stock out completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        errors: errors
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Bulk stock out failed');

    return res.status(500).json({
      success: false,
      error: 'Failed to process bulk stock out'
    });
  }
};

/**
 * GET /api/inventory/stock-out/history
 * Get stock out history
 */
export const getStockOutHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, material_id, location_id, wo_id, start_date, end_date } = req.query;

    // Build query conditions
    const whereClause = {
      txn_type: 'ISSUE'
    };

    if (material_id) whereClause.material_id = material_id;
    if (location_id) whereClause.location_id = location_id;
    if (wo_id) whereClause.wo_id = wo_id;
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
        workOrder: true
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
    }, 'Failed to get stock out history');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock out history'
    });
  }
};
