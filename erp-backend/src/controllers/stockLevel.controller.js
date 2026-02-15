// src/controllers/stockLevel.controller.js
import stockLevelService from '../services/stockLevel.service.js';
import { logger } from '../utils/logger.js';

/**
 * Stock Level Management Controller
 * Handles intelligent stock level management and alerts
 */

/**
 * GET /api/stock-levels/alerts
 * Get low stock alerts
 */
export const getLowStockAlerts = async (req, res) => {
  try {
    const alerts = await stockLevelService.getLowStockAlerts();
    
    logger.info({ alert_count: alerts.length }, 'Low stock alerts retrieved');
    
    return res.status(200).json({
      success: true,
      data: {
        alerts,
        total_alerts: alerts.length,
        critical_count: alerts.filter(a => a.urgency === 'CRITICAL').length,
        high_count: alerts.filter(a => a.urgency === 'HIGH').length,
        medium_count: alerts.filter(a => a.urgency === 'MEDIUM').length
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get low stock alerts');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve low stock alerts'
    });
  }
};

/**
 * GET /api/stock-levels/reorder-suggestions
 * Get intelligent reorder suggestions
 */
export const getReorderSuggestions = async (req, res) => {
  try {
    const suggestions = await stockLevelService.generateReorderSuggestions();
    
    logger.info({ suggestion_count: suggestions.length }, 'Reorder suggestions generated');
    
    return res.status(200).json({
      success: true,
      data: {
        suggestions,
        total_suggestions: suggestions.length,
        total_estimated_cost: suggestions.reduce((sum, s) => sum + (s.estimated_cost || 0), 0),
        priority_breakdown: {
          critical: suggestions.filter(s => s.urgency === 'CRITICAL').length,
          high: suggestions.filter(s => s.urgency === 'HIGH').length,
          medium: suggestions.filter(s => s.urgency === 'MEDIUM').length
        }
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get reorder suggestions');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate reorder suggestions'
    });
  }
};

/**
 * PUT /api/stock-levels/:inventoryId
 * Set stock levels for an item
 */
export const setStockLevels = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { min_stock, max_stock, reorder_qty } = req.body;
    
    if (min_stock < 0 || max_stock < 0 || reorder_qty < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock levels cannot be negative'
      });
    }
    
    if (min_stock > max_stock) {
      return res.status(400).json({
        success: false,
        error: 'Minimum stock cannot be greater than maximum stock'
      });
    }
    
    const updated = await stockLevelService.setStockLevels(inventoryId, {
      min_stock,
      max_stock,
      reorder_qty
    });
    
    logger.info({ inventory_id: inventoryId, levels: { min_stock, max_stock, reorder_qty } }, 'Stock levels updated');
    
    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Stock levels updated successfully'
    });
  } catch (error) {
    logger.error({ error: error.message, inventory_id: req.params.inventoryId }, 'Failed to set stock levels');
    return res.status(500).json({
      success: false,
      error: 'Failed to update stock levels'
    });
  }
};

/**
 * POST /api/stock-levels/update-all
 * Update stock levels for all items
 */
export const updateAllStockLevels = async (req, res) => {
  try {
    const result = await stockLevelService.updateStockLevels();
    
    logger.info({ updated_count: result.updated_count }, 'All stock levels updated');
    
    return res.status(200).json({
      success: true,
      data: result,
      message: `${result.updated_count} items updated successfully`
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update all stock levels');
    return res.status(500).json({
      success: false,
      error: 'Failed to update stock levels'
    });
  }
};

/**
 * GET /api/stock-levels/summary
 * Get stock level summary
 */
export const getStockLevelSummary = async (req, res) => {
  try {
    const summary = await stockLevelService.getStockLevelSummary();
    
    logger.info('Stock level summary retrieved');
    
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get stock level summary');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve stock level summary'
    });
  }
};
