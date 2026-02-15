// src/routes/productionMaterialConsumption.routes.js
import express from 'express';
import {
  createConsumption,
  getConsumptionByProductionOrder,
  getConsumptionByProduct,
  updateConsumption,
  getConsumptionSummary,
  processBOMForProduction
} from '../controllers/productionMaterialConsumption.controller.js';

const router = express.Router();

// Create production material consumption
router.post('/', createConsumption);

// Get consumption by production order
router.get('/production-order/:productionOrderId', getConsumptionByProductionOrder);

// Get consumption by product
router.get('/product/:productId', getConsumptionByProduct);

// Update consumption quantities
router.put('/:consumptionId', updateConsumption);

// Get consumption summary
router.get('/summary', getConsumptionSummary);

// Process BOM for production order
router.post('/process-bom/:productionOrderId/product/:productId', processBOMForProduction);

export default router;

