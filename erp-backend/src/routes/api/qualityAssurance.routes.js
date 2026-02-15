// src/routes/api/qualityAssurance.routes.js
import express from 'express';
import qualityAssuranceController from '../../controllers/api/qualityAssurance.controller.js';

const router = express.Router();

/**
 * QA Inspection Routes
 */

// Get inventory by location type (for QA page)
router.get('/by-location-type', qualityAssuranceController.getInventoryByLocationType);

// Export QA history
router.get('/export', qualityAssuranceController.exportQAHistory);

// Update QA status (full approval/rejection)
router.post('/:inventoryId', qualityAssuranceController.updateQAStatus);

// Update QA status with partial quantities
router.post('/:inventoryId/partial', qualityAssuranceController.updateQAStatusPartial);

export default router;

