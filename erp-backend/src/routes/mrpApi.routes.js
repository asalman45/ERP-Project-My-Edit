// src/routes/mrpApi.routes.js
// Routes for MRP API (Material Requirement Planning)

import express from 'express';
import mrpApiController from '../controllers/api/mrpApi.controller.js';

const router = express.Router();

// Run MRP for sales order or product
router.post('/run', mrpApiController.runMRP);

// Get MRP results for a sales order
router.get('/results/:salesOrderId', mrpApiController.getMRPResults);

// Get material requisitions
router.get('/requisitions/:salesOrderId', mrpApiController.getMaterialRequisitions);

// Get material shortages summary
router.get('/shortages/:salesOrderId', mrpApiController.getMaterialShortages);

// Frontend MRP API
router.get('/products', mrpApiController.getProductsForMRP);
router.get('/sales-orders', mrpApiController.getSalesOrdersForMRP);
router.get('/sales-orders/:salesOrderId/items', mrpApiController.getSalesOrderItems);
router.get('/suppliers', mrpApiController.getSuppliersForMRP);
router.post('/run-mrp', mrpApiController.runMRPForProduct);
router.post('/generate-prs', mrpApiController.generatePRsFromRequirements);
router.post('/convert-pr-to-po', mrpApiController.convertPRToPO);

export default router;

