// src/routes/customerInvoice.routes.js
// Routes for Customer Invoice (Sales Invoice) operations

import express from 'express';
import customerInvoiceController from '../controllers/customerInvoice.controller.js';

const router = express.Router();

// Create customer invoice
router.post('/', customerInvoiceController.createCustomerInvoice);

// Get customer invoices
router.get('/', customerInvoiceController.getCustomerInvoices);

// Get specific invoice
router.get('/:invoiceId', customerInvoiceController.getCustomerInvoiceById);

// Download PDF
router.get('/:invoiceId/pdf', customerInvoiceController.downloadInvoicePDF);

// Update payment status
router.put('/:invoiceId/payment', customerInvoiceController.updatePaymentStatus);

export default router;

