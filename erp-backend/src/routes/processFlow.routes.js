// src/routes/processFlow.routes.js
import express from 'express';
import {
  getProcessFlow, createProcessFlow, updateProcessStep, deleteProcessStep,
  createAlternativePath, getProcessFlowWithMaterials, validateProcessFlow, getProcessFlowStatistics
} from '../controllers/processFlow.controller.js';

const router = express.Router();

// Process flow management
router.get('/product/:productId', getProcessFlow);
router.post('/product/:productId', createProcessFlow);
router.put('/step/:routingId', updateProcessStep);
router.delete('/step/:routingId', deleteProcessStep);

// Alternative paths
router.post('/product/:productId/alternative', createAlternativePath);

// Advanced functionality
router.get('/product/:productId/with-materials', getProcessFlowWithMaterials);
router.get('/product/:productId/validate', validateProcessFlow);
router.get('/product/:productId/statistics', getProcessFlowStatistics);

export default router;
