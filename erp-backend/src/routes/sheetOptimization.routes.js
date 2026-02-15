// src/routes/sheetOptimization.routes.js
import express from 'express';
import {
  calculateOptimalCutting,
  getOptimizationByBlankId,
  getOptimizationsByProduct,
  batchOptimizeProduct,
  getOptimizationStats,
  // Circle optimization endpoints
  calculateCircleOptimization,
  calculateCircleSheetRequirements,
  generateCircleCuttingPattern,
  exportCircleOptimization
} from '../controllers/sheetOptimization.controller.js';

const router = express.Router();

// Calculate optimal cutting
router.post('/calculate', calculateOptimalCutting);

// Get optimization by blank ID
router.get('/blank/:blankId', getOptimizationByBlankId);

// Get optimizations by product
router.get('/product/:productId', getOptimizationsByProduct);

// Batch optimize all blanks for a product
router.post('/batch/product/:productId', batchOptimizeProduct);

// Get optimization statistics
router.get('/stats', getOptimizationStats);

// =============================================================================
// CIRCLE OPTIMIZATION ROUTES
// =============================================================================

// Calculate optimal cutting for circular blanks
router.post('/circle/calculate', calculateCircleOptimization);

// Calculate sheet requirements for circular optimization
router.post('/circle/sheet-requirements', calculateCircleSheetRequirements);

// Generate cutting pattern for circular optimization
router.post('/circle/cutting-pattern', generateCircleCuttingPattern);

// Export circle optimization results
router.post('/circle/export', exportCircleOptimization);

export default router;
