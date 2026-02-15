// src/routes/productionTracking.routes.js
import express from 'express';
import {
  getProductionOrders,
  getProductionOrderDetails,
  updateOperationProgress,
  completeOperation,
  getProductionDashboard
} from '../controllers/productionTracking.controller.js';

const router = express.Router();

/**
 * Production Tracking Routes
 * All routes are prefixed with /api/production-tracking
 */

// Dashboard and overview
router.get('/dashboard', getProductionDashboard);

// Work order tracking
router.get('/orders', getProductionOrders);
router.get('/orders/:wo_id', getProductionOrderDetails);

// Operation tracking
router.put('/orders/:wo_id/operations/:operation_id/progress', updateOperationProgress);
router.post('/orders/:wo_id/operations/:operation_id/complete', completeOperation);

export default router;