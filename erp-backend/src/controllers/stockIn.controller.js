// src/controllers/stockIn.controller.js
// Controller for Stock In operations

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new stock in record
 * POST /api/inventory/stock-in
 */
export async function createStockIn(req, res) {
  try {
    const {
      material_id,
      material_name,
      quantity,
      unit,
      location,
      supplier,
      purchase_order_ref,
      cost_per_unit,
      total_cost,
      received_by
    } = req.body;

    if (!material_name || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Material name and quantity are required'
      });
    }

    logger.info({ material_name, quantity, location }, 'Creating stock in record');

    const stockInId = `SI-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const insertQuery = `
      INSERT INTO stock_in (
        stock_in_id, material_id, material_name, quantity, unit, location,
        supplier, purchase_order_ref, cost_per_unit, total_cost, received_by,
        received_date, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, 'RECEIVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING stock_in_id
    `;

    const result = await db.query(insertQuery, [
      stockInId, material_id, material_name, quantity, unit || 'Pieces',
      location || 'Raw Material Warehouse', supplier || 'Default Supplier',
      purchase_order_ref || '', cost_per_unit || 0, total_cost || 0,
      received_by || 'current_user'
    ]);

    // Update inventory
    const inventoryQuery = `
      INSERT INTO inventory (
        inventory_id, material_id, location_id, quantity, unit, status,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, (SELECT location_id FROM location WHERE location_name = $2 LIMIT 1), $3, $4, 'AVAILABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT (material_id, location_id) 
      DO UPDATE SET 
        quantity = inventory.quantity + $3,
        updated_at = CURRENT_TIMESTAMP
    `;

    await db.query(inventoryQuery, [
      material_id, location || 'Raw Material Warehouse', quantity, unit || 'Pieces'
    ]);

    // Create inventory transaction
    const txnQuery = `
      INSERT INTO inventory_txn (
        txn_id, material_id, txn_type, quantity, unit, reference_type, reference_id,
        location_id, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'STOCK_IN', $2, $3, 'STOCK_IN', $4,
        (SELECT location_id FROM location WHERE location_name = $5 LIMIT 1), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;

    await db.query(txnQuery, [
      material_id, quantity, unit || 'Pieces', stockInId, location || 'Raw Material Warehouse'
    ]);

    res.json({
      success: true,
      stockInId: result.rows[0].stock_in_id,
      message: 'Stock in record created successfully'
    });

  } catch (error) {
    logger.error({ error, body: req.body }, 'Error creating stock in record');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create stock in record'
    });
  }
}

/**
 * Get all stock in records
 * GET /api/inventory/stock-in
 */
export async function getStockInRecords(req, res) {
  try {
    const query = `
      SELECT 
        stock_in_id,
        material_id,
        material_name,
        quantity,
        unit,
        location,
        supplier,
        purchase_order_ref,
        cost_per_unit,
        total_cost,
        received_by,
        received_date,
        status
      FROM stock_in
      ORDER BY received_date DESC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching stock in records');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stock in records'
    });
  }
}

export default {
  createStockIn,
  getStockInRecords
};
