// src/routes/reports.routes.js
import express from 'express';
import {
  generateProductionReport,
  generateScrapReport,
  generateInventoryReport,
  generateCostAnalysisReport
} from '../controllers/simple-reports.controller.js';

const router = express.Router();

/**
 * Reports Routes
 * GET /api/reports/production - Generate production report
 * GET /api/reports/scrap - Generate scrap management report
 * GET /api/reports/inventory - Generate inventory report
 * GET /api/reports/cost-analysis - Generate cost analysis report
 */

// Production Report
router.get('/production', generateProductionReport);

// Scrap Management Report
router.get('/scrap', generateScrapReport);

// Inventory Report
router.get('/inventory', generateInventoryReport);

// Cost Analysis Report
router.get('/cost-analysis', generateCostAnalysisReport);

export default router;