// src/routes/asset.routes.js
import express from 'express';
import * as assetController from '../controllers/asset.controller.js';

const router = express.Router();

// Asset Master
router.get('/', assetController.getAssets);

// Maintenance Schedule
router.get('/maintenance/upcoming', assetController.getUpcomingMaintenance);
router.post('/maintenance/schedule', assetController.createMaintenanceSchedule);
router.post('/maintenance/log', assetController.logMaintenance);

export default router;
