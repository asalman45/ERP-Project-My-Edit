// src/services/procurementRequest.service.js
// Procurement Request Service using raw SQL (not Prisma)

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new procurement request
 */
const createProcurementRequest = async (data) => {
  try {
    const { material_id, quantity, requested_by, notes, reference_po } = data;

    // Validate required fields
    if (!material_id || !quantity || !requested_by) {
      throw new Error('Missing required fields: material_id, quantity, requested_by');
    }

    // Validate quantity
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Check if material exists
    const materialCheck = await db.query(
      'SELECT material_id FROM material WHERE material_id = $1',
      [material_id]
    );

    if (materialCheck.rows.length === 0) {
      throw new Error('Material not found');
    }

    // Create the procurement request
    const result = await db.query(
      `INSERT INTO procurement_request (
        id, material_id, quantity, requested_by, notes, reference_po, status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [material_id, quantity, requested_by, notes || null, reference_po || null]
    );

    // Get the full procurement request with material details
    const procurementRequest = await getProcurementRequestById(result.rows[0].id);
    
    return procurementRequest;
  } catch (error) {
    logger.error({ error }, 'Error creating procurement request');
    throw error;
  }
};

/**
 * Get all procurement requests with filters
 */
const getProcurementRequests = async (filters = {}) => {
  try {
    const {
      status,
      material_id,
      requested_by,
      limit = 100,
      offset = 0
    } = filters;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (status && status !== 'all') {
      paramCount++;
      whereClause += ` AND pr.status = $${paramCount}`;
      params.push(status);
    }
    
    if (material_id && material_id !== 'all') {
      paramCount++;
      whereClause += ` AND pr.material_id = $${paramCount}`;
      params.push(material_id);
    }
    
    if (requested_by) {
      paramCount++;
      whereClause += ` AND pr.requested_by = $${paramCount}`;
      params.push(requested_by);
    }

    const query = `
      SELECT 
        pr.*,
        m.material_id,
        m.material_code,
        m.name as material_name,
        m.description as material_description,
        u.uom_id,
        u.code as uom_code,
        u.name as uom_name
      FROM procurement_request pr
      LEFT JOIN material m ON pr.material_id = m.material_id
      LEFT JOIN uom u ON m.uom_id = u.uom_id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const result = await db.query(query, [...params, parseInt(limit), parseInt(offset)]);

    // Transform to match expected format
    const procurementRequests = result.rows.map(row => ({
      id: row.id,
      material_id: row.material_id,
      quantity: parseFloat(row.quantity),
      status: row.status,
      requested_by: row.requested_by,
      approved_by: row.approved_by,
      received_by: row.received_by,
      notes: row.notes,
      reference_po: row.reference_po,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      material: {
        material_id: row.material_id,
        material_code: row.material_code,
        name: row.material_name,
        description: row.material_description,
        uom: {
          uom_id: row.uom_id,
          code: row.uom_code,
          name: row.uom_name
        }
      }
    }));

    return procurementRequests;
  } catch (error) {
    logger.error({ error }, 'Error fetching procurement requests');
    throw error;
  }
};

/**
 * Get procurement request by ID
 */
const getProcurementRequestById = async (id) => {
  try {
    const query = `
      SELECT 
        pr.*,
        m.material_id,
        m.material_code,
        m.name as material_name,
        m.description as material_description,
        u.uom_id,
        u.code as uom_code,
        u.name as uom_name
      FROM procurement_request pr
      LEFT JOIN material m ON pr.material_id = m.material_id
      LEFT JOIN uom u ON m.uom_id = u.uom_id
      WHERE pr.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Procurement request not found');
    }

    const row = result.rows[0];
    
    return {
      id: row.id,
      material_id: row.material_id,
      quantity: parseFloat(row.quantity),
      status: row.status,
      requested_by: row.requested_by,
      approved_by: row.approved_by,
      received_by: row.received_by,
      notes: row.notes,
      reference_po: row.reference_po,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      material: {
        material_id: row.material_id,
        material_code: row.material_code,
        name: row.material_name,
        description: row.material_description,
        uom: {
          uom_id: row.uom_id,
          code: row.uom_code,
          name: row.uom_name
        }
      }
    };
  } catch (error) {
    logger.error({ error, id }, 'Error fetching procurement request');
    throw error;
  }
};

/**
 * Update procurement request status
 */
const updateProcurementRequestStatus = async (id, status, updatedBy, rejectionReason = null) => {
  try {
    const validStatuses = ['PENDING', 'APPROVED', 'RECEIVED', 'REJECTED', 'FULFILLED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    let updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    let paramCount = 1;

    // Set appropriate user field based on status
    if (status === 'APPROVED') {
      paramCount++;
      updateFields.push(`approved_by = $${paramCount}`);
      params.push(updatedBy);
    } else if (status === 'RECEIVED') {
      paramCount++;
      updateFields.push(`received_by = $${paramCount}`);
      params.push(updatedBy);
    }
    
    if (status === 'REJECTED' && rejectionReason) {
      paramCount++;
      updateFields.push(`rejection_reason = $${paramCount}`);
      params.push(rejectionReason);
    }

    paramCount++;
    const query = `
      UPDATE procurement_request 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    params.push(id);

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      throw new Error('Procurement request not found');
    }

    // Get the full procurement request with material details
    const procurementRequest = await getProcurementRequestById(id);

    return procurementRequest;
  } catch (error) {
    logger.error({ error, id }, 'Error updating procurement request status');
    throw error;
  }
};

/**
 * Get procurement requests by status (for stock-in integration)
 */
const getProcurementRequestsByStatus = async (status) => {
  try {
    return await getProcurementRequests({ status });
  } catch (error) {
    logger.error({ error, status }, 'Error fetching procurement requests by status');
    throw error;
  }
};

/**
 * Get procurement statistics
 */
const getProcurementStats = async () => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'RECEIVED' THEN 1 ELSE 0 END) as received,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'FULFILLED' THEN 1 ELSE 0 END) as fulfilled,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM procurement_request
    `;

    const result = await db.query(statsQuery);
    const row = result.rows[0];

    return {
      total: parseInt(row.total) || 0,
      pending: parseInt(row.pending) || 0,
      approved: parseInt(row.approved) || 0,
      received: parseInt(row.received) || 0,
      rejected: parseInt(row.rejected) || 0,
      fulfilled: parseInt(row.fulfilled) || 0,
      cancelled: parseInt(row.cancelled) || 0
    };
  } catch (error) {
    logger.error({ error }, 'Error fetching procurement stats');
    throw error;
  }
};

export default {
  createProcurementRequest,
  getProcurementRequests,
  getProcurementRequestById,
  updateProcurementRequestStatus,
  getProcurementRequestsByStatus,
  getProcurementStats
};
