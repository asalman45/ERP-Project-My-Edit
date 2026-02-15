// src/routes/qc.routes.js
import express from 'express';
import * as qcController from '../controllers/qc.controller.js';

const router = express.Router();

// Quality Standard Routes
router.get('/standards', qcController.getQCStandards);
router.post('/standards', qcController.createQCStandard);

// Inspection Routes
router.get('/inspections', qcController.getQCInspections);
router.post('/inspections', qcController.performInspection);

// Rejection Routes
router.post('/rejections', qcController.logRejection);

// Analytics
router.get('/analytics', qcController.getQCAnalytics);

export default router;
