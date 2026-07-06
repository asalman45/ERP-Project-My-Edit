import express from 'express';
import * as ecnController from '../controllers/ecn.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Phase 5: ECN Routes
 */

// Apply auth middleware to all ECN routes
router.use(verifyToken);

// Create ECN
router.post('/', ecnController.createECN);

// List ECNs
router.get('/', ecnController.getECNs);

// Approve ECN (Triggers BOM new version)
router.patch('/:id/approve', ecnController.approveECN);

export default router;
