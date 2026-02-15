// src/routes/internalPurchaseOrder.routes.js
// Routes for Internal Purchase Orders

import express from 'express';
import {
  createIPO,
  getIPOById,
  getIPOByNumber,
  getAllIPOs,
  updateIPOStatus,
  generateIPOPDF,
  sendIPOEmail,
  generateAndSendIPO,
  getIPOStats,
  deleteIPO,
  testEmailConfig,
  verifyEmailConfig
} from '../controllers/internalPurchaseOrder.controller.js';

const router = express.Router();

// Create new Internal Purchase Order
router.post('/', createIPO);

// Get all Internal Purchase Orders with filters
router.get('/', getAllIPOs);

// Get Internal Purchase Order statistics
router.get('/stats', getIPOStats);

// Get Internal Purchase Order by ID
router.get('/:id', getIPOById);

// Get Internal Purchase Order by PO Number
router.get('/number/:poNumber', getIPOByNumber);

// Update Internal Purchase Order status
router.patch('/:id/status', updateIPOStatus);

// Generate PDF for Internal Purchase Order
router.post('/:id/generate-pdf', generateIPOPDF);

// Send Internal Purchase Order via email
router.post('/:id/send-email', sendIPOEmail);

// Generate PDF and send email in one action
router.post('/:id/generate-and-send', generateAndSendIPO);

// Delete Internal Purchase Order
router.delete('/:id', deleteIPO);

// Email configuration testing
router.post('/test-email', testEmailConfig);
router.get('/verify-email', verifyEmailConfig);

export default router;
