// src/routes/batchTracking.routes.js
import express from 'express';
import {
  createBatch,
  getBatchesForItem,
  consumeBatchQuantity,
  getExpiryWarnings,
  getBatchSummary
} from '../controllers/batchTracking.controller.js';

const router = express.Router();

/**
 * Batch Tracking Routes
 * FIFO/LIFO batch management and expiry tracking
 */

// Create new batch
router.post('/batch', createBatch);

// Get batches for inventory item
router.get('/inventory/:inventoryId', getBatchesForItem);

// Consume batch quantity
router.post('/consume', consumeBatchQuantity);

// Get expiry warnings
router.get('/expiry-warnings', getExpiryWarnings);

// Get batch summary
router.get('/summary/:inventoryId', getBatchSummary);

export default router;
