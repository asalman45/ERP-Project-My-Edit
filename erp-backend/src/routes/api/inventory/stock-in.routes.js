// src/routes/api/inventory/stock-in.routes.js
import express from 'express';
import { stockIn, getStockInHistory } from '../../../controllers/api/inventory/stock-in.controller.js';

const router = express.Router();

/**
 * Stock In Routes
 * POST /api/inventory/stock-in - Add inventory (Stock In)
 * GET /api/inventory/stock-in/history - Get stock in history
 */

// Stock In
router.post('/', stockIn);

// Stock In History
router.get('/history', getStockInHistory);

export default router;
