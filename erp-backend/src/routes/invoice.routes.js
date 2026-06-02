// src/routes/invoice.routes.js
import express from 'express';
import invoiceController from '../controllers/invoice.controller.js';

const router = express.Router();

// List all invoices (GET /api/invoices?type=SUPPLIER&status=PENDING)
router.get('/', invoiceController.getInvoices);

// Get single invoice
router.get('/:id', invoiceController.getInvoiceById);

// Create invoice
router.post('/', invoiceController.createInvoice);

// Update invoice (e.g., mark PAID)
router.patch('/:id', invoiceController.updateInvoice);

export default router;
