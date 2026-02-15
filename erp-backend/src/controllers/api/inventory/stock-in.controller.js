// src/controllers/api/inventory/stock-in.controller.js
import { PrismaClient } from '@prisma/client';
import inventoryService from '../../../services/inventory.service.js';
import { logger } from '../../../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Stock In API Controller
 * Handles raw material purchases and inventory additions
 */

/**
 * POST /api/inventory/stock-in
 * Add inventory (Stock In)
 */
export const stockIn = async (req, res) => {
  try {
    const {
      material_id,
      quantity,
      location_id, // Optional - will be auto-set to MAIN_STORE
      po_id,
      batch_no,
      unit_cost,
      reference,
      procurement_request_id,
      created_by = req.user?.id || 'system'
    } = req.body;

    // Validation - location_id is no longer required
    if (!material_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: material_id, quantity'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be positive'
      });
    }

    // Business Logic: Stock In (location_id is automatically set to MAIN_STORE)
    const result = await inventoryService.stockIn(material_id, quantity, null, {
      poId: po_id,
      batchNo: batch_no,
      unitCost: unit_cost,
      createdBy: created_by,
      reference: reference,
      procurementRequestId: procurement_request_id
    });

    logger.info({
      material_id,
      quantity,
      location_id: 'MAIN_STORE (fixed)',
      inventory_id: result.inventory.inventory_id
    }, 'Stock in completed successfully');

    return res.status(200).json({
      success: true,
      message: 'Stock added successfully',
      data: {
        inventory: result.inventory,
        transaction: result.transaction,
        new_quantity: result.newQuantity
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      body: req.body
    }, 'Stock in failed');

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to add stock'
    });
  }
};

/**
 * GET /api/inventory/stock-in/history
 * Get stock in history
 */
export const getStockInHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, material_id, location_id, start_date, end_date } = req.query;

    // Build query conditions
    const whereClause = {
      txn_type: 'RECEIVE'
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
        purchaseOrder: true
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
    }, 'Failed to get stock in history');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock in history'
    });
  }
};
