// src/routes/purchaseOrder.routes.js
import express from 'express';
import {
  getAllPurchaseOrders,
  createPurchaseOrder
} from '../controllers/purchaseOrder.controller.js';

const router = express.Router();

/**
 * Purchase Order Routes
 * GET /api/purchase-orders - Get all purchase orders
 * POST /api/purchase-orders - Create a new purchase order
 */

router.get('/', getAllPurchaseOrders);
router.post('/', createPurchaseOrder);

export default router;
