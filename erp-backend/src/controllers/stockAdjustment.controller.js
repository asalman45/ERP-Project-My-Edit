// src/controllers/stockAdjustment.controller.js
import * as stockAdjustmentService from '../services/stockAdjustment.service.js';
import { 
  validateStockAdjustment, 
  validateStockAdjustmentHistory, 
  validateStockLevels, 
  validateStockMovement 
} from '../validators/stockAdjustment.validator.js';
import { logger } from '../utils/logger.js';

export const adjustStock = async (req, res) => {
  const { error, value } = validateStockAdjustment(req.body);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const result = await stockAdjustmentService.adjustStock({
      ...value,
      created_by: req.user?.id || 'system'
    });
    
    logger.info({ 
      item_id: value.product_id || value.material_id,
      adjustment_type: value.adjustment_type,
      quantity: value.quantity,
      inventory_txn_id: result.transaction.txn_id
    }, 'Stock adjustment completed');
    
    return res.status(201).json({ 
      success: true, 
      data: result, 
      message: 'Stock adjustment completed successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to adjust stock');
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to adjust stock. Please try again.' 
    });
  }
};

export const getStockAdjustmentHistory = async (req, res) => {
  const { error, value } = validateStockAdjustmentHistory(req.query);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const history = await stockAdjustmentService.getStockAdjustmentHistory(value);
    return res.json({ 
      success: true, 
      data: history, 
      message: 'Stock adjustment history retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve stock adjustment history');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve stock adjustment history. Please try again.' 
    });
  }
};

export const getStockLevels = async (req, res) => {
  const { error, value } = validateStockLevels(req.query);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const stockLevels = await stockAdjustmentService.getStockLevels(value);
    return res.json({ 
      success: true, 
      data: stockLevels, 
      message: 'Stock levels retrieved successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to retrieve stock levels');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve stock levels. Please try again.' 
    });
  }
};

export const getStockMovementReport = async (req, res) => {
  const { error, value } = validateStockMovement(req.query);
  if (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.details.map(d => d.message) 
    });
  }

  try {
    const movementReport = await stockAdjustmentService.getStockMovementReport(value);
    return res.json({ 
      success: true, 
      data: movementReport, 
      message: 'Stock movement report generated successfully' 
    });
  } catch (err) {
    logger.error({ err }, 'Failed to generate stock movement report');
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate stock movement report. Please try again.' 
    });
  }
};
