import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Phase 5: Engineering Change Notice (ECN) Controller
 */

// Create a new ECN
export const createECN = async (req, res) => {
  try {
    const { ecn_number, product_id, change_type, description, requested_by } = req.body;

    // Optional: get current BOM version to store as old_bom_version
    const bomRes = await db.query(
      'SELECT version FROM bom WHERE product_id = $1 AND is_active = true LIMIT 1',
      [product_id]
    );
    let oldVersion = 1;
    if (bomRes.rows.length > 0) {
      oldVersion = bomRes.rows[0].version;
    }

    const result = await db.query(
      `INSERT INTO engineering_change 
        (ecn_id, ecn_number, product_id, change_type, description, requested_by, status, old_bom_version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT', $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [uuidv4(), ecn_number, product_id, change_type, description, requested_by, oldVersion]
    );

    res.status(201).json({
      success: true,
      message: 'ECN created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating ECN:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// List ECNs
export const getECNs = async (req, res) => {
  try {
    const { product_id } = req.query;
    let query = `
      SELECT e.*, p.product_code, p.part_name 
      FROM engineering_change e
      LEFT JOIN product p ON e.product_id = p.product_id
    `;
    let params = [];
    
    if (product_id) {
      query += ` WHERE e.product_id = $1`;
      params.push(product_id);
    }
    
    query += ` ORDER BY e.created_at DESC`;

    const result = await db.query(query, params);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching ECNs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Approve ECN
export const approveECN = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { approved_by } = req.body;

    await client.query('BEGIN');

    // 1. Get ECN details
    const ecnRes = await client.query('SELECT * FROM engineering_change WHERE ecn_id = $1', [id]);
    if (ecnRes.rows.length === 0) {
      throw new Error('ECN not found');
    }
    const ecn = ecnRes.rows[0];

    if (ecn.status === 'APPROVED' || ecn.status === 'IMPLEMENTED') {
      return res.status(400).json({ success: false, message: 'ECN is already approved/implemented' });
    }

    // 2. We need to create a new BOM version for the product
    // Fetch current active BOM rows
    const currentBom = await client.query('SELECT * FROM bom WHERE product_id = $1 AND is_active = true', [ecn.product_id]);
    
    let newVersion = 1;
    if (currentBom.rows.length > 0) {
      newVersion = currentBom.rows[0].version + 1;
      
      // Deactivate old BOM rows, set effective_to
      await client.query(`
        UPDATE bom 
        SET is_active = false, effective_to = CURRENT_DATE - INTERVAL '1 day', change_reason = $1, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2 AND is_active = true
      `, [`Replaced by ECN ${ecn.ecn_number}`, ecn.product_id]);

      // Insert new rows with incremented version
      for (const row of currentBom.rows) {
        // Omitting bom_id to let it default or generate a new one
        await client.query(`
          INSERT INTO bom 
          (bom_id, product_id, material_id, quantity, sub_assembly_name, step_sequence, is_optional, 
           uom_id, item_type, item_name, is_critical, scrap_allowance_pct, operation_code, 
           bom_version, version, is_active, effective_from, created_at, updated_at)
          VALUES 
          ($1, $2, $3, $4, $5, $6, $7, 
           $8, $9, $10, $11, $12, $13, 
           $14, $15, true, CURRENT_DATE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          uuidv4(), row.product_id, row.material_id, row.quantity, row.sub_assembly_name, row.step_sequence, row.is_optional,
          row.uom_id, row.item_type, row.item_name, row.is_critical, row.scrap_allowance_pct, row.operation_code,
          `v${newVersion}.0`, newVersion
        ]);
      }
    }

    // 3. Update ECN status
    const updateRes = await client.query(`
      UPDATE engineering_change
      SET status = 'APPROVED', approved_by = $1, effective_date = CURRENT_DATE, new_bom_version = $2, updated_at = CURRENT_TIMESTAMP
      WHERE ecn_id = $3
      RETURNING *
    `, [approved_by || 'System', newVersion, id]);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'ECN approved and new BOM version created',
      data: updateRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error approving ECN:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  } finally {
    client.release();
  }
};
