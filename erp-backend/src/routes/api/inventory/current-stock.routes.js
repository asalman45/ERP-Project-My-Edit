// src/routes/api/inventory/current-stock.routes.js
import express from 'express';
import { 
  getCurrentStock, 
  getAllCurrentStock, 
  getInventorySummary, 
  getLowStockItems, 
  getZeroStockItems 
} from '../../../controllers/api/inventory/current-stock.controller.js';

const router = express.Router();

/**
 * Current Stock Routes
 * GET /api/inventory/current-stock - Get current stock for specific item
 * GET /api/inventory/current-stock/all - Get all current stock levels
 * GET /api/inventory/current-stock/summary - Get inventory summary by location
 * GET /api/inventory/current-stock/low-stock - Get low stock items
 * GET /api/inventory/current-stock/zero-stock - Get zero stock items
 */

// Get Current Stock
router.get('/', getCurrentStock);

// Get All Current Stock
router.get('/all', getAllCurrentStock);

// Get Inventory Summary
router.get('/summary', getInventorySummary);

// Get Low Stock Items
router.get('/low-stock', getLowStockItems);

// Get Zero Stock Items
router.get('/zero-stock', getZeroStockItems);

export default router;
