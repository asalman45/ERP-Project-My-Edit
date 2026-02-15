// src/routes/hierarchicalWorkOrder.routes.js
// Routes for Hierarchical Work Order API

import express from 'express';
import hierarchicalWOController from '../controllers/api/hierarchicalWorkOrderApi.controller.js';

const router = express.Router();

// Generate hierarchical work orders from BOM
router.post('/hierarchical', hierarchicalWOController.generateHierarchicalWOs);

// Calculate sheet allocation for a product
router.post('/calculate-sheets', hierarchicalWOController.calculateSheets);

// Get work order hierarchy
router.get('/:woId/hierarchy', hierarchicalWOController.getHierarchy);

// Get child work orders
router.get('/:woId/children', hierarchicalWOController.getChildren);

// Check work order dependencies
router.get('/:woId/dependencies', hierarchicalWOController.checkDependencies);

// Trigger next work orders
router.post('/:woId/trigger-next', hierarchicalWOController.triggerNext);

// Frontend Work Order API
router.post('/create', hierarchicalWOController.createWorkOrder);
router.get('/work-orders', hierarchicalWOController.getWorkOrders);
router.get('/export', hierarchicalWOController.exportWorkOrders);
router.put('/:woId/status', hierarchicalWOController.updateWorkOrderStatus);
router.delete('/:woId', hierarchicalWOController.deleteWorkOrder);
// start endpoint removed per request

export default router;

