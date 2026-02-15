import express from 'express';
import procurementRequestController from '../controllers/procurementRequest.controller.js';

const router = express.Router();

// Create a new procurement request
router.post('/', procurementRequestController.createProcurementRequest);

// Get all procurement requests with optional filters
router.get('/', procurementRequestController.getProcurementRequests);

// Get procurement statistics
router.get('/stats', procurementRequestController.getProcurementStats);

// Export procurement data
router.get('/export', procurementRequestController.exportProcurement);

// Get procurement request by ID
router.get('/:id', procurementRequestController.getProcurementRequestById);

// Get procurement requests by status
router.get('/status/:status', procurementRequestController.getProcurementRequestsByStatus);

// Update procurement request status
router.patch('/:id/status', procurementRequestController.updateProcurementRequestStatus);

export default router;
