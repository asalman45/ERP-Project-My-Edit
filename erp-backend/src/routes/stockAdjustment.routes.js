// src/routes/stockAdjustment.routes.js
import express from 'express';
import {
  adjustStock,
  getStockAdjustmentHistory,
  getStockLevels,
  getStockMovementReport
} from '../controllers/stockAdjustment.controller.js';

const router = express.Router();

// Stock adjustment operations
router.post('/adjust', adjustStock);
router.get('/history', getStockAdjustmentHistory);
router.get('/levels', getStockLevels);
router.get('/movement-report', getStockMovementReport);

export default router;
