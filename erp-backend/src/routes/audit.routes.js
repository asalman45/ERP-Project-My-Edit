import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/rbac.middleware.js';

const router = express.Router();

// Only Admins can view the system-wide audit logs
router.get('/', authenticate, checkRole(['admin']), getAuditLogs);

export default router;
