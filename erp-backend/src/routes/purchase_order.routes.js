// src/routes/purchase_order.routes.js
import express from 'express';
import {
  listPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, updateStatus,
  getPOItems, addPOItem, updatePOItem, deletePOItem, approvePurchaseOrder, rejectPurchaseOrder
} from '../controllers/purchase_order.controller.js';

const router = express.Router();

// Purchase Order CRUD
router.get('/', listPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post('/', createPurchaseOrder);
router.patch('/:id', updatePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);
router.patch('/:id/status', updateStatus);

// PO Items
router.get('/:poId/items', getPOItems);
router.post('/:poId/items', addPOItem);
router.patch('/items/:itemId', updatePOItem);
router.delete('/items/:itemId', deletePOItem);

// Approvals
router.post('/:id/approve', approvePurchaseOrder);
router.post('/:id/reject', rejectPurchaseOrder);

export default router;
