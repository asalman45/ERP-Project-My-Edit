import db from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

/**
 * Log an activity to the audit_log table.
 * 
 * @param {Object} params
 * @param {string} params.userId - The ID of the user performing the action.
 * @param {string} params.action - The action performed (e.g., 'CREATE', 'UPDATE', 'APPROVE', 'REJECT').
 * @param {string} params.entityType - The type of entity (e.g., 'PurchaseOrder', 'Payroll', 'WorkOrder').
 * @param {string} params.entityId - The unique ID of the entity.
 * @param {string} [params.oldValues] - JSON string of old values.
 * @param {string} [params.newValues] - JSON string of new values.
 * @param {string} [params.referenceId] - Additional reference to track.
 * @param {string} [params.ipAddress] - IP address of the user.
 * @param {string} [params.userAgent] - Browser details of the user.
 * @param {string} [params.additionalData] - Any extra JSON data.
 */
export const logActivity = async ({
    userId,
    action,
    entityType,
    entityId,
    oldValues = null,
    newValues = null,
    referenceId = null,
    ipAddress = null,
    userAgent = null,
    additionalData = null
}) => {
    try {
        await db.query(`
      INSERT INTO audit_log (
        id, user_id, action, entity_type, entity_id, 
        old_values, new_values, reference_id, 
        ip_address, user_agent, additional_data, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    `, [
            uuidv4(), userId, action, entityType, entityId,
            oldValues, newValues, referenceId, ipAddress, userAgent, additionalData
        ]);
    } catch (err) {
        logger.error({ err, userId, action, entityType, entityId }, 'Failed to insert audit log');
    }
};
