// src/routes/productionApi.routes.js
// Routes for Production Execution API

import express from 'express';
import productionApiController from '../controllers/api/productionApi.controller.js';

const router = express.Router();

// Issue materials to work order
router.post('/issue-material', productionApiController.issueMaterial);

// Record production output
router.post('/record-output', productionApiController.recordOutput);

// Generate scrap from cutting operation
router.post('/generate-scrap', productionApiController.generateScrap);

// Complete work order operation
router.post('/complete-operation', productionApiController.completeOperation);

// Get material issues for a work order
router.get('/material-issues/:workOrderId', productionApiController.getMaterialIssues);

// Get production output for a work order
router.get('/output/:workOrderId', productionApiController.getProductionOutput);

// Get production summary for a work order
router.get('/summary/:workOrderId', productionApiController.getProductionSummary);

// Frontend Production API
router.post('/start-operation/:woId', productionApiController.startOperation);
router.post('/issue-material/:woId', productionApiController.issueMaterialToWO);
router.post('/record-output/:woId', productionApiController.recordOutputForWO);
router.post('/generate-scrap/:woId', productionApiController.generateScrapForWO);
router.post('/complete-operation/:woId', productionApiController.completeOperationForWO);
router.get('/check-dependencies/:woId', productionApiController.checkOperationDependencies);

export default router;

