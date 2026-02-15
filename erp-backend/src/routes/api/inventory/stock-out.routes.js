// src/routes/api/inventory/stock-out.routes.js
import express from 'express';
import { stockOut, bulkStockOut, getStockOutHistory } from '../../../controllers/api/inventory/stock-out.controller.js';

const router = express.Router();

/**
 * Stock Out Routes
 * POST /api/inventory/stock-out - Reduce inventory (Stock Out)
 * POST /api/inventory/stock-out/bulk - Bulk stock out for production
 * GET /api/inventory/stock-out/history - Get stock out history
 */

// Stock Out
router.post('/', stockOut);

// Bulk Stock Out
router.post('/bulk', bulkStockOut);

// Stock Out History
router.get('/history', getStockOutHistory);

export default router;
