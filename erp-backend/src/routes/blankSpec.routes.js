// src/routes/blankSpec.routes.js
import express from 'express';
import {
  getBlankSpecs, getBlankSpec, createBlankSpec, updateBlankSpec, deleteBlankSpec,
  calculateSheetUtilization, optimizeCuttingPattern, generateScrapFromProduction
} from '../controllers/blankSpec.controller.js';

const router = express.Router();

// Basic CRUD operations
router.get('/product/:productId', getBlankSpecs);
router.get('/:blankId', getBlankSpec);
router.post('/', createBlankSpec);
router.put('/:blankId', updateBlankSpec);
router.delete('/:blankId', deleteBlankSpec);

// Advanced functionality
router.post('/product/:productId/calculate-utilization', calculateSheetUtilization);
router.post('/product/:productId/optimize-cutting', optimizeCuttingPattern);
router.post('/:blankId/generate-scrap', generateScrapFromProduction);

export default router;
