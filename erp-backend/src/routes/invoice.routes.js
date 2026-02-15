// src/routes/invoice.routes.js
// Routes for Invoice operations

import express from 'express';
import invoiceController from '../controllers/invoice.controller.js';

const router = express.Router();

// Create invoice
router.post('/', invoiceController.createInvoice);

// Get invoices
router.get('/', invoiceController.getInvoices);

export default router;
