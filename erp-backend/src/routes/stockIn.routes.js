// src/routes/stockIn.routes.js
// Routes for Stock In operations

import express from 'express';
import stockInController from '../controllers/stockIn.controller.js';

const router = express.Router();

// Create stock in record
router.post('/', stockInController.createStockIn);

// Get stock in records
router.get('/', stockInController.getStockInRecords);

export default router;
