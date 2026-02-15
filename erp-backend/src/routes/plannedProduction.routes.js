// Planned Production Routes - API endpoints for planned production management

import express from 'express';
import * as plannedProductionController from '../controllers/plannedProduction.controller.js';

const router = express.Router();

// Planned Production routes
router.post('/', plannedProductionController.createPlannedProduction);
router.get('/', plannedProductionController.getAllPlannedProductions);
router.get('/:id', plannedProductionController.getPlannedProductionById);
router.patch('/:id', plannedProductionController.updatePlannedProduction);
router.delete('/:id', plannedProductionController.deletePlannedProduction);

// Planned Production actions
router.post('/:id/run-mrp', plannedProductionController.runMRPPlanning);
router.post('/:id/convert-to-work-orders', plannedProductionController.convertToWorkOrders);
router.post('/:id/complete', plannedProductionController.markCompleted);
router.get('/:id/material-requirements', plannedProductionController.getMaterialRequirements);

export default router;

