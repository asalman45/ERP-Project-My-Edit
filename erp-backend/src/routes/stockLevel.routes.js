// src/routes/stockLevel.routes.js
import express from 'express';
import {
  getLowStockAlerts,
  getReorderSuggestions,
  setStockLevels,
  updateAllStockLevels,
  getStockLevelSummary
} from '../controllers/stockLevel.controller.js';

const router = express.Router();

/**
 * Stock Level Management Routes
 * Intelligent stock management and alerts
 */

// Get low stock alerts
router.get('/alerts', getLowStockAlerts);

// Get reorder suggestions
router.get('/reorder-suggestions', getReorderSuggestions);

// Get stock level summary
router.get('/summary', getStockLevelSummary);

// Update all stock levels
router.post('/update-all', updateAllStockLevels);

// Set stock levels for specific item
router.put('/:inventoryId', setStockLevels);

export default router;
