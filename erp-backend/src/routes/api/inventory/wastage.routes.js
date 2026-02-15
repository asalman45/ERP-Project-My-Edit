// src/routes/api/inventory/wastage.routes.js
import express from 'express';
import { 
  recordWastage, 
  reentryWastage, 
  getWastageRecords, 
  getWastageSummary 
} from '../../../controllers/api/inventory/wastage.controller.js';

const router = express.Router();

/**
 * Wastage Routes
 * POST /api/inventory/wastage - Record material wastage
 * POST /api/inventory/wastage/reentry - Re-entry wastage back to inventory
 * GET /api/inventory/wastage - Get wastage records
 * GET /api/inventory/wastage/summary - Get wastage summary
 */

// Record Wastage
router.post('/', recordWastage);

// Re-entry Wastage
router.post('/reentry', reentryWastage);

// Get Wastage Records
router.get('/', getWastageRecords);

// Get Wastage Summary
router.get('/summary', getWastageSummary);

export default router;
