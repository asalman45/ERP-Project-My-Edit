// src/controllers/purchaseOrder.controller.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Purchase Order Controller
 * Handles purchase order operations (mock implementation)
 */

/**
 * GET /api/purchase-orders
 * Return an empty list (placeholder)
 */
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = {
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        hasMore: false
      }
    };

    logger.info({ result }, 'Purchase orders retrieved (mock)');
    return res.status(200).json(result);
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get purchase orders');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve purchase orders'
    });
  }
};

/**
 * POST /api/purchase-orders
 * Create a purchase order (mock)
 */
export const createPurchaseOrder = async (req, res) => {
  try {
    const result = {
      success: true,
      data: {
        id: `mock-id-${Date.now()}`,
        ...req.body,
        created_at: new Date().toISOString()
      }
    };

    logger.info({ result }, 'Purchase order created (mock)');
    return res.status(201).json(result);
  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to create purchase order');

    return res.status(500).json({
      success: false,
      error: 'Failed to create purchase order'
    });
  }
};
