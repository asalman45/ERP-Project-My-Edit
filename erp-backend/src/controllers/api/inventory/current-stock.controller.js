// src/controllers/api/inventory/current-stock.controller.js
import { PrismaClient } from '@prisma/client';
import inventoryService from '../../../services/inventory.service.js';
import { logger } from '../../../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Current Stock API Controller
 * Handles current stock inquiries and inventory levels
 */

/**
 * GET /api/inventory/current-stock
 * Get current stock levels
 */
export const getCurrentStock = async (req, res) => {
  try {
    const { item_id, item_type, location_id } = req.query;

    // Validation
    if (!item_id || !item_type || !location_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: item_id, item_type, location_id'
      });
    }

    if (!['material', 'product'].includes(item_type)) {
      return res.status(400).json({
        success: false,
        error: 'item_type must be either "material" or "product"'
      });
    }

    // Get current stock
    const stockInfo = await inventoryService.getCurrentStock(item_id, item_type, location_id);

    return res.status(200).json({
      success: true,
      data: {
        item_id,
        item_type,
        location_id,
        available_quantity: stockInfo.available,
        inventory: stockInfo.inventory
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get current stock');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve current stock'
    });
  }
};

/**
 * GET /api/inventory/current-stock/all
 * Get all current stock levels
 */
export const getAllCurrentStock = async (req, res) => {
  try {
    const { limit = 100, offset = 0, item_type, location_id, min_quantity, max_quantity } = req.query;

    // Build query conditions
    const whereClause = {
      status: 'AVAILABLE'
    };

    if (item_type === 'material') {
      whereClause.material_id = { not: null };
    } else if (item_type === 'product') {
      whereClause.product_id = { not: null };
    }

    if (location_id) whereClause.location_id = location_id;
    if (min_quantity !== undefined || max_quantity !== undefined) {
      whereClause.quantity = {};
      if (min_quantity !== undefined) whereClause.quantity.gte = parseFloat(min_quantity);
      if (max_quantity !== undefined) whereClause.quantity.lte = parseFloat(max_quantity);
    }

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        material: true,
        product: {
          include: {
            oem: true,
            model: true
          }
        },
        location: true,
        uom: true
      },
      orderBy: { updated_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: inventory,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: inventory.length
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get all current stock');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve current stock levels'
    });
  }
};

/**
 * GET /api/inventory/current-stock/summary
 * Get inventory summary by location
 */
export const getInventorySummary = async (req, res) => {
  try {
    const summary = await inventoryService.getInventorySummary();

    return res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error({
      error: error.message
    }, 'Failed to get inventory summary');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve inventory summary'
    });
  }
};

/**
 * GET /api/inventory/current-stock/low-stock
 * Get low stock items
 */
export const getLowStockItems = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Find items with low stock (quantity <= min_stock)
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        status: 'AVAILABLE',
        OR: [
          {
            material: {
              min_stock: { not: null }
            },
            quantity: {
              lte: prisma.material.fields.min_stock
            }
          },
          {
            product: {
              min_stock: { not: null }
            },
            quantity: {
              lte: prisma.product.fields.min_stock
            }
          }
        ]
      },
      include: {
        material: true,
        product: {
          include: {
            oem: true,
            model: true
          }
        },
        location: true,
        uom: true
      },
      orderBy: { quantity: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: lowStockItems,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: lowStockItems.length
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get low stock items');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve low stock items'
    });
  }
};

/**
 * GET /api/inventory/current-stock/zero-stock
 * Get zero stock items
 */
export const getZeroStockItems = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const zeroStockItems = await prisma.inventory.findMany({
      where: {
        status: 'AVAILABLE',
        quantity: 0
      },
      include: {
        material: true,
        product: {
          include: {
            oem: true,
            model: true
          }
        },
        location: true,
        uom: true
      },
      orderBy: { updated_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      data: zeroStockItems,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: zeroStockItems.length
      }
    });

  } catch (error) {
    logger.error({
      error: error.message,
      query: req.query
    }, 'Failed to get zero stock items');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve zero stock items'
    });
  }
};
