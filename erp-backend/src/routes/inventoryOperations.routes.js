// src/routes/inventoryOperations.routes.js
import express from 'express';
import { startPhysicalInventory, submitCounts, logMachineDowntime } from '../controllers/inventoryOperations.controller.js';

const router = express.Router();

// Physical Inventory
router.get('/physical/start', startPhysicalInventory);
router.post('/physical/submit', submitCounts);

// Machine Downtime
router.post('/downtime', logMachineDowntime);

export default router;
