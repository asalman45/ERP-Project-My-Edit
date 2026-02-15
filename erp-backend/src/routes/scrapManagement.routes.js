// src/routes/scrapManagement.routes.js
import express from 'express';
import {
  restoreScrapToInventory,
  reuseScrapInProduction,
  getScrapMovementHistory,
  getScrapManagementDashboard,
  getScrapSummary,
  getScrapRecommendations,
  getReuseOpportunities,
  getScrapOrigin,
  getScrapTransactionLog
} from '../controllers/scrapManagement.controller.js';

const router = express.Router();

// Restore scrap to inventory
router.post('/:scrapId/restore', restoreScrapToInventory);

// Reuse scrap in production
router.post('/:scrapId/reuse', reuseScrapInProduction);

// Get scrap movement history
router.get('/:scrapId/movement-history', getScrapMovementHistory);

// Get scrap management dashboard
router.get('/dashboard', getScrapManagementDashboard);

// Get scrap inventory summary
router.get('/summary', getScrapSummary);

// Get scrap recommendations for production
router.get('/recommendations', getScrapRecommendations);

// New: Get reuse opportunities (smart bounding box matching)
router.get('/:scrapId/reuse-opportunities', getReuseOpportunities);

// New: Get scrap origin details
router.get('/:scrapId/origin', getScrapOrigin);

// New: Get scrap transaction log (full audit trail)
router.get('/:scrapId/transaction-log', getScrapTransactionLog);

export default router;

