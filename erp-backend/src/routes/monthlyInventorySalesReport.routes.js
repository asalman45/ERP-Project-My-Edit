// src/routes/monthlyInventorySalesReport.routes.js
import express from 'express';
import {
  generateMonthlyInventorySalesReport,
  getAvailableModels,
  getProductsByModel
} from '../controllers/monthlyInventorySalesReport.controller.js';

const router = express.Router();

/**
 * @route POST /api/reports/monthly-inventory-sales
 * @desc Generate monthly inventory and sales report
 * @access Public (add authentication as needed)
 */
router.post('/monthly-inventory-sales', generateMonthlyInventorySalesReport);

/**
 * @route GET /api/reports/available-models
 * @desc Get available models for filtering
 * @access Public (add authentication as needed)
 */
router.get('/available-models', getAvailableModels);

/**
 * @route GET /api/reports/products/:model_id
 * @desc Get products for a specific model
 * @access Public (add authentication as needed)
 */
router.get('/products/:model_id', getProductsByModel);

export default router;

