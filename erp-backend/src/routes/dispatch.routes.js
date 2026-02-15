// src/routes/dispatch.routes.js
// Routes for Dispatch operations

import express from 'express';
import dispatchController from '../controllers/dispatch.controller.js';

const router = express.Router();

// Create dispatch record
router.post('/', dispatchController.createDispatch);

// Get dispatch records
router.get('/', dispatchController.getDispatchRecords);

// Update dispatch status
router.put('/:dispatchId/status', dispatchController.updateDispatchStatus);

// Generate dispatch invoice PDF
router.get('/:dispatchId/invoice-pdf', dispatchController.generateDispatchInvoicePDF);

export default router;
