// src/services/auditTrail.service.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Comprehensive Audit Trail Service
 * Tracks all changes and user activities
 */

/**
 * Log inventory transaction
 */
export const logInventoryTransaction = async (transactionData) => {
  try {
    const {
      user_id,
      action,
      entity_type, // 'inventory', 'material', 'product', etc.
      entity_id,
      old_values,
      new_values,
      reference_id,
      ip_address,
      user_agent,
      additional_data
    } = transactionData;

    const auditLog = await prisma.auditLog.create({
      data: {
        user_id: user_id || 'system',
        action,
        entity_type,
        entity_id,
        old_values: old_values ? JSON.stringify(old_values) : null,
        new_values: new_values ? JSON.stringify(new_values) : null,
        reference_id,
        ip_address,
        user_agent,
        additional_data: additional_data ? JSON.stringify(additional_data) : null,
        timestamp: new Date()
      }
    });

    logger.info({
      audit_id: auditLog.id,
      action,
      entity_type,
      entity_id
    }, 'Audit log created');

    return auditLog;
  } catch (error) {
    logger.error({ error: error.message, transactionData }, 'Failed to log inventory transaction');
    throw error;
  }
};

/**
 * Get audit trail for specific entity
 */
export const getEntityAuditTrail = async (entityType, entityId, options = {}) => {
  try {
    const { limit = 50, offset = 0, start_date, end_date } = options;
    
    const whereClause = {
      entity_type: entityType,
      entity_id: entityId
    };

    if (start_date || end_date) {
      whereClause.timestamp = {};
      if (start_date) whereClause.timestamp.gte = new Date(start_date);
      if (end_date) whereClause.timestamp.lte = new Date(end_date);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    return auditLogs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
      additional_data: log.additional_data ? JSON.parse(log.additional_data) : null
    }));
  } catch (error) {
    logger.error({ error: error.message, entityType, entityId }, 'Failed to get entity audit trail');
    throw error;
  }
};

/**
 * Get user activity log
 */
export const getUserActivityLog = async (userId, options = {}) => {
  try {
    const { limit = 50, offset = 0, start_date, end_date, action } = options;
    
    const whereClause = {
      user_id: userId
    };

    if (action) {
      whereClause.action = action;
    }

    if (start_date || end_date) {
      whereClause.timestamp = {};
      if (start_date) whereClause.timestamp.gte = new Date(start_date);
      if (end_date) whereClause.timestamp.lte = new Date(end_date);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset
    });

    return auditLogs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
      additional_data: log.additional_data ? JSON.parse(log.additional_data) : null
    }));
  } catch (error) {
    logger.error({ error: error.message, userId }, 'Failed to get user activity log');
    throw error;
  }
};

/**
 * Get system audit summary
 */
export const getAuditSummary = async (options = {}) => {
  try {
    const { start_date, end_date } = options;
    
    const whereClause = {};
    if (start_date || end_date) {
      whereClause.timestamp = {};
      if (start_date) whereClause.timestamp.gte = new Date(start_date);
      if (end_date) whereClause.timestamp.lte = new Date(end_date);
    }

    const summary = await prisma.auditLog.groupBy({
      by: ['action'],
      where: whereClause,
      _count: { action: true }
    });

    const totalLogs = await prisma.auditLog.count({ where: whereClause });
    
    const recentActivity = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        user_id: true,
        action: true,
        entity_type: true,
        entity_id: true,
        timestamp: true
      }
    });

    return {
      total_logs: totalLogs,
      action_breakdown: summary,
      recent_activity: recentActivity,
      period: {
        start_date: start_date || null,
        end_date: end_date || null
      }
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get audit summary');
    throw error;
  }
};

/**
 * Enhanced inventory transaction with audit
 */
export const logInventoryChange = async (inventoryId, changeType, oldData, newData, userId, additionalInfo = {}) => {
  try {
    const auditData = {
      user_id: userId,
      action: changeType,
      entity_type: 'inventory',
      entity_id: inventoryId,
      old_values: oldData,
      new_values: newData,
      reference_id: newData.inventory_id || newData.txn_id,
      additional_data: {
        change_type: changeType,
        quantity_change: newData.quantity - (oldData.quantity || 0),
        ...additionalInfo
      }
    };

    return await logInventoryTransaction(auditData);
  } catch (error) {
    logger.error({ error: error.message, inventoryId, changeType }, 'Failed to log inventory change');
    throw error;
  }
};

export default {
  logInventoryTransaction,
  getEntityAuditTrail,
  getUserActivityLog,
  getAuditSummary,
  logInventoryChange
};
