// src/routes/returns.routes.js
import express from 'express';
import { createSalesReturn, createPurchaseReturn } from '../controllers/returns.controller.js';

const router = express.Router();

// Sales Returns (RMA)
router.post('/sales', createSalesReturn);

// Purchase Returns (Debit Note)
router.post('/purchase', createPurchaseReturn);

export default router;
