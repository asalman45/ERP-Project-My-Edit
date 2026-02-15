// src/routes/api/inventory/index.js
import express from 'express';
import stockInRoutes from './stock-in.routes.js';
import stockOutRoutes from './stock-out.routes.js';
import wastageRoutes from './wastage.routes.js';
import finishedGoodsRoutes from './finished-goods.routes.js';
import reentryRoutes from './reentry.routes.js';
import currentStockRoutes from './current-stock.routes.js';
import qualityAssuranceController from '../../../controllers/api/qualityAssurance.controller.js';
import { importInventory, exportInventory, uploadMiddleware } from '../../../controllers/inventory.controller.js';

const router = express.Router();

/**
 * Main Inventory API Router
 * Combines all inventory-related routes
 * 
 * API Structure:
 * /api/inventory/stock-in/* - Stock In operations
 * /api/inventory/stock-out/* - Stock Out operations  
 * /api/inventory/wastage/* - Wastage management
 * /api/inventory/finished-goods/* - Finished goods management
 * /api/inventory/reentry/* - Wastage re-entry operations
 * /api/inventory/current-stock/* - Current stock inquiries
 */

// Mount sub-routes
router.use('/stock-in', stockInRoutes);
router.use('/stock-out', stockOutRoutes);
router.use('/wastage', wastageRoutes);
router.use('/finished-goods', finishedGoodsRoutes);
router.use('/reentry', reentryRoutes);
router.use('/current-stock', currentStockRoutes);

// Quality Assurance endpoints
router.get('/by-location-type', qualityAssuranceController.getInventoryByLocationType);

// Import/Export endpoints
router.post('/import', uploadMiddleware, importInventory);
router.get('/export', exportInventory);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Inventory API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      stockIn: '/api/inventory/stock-in',
      stockOut: '/api/inventory/stock-out',
      wastage: '/api/inventory/wastage',
      finishedGoods: '/api/inventory/finished-goods',
      reentry: '/api/inventory/reentry',
      currentStock: '/api/inventory/current-stock'
    }
  });
});

export default router;
