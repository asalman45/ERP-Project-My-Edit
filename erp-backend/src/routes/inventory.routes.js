// src/routes/inventory.routes.js
import express from 'express';
import {
  listInventory, getInventory, createInventory, updateInventory, deleteInventory,
  listTransactions, createTransaction, getInventoryTransactions,
  importInventory, exportInventory, uploadMiddleware
} from '../controllers/inventory.controller.js';
import goodsReceiptController from '../controllers/goodsReceipt.controller.js';
import qualityAssuranceController from '../controllers/api/qualityAssurance.controller.js';

const router = express.Router();

// Import/Export endpoints (must be before /:id routes)
router.post('/import', uploadMiddleware, importInventory);
router.get('/export', exportInventory);

// Stock-In endpoint (from GRN)
router.get('/stock-in', goodsReceiptController.getStockIn);

// Quality Assurance endpoint (must be before /:id route to avoid route conflict)
router.get('/by-location-type', qualityAssuranceController.getInventoryByLocationType);

// Inventory CRUD
router.get('/', listInventory);
router.get('/:id', getInventory);
router.post('/', createInventory);
router.patch('/:id', updateInventory);
router.delete('/:id', deleteInventory);

// Transaction endpoints
router.get('/transactions/list', listTransactions);
router.post('/transactions', createTransaction);
router.get('/:inventoryId/transactions', getInventoryTransactions);

export default router;
