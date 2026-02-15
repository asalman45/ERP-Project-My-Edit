// src/routes/api/inventory/finished-goods.routes.js
import express from 'express';
import { 
  receiveFinishedGoods, 
  bulkReceiveFinishedGoods, 
  getFinishedGoods, 
  getFinishedGoodsHistory,
  getFinishedGoodsDispatchableBalance,
  exportFinishedGoods
} from '../../../controllers/api/inventory/finished-goods.controller.js';

const router = express.Router();

/**
 * Finished Goods Routes
 * POST /api/inventory/finished-goods - Receive finished goods from production
 * POST /api/inventory/finished-goods/bulk - Bulk receive finished goods
 * GET /api/inventory/finished-goods - Get finished goods inventory
 * GET /api/inventory/finished-goods/history - Get finished goods receive history
 */

// Receive Finished Goods
router.post('/', receiveFinishedGoods);

// Bulk Receive Finished Goods
router.post('/bulk', bulkReceiveFinishedGoods);

// Get Finished Goods
router.get('/', getFinishedGoods);

// Get Finished Goods History
router.get('/history', getFinishedGoodsHistory);

// Get Dispatchable Balance
router.get('/dispatchable-balance', getFinishedGoodsDispatchableBalance);

// Export Finished Goods
router.get('/export', exportFinishedGoods);

export default router;
