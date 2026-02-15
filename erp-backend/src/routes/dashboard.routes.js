// src/routes/dashboard.routes.js
import express from 'express';
import {
  getDashboardStats,
  getInventorySummary,
  getWorkOrderStatus,
  getRecentActivities
} from '../controllers/dashboard.controller.js';

const router = express.Router();

/**
 * Dashboard Routes
 * GET /api/dashboard/stats - Get comprehensive dashboard statistics
 * GET /api/dashboard/inventory-summary - Get inventory summary
 * GET /api/dashboard/work-order-status - Get work order status breakdown
 * GET /api/dashboard/recent-activities - Get recent system activities
 */

// Get Dashboard Statistics
router.get('/stats', getDashboardStats);

// Get Inventory Summary
router.get('/inventory-summary', getInventorySummary);

// Get Work Order Status
router.get('/work-order-status', getWorkOrderStatus);

// Get Recent Activities
router.get('/recent-activities', getRecentActivities);

export default router;
