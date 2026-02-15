// src/routes/goodsReceipt.routes.js
import express from 'express';
import goodsReceiptController from '../controllers/goodsReceipt.controller.js';

const router = express.Router();

// GRN routes
router.post('/', goodsReceiptController.createGRN);
router.get('/', goodsReceiptController.getAllGRNs);
router.get('/:id', goodsReceiptController.getGRNById);

export default router;

