// src/routes/reporting.routes.js
import express from 'express';
import {
  getInventoryValuationReport,
  getStockMovementReport,
  getPurchaseOrderStatusReport,
  getWorkOrderPerformanceReport,
  getDashboardAnalytics,
  getAvailableReports
} from '../controllers/reporting.controller.js';
import { getPandLReport, getDepartmentalOverheads } from '../controllers/advancedReporting.controller.js';

const router = express.Router();

/**
 * Reporting Routes
 * Comprehensive business reports and analytics
 */

// Get available reports
router.get('/available', getAvailableReports);

// Inventory valuation report
router.get('/inventory-valuation', getInventoryValuationReport);

// Stock movement report
router.get('/stock-movement', getStockMovementReport);

// Purchase order status report
router.get('/purchase-order-status', getPurchaseOrderStatusReport);

// Work order performance report
router.get('/work-order-performance', getWorkOrderPerformanceReport);

// Dashboard analytics
router.get('/dashboard-analytics', getDashboardAnalytics);

// Advanced Financial Reports
router.get('/advanced/p-and-l', getPandLReport);
router.get('/advanced/overheads', getDepartmentalOverheads);

export default router;
