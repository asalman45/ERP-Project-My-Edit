// Sales Order Routes - API endpoints for sales order management

import express from 'express';
import * as salesOrderController from '../controllers/salesOrder.controller.js';

const router = express.Router();

// Sales Order routes
router.post('/', salesOrderController.createSalesOrder);
router.get('/', salesOrderController.getAllSalesOrders);
router.get('/export', salesOrderController.exportSalesOrders);
router.get('/stats', salesOrderController.getSalesOrderStats);
router.get('/number/:orderNumber', salesOrderController.getSalesOrderByNumber);

// Customer routes
router.get('/customers/list', salesOrderController.getAllCustomers);
router.post('/customers', salesOrderController.createCustomer);

// OEM and Product routes
router.get('/oem-list', salesOrderController.getOEMsFromProducts);
router.get('/oem/:oemId/products', salesOrderController.getProductCodesByOEM);

// Sales Order by ID routes (must be after specific routes)
router.get('/:id', salesOrderController.getSalesOrderById);
router.patch('/:id/status', salesOrderController.updateSalesOrderStatus);
router.post('/:id/convert-to-work-orders', salesOrderController.convertToWorkOrders);
router.delete('/:id', salesOrderController.deleteSalesOrder);

export default router;
