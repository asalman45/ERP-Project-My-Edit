// src/routes/workOrderIntegration.routes.js
import express from 'express';
import {
  explodeBOM,
  reserveMaterials,
  releaseReservations,
  consumeMaterials,
  getMaterialStatus
} from '../controllers/workOrderIntegration.controller.js';

const router = express.Router();

/**
 * Work Order Integration Routes
 * BOM explosion, material reservation, and production planning
 */

// Explode BOM for work order
router.post('/:workOrderId/explode-bom', explodeBOM);

// Reserve materials for work order
router.post('/:workOrderId/reserve-materials', reserveMaterials);

// Release material reservations
router.post('/:workOrderId/release-reservations', releaseReservations);

// Consume materials for production
router.post('/:workOrderId/consume-materials', consumeMaterials);

// Get material status for work order
router.get('/:workOrderId/material-status', getMaterialStatus);

export default router;
