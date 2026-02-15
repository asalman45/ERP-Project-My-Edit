// src/controllers/auditTrail.controller.js
import auditTrailService from '../services/auditTrail.service.js';
import { logger } from '../utils/logger.js';

/**
 * Audit Trail Controller
 * Handles comprehensive audit logging and tracking
 */

/**
 * GET /api/audit-trail/entity/:entityType/:entityId
 * Get audit trail for specific entity
 */
export const getEntityAuditTrail = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50, offset = 0, start_date, end_date } = req.query;
    
    const auditLogs = await auditTrailService.getEntityAuditTrail(
      entityType, 
      entityId, 
      { limit: parseInt(limit), offset: parseInt(offset), start_date, end_date }
    );
    
    logger.info({ entityType, entityId, count: auditLogs.length }, 'Entity audit trail retrieved');
    
    return res.status(200).json({
      success: true,
      data: {
        audit_logs: auditLogs,
        total_count: auditLogs.length,
        entity_type: entityType,
        entity_id: entityId
      }
    });
  } catch (error) {
    logger.error({ error: error.message, entityType: req.params.entityType, entityId: req.params.entityId }, 'Failed to get entity audit trail');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit trail'
    });
  }
};

/**
 * GET /api/audit-trail/user/:userId
 * Get user activity log
 */
export const getUserActivityLog = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, start_date, end_date, action } = req.query;
    
    const activityLogs = await auditTrailService.getUserActivityLog(
      userId,
      { limit: parseInt(limit), offset: parseInt(offset), start_date, end_date, action }
    );
    
    logger.info({ userId, count: activityLogs.length }, 'User activity log retrieved');
    
    return res.status(200).json({
      success: true,
      data: {
        activity_logs: activityLogs,
        total_count: activityLogs.length,
        user_id: userId
      }
    });
  } catch (error) {
    logger.error({ error: error.message, userId: req.params.userId }, 'Failed to get user activity log');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user activity log'
    });
  }
};

/**
 * GET /api/audit-trail/summary
 * Get audit trail summary
 */
export const getAuditSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const summary = await auditTrailService.getAuditSummary({ start_date, end_date });
    
    logger.info('Audit trail summary retrieved');
    
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get audit summary');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve audit summary'
    });
  }
};
