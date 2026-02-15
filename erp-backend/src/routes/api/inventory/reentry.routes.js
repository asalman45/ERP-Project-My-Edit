// src/routes/api/inventory/reentry.routes.js
import express from 'express';
import { 
  reentryWastage, 
  bulkReentryWastage, 
  getReentryHistory, 
  getAvailableWastageForReentry 
} from '../../../controllers/api/inventory/reentry.controller.js';

const router = express.Router();

/**
 * Re-entry Routes
 * POST /api/inventory/reentry - Re-entry wastage back to inventory
 * POST /api/inventory/reentry/bulk - Bulk re-entry wastage
 * GET /api/inventory/reentry/history - Get re-entry history
 * GET /api/inventory/reentry/available - Get available wastage for re-entry
 */

// Re-entry Wastage
router.post('/', reentryWastage);

// Bulk Re-entry Wastage
router.post('/bulk', bulkReentryWastage);

// Get Re-entry History
router.get('/history', getReentryHistory);

// Get Available Wastage for Re-entry
router.get('/available', getAvailableWastageForReentry);

export default router;
