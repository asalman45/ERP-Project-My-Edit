// src/routes/auditTrail.routes.js
import express from 'express';
import {
  getEntityAuditTrail,
  getUserActivityLog,
  getAuditSummary
} from '../controllers/auditTrail.controller.js';

const router = express.Router();

/**
 * Audit Trail Routes
 * Comprehensive audit logging and tracking
 */

// Get audit trail for specific entity
router.get('/entity/:entityType/:entityId', getEntityAuditTrail);

// Get user activity log
router.get('/user/:userId', getUserActivityLog);

// Get audit summary
router.get('/summary', getAuditSummary);

export default router;
