// src/services/mrpService.js
// Material Requirement Planning (MRP) Service

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { explodeBOM, logBOMExplosion } from './bomService.js';
import procurementRequestService from './procurementRequest.service.js';

/**
 * Run MRP for a sales order or direct product order
 * @param {Object} params - MRP parameters
 * @param {string} params.salesOrderId - Sales Order ID (optional)
 * @param {string} params.productId - Product ID (required if no salesOrderId)
 * @param {number} params.quantity - Quantity (required if no salesOrderId)
 * @param {string} params.requiredByDate - Required by date
 * @param {string} params.createdBy - User running MRP
 * @returns {Promise<Object>} - MRP result with material requirements and shortages
 */
export async function runMRP(params) {
  const { salesOrderId, productId, quantity, requiredByDate, createdBy } = params;
  
  try {
    logger.info({ salesOrderId, productId, quantity }, 'Starting MRP run');
    
    let product_id = productId;
    let qty = quantity;
    let sales_order_id = salesOrderId;
    
    // If sales order provided, get product and quantity from it
    if (salesOrderId) {
      const soQuery = await db.query(`
        SELECT product_id, quantity
        FROM sales_order
        WHERE sales_order_id = $1
      `, [salesOrderId]);
      
      if (soQuery.rows.length === 0) {
        throw new Error(`Sales order ${salesOrderId} not found`);
      }
      
      product_id = soQuery.rows[0].product_id;
      qty = soQuery.rows[0].quantity;
    }
    
    if (!product_id || !qty) {
      throw new Error('Product ID and quantity are required');
    }
    
    // 1. Explode BOM to get material requirements
    const bomExplosion = await explodeBOM(product_id, qty);
    
    // 2. Check inventory availability for each material
    const materialRequirements = [];
    
    // Check sheets (from cut parts)
    for (const cutPart of bomExplosion.cut_parts) {
      const availability = await checkMaterialAvailability(
        cutPart.material_id,
        cutPart.sheets_required,
        'SHEET'
      );
      
      materialRequirements.push({
        material_id: cutPart.material_id,
        material_code: cutPart.material_code,
        material_name: cutPart.material_name,
        material_type: 'SHEET',
        item_name: cutPart.item_name,
        quantity_required: cutPart.sheets_required,
        quantity_available: availability.available,
        quantity_shortage: Math.max(0, cutPart.sheets_required - availability.available),
        unit_cost: cutPart.unit_cost,
        total_cost: cutPart.total_cost,
        is_critical: cutPart.is_critical,
        sheet_dimensions: cutPart.sheet_size,
        has_shortage: cutPart.sheets_required > availability.available
      });
    }
    
    // Check bought-out items
    for (const boughtOut of bomExplosion.bought_outs) {
      const availability = await checkMaterialAvailability(
        boughtOut.material_id,
        boughtOut.required_quantity,
        'BOUGHT_OUT'
      );
      
      materialRequirements.push({
        material_id: boughtOut.material_id,
        material_code: boughtOut.material_code,
        material_name: boughtOut.material_name,
        material_type: 'BOUGHT_OUT',
        item_name: boughtOut.item_name,
        quantity_required: boughtOut.required_quantity,
        quantity_available: availability.available,
        quantity_shortage: Math.max(0, boughtOut.required_quantity - availability.available),
        unit_cost: boughtOut.unit_cost,
        total_cost: boughtOut.total_cost,
        is_critical: boughtOut.is_critical,
        has_shortage: boughtOut.required_quantity > availability.available
      });
    }
    
    // Check consumables
    for (const consumable of bomExplosion.consumables) {
      const availability = await checkMaterialAvailability(
        consumable.material_id,
        consumable.required_quantity,
        'CONSUMABLE'
      );
      
      materialRequirements.push({
        material_id: consumable.material_id,
        material_code: consumable.material_code,
        material_name: consumable.material_name,
        material_type: 'CONSUMABLE',
        item_name: consumable.item_name,
        quantity_required: consumable.required_quantity,
        quantity_available: availability.available,
        quantity_shortage: Math.max(0, consumable.required_quantity - availability.available),
        unit_cost: consumable.unit_cost,
        total_cost: consumable.total_cost,
        is_critical: consumable.is_critical,
        has_shortage: consumable.required_quantity > availability.available
      });
    }
    
    // 3. Identify shortages
    const shortages = materialRequirements.filter(req => req.has_shortage);
    
    // 4. Create material requisitions
    const requisitionIds = await createMaterialRequisitions({
      salesOrderId: sales_order_id,
      productId: product_id,
      materialRequirements,
      requiredByDate,
      createdBy
    });
    
    // 5. Log BOM explosion
    await logBOMExplosion(product_id, qty, bomExplosion, createdBy);
    
    const result = {
      sales_order_id,
      product_id,
      quantity: qty,
      bom_explosion: bomExplosion,
      material_requirements: materialRequirements,
      shortages,
      requisition_ids: requisitionIds,
      summary: {
        total_requirements: materialRequirements.length,
        total_shortages: shortages.length,
        total_cost: materialRequirements.reduce((sum, req) => sum + req.total_cost, 0),
        shortage_cost: shortages.reduce((sum, req) => sum + (req.quantity_shortage * req.unit_cost), 0),
        can_proceed: shortages.length === 0,
        critical_shortages: shortages.filter(s => s.is_critical).length
      },
      mrp_run_timestamp: new Date()
    };
    
    logger.info({ 
      salesOrderId: sales_order_id,
      productId: product_id,
      totalShortages: shortages.length,
      canProceed: result.summary.can_proceed
    }, 'MRP run completed');
    
    return result;
    
  } catch (error) {
    logger.error({ error, params }, 'Error running MRP');
    throw error;
  }
}

/**
 * Check material availability in inventory
 * @param {string} materialId - Material ID
 * @param {number} requiredQty - Required quantity
 * @param {string} materialType - Material type
 * @returns {Promise<Object>} - Availability info
 */
async function checkMaterialAvailability(materialId, requiredQty, materialType) {
  try {
    const query = await db.query(`
      SELECT 
        COALESCE(SUM(quantity), 0) as available_quantity
      FROM inventory
      WHERE material_id = $1
        AND status = 'AVAILABLE'
    `, [materialId]);
    
    const available = query.rows[0]?.available_quantity || 0;
    
    return {
      material_id: materialId,
      available,
      required: requiredQty,
      shortage: Math.max(0, requiredQty - available),
      has_shortage: available < requiredQty
    };
  } catch (error) {
    logger.error({ error, materialId }, 'Error checking material availability');
    return { available: 0, required: requiredQty, shortage: requiredQty, has_shortage: true };
  }
}

/**
 * Create material requisitions for all requirements
 * @param {Object} params - Requisition parameters
 * @returns {Promise<Array>} - Array of created requisition IDs
 */
async function createMaterialRequisitions(params) {
  const { salesOrderId, productId, materialRequirements, requiredByDate, createdBy } = params;
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const requisitionIds = [];
    
    for (const req of materialRequirements) {
      const result = await client.query(`
        INSERT INTO material_requisition (
          sales_order_id,
          material_id,
          material_code,
          material_name,
          material_type,
          quantity_required,
          quantity_available,
          quantity_shortage,
          unit_cost,
          total_cost,
          status,
          priority,
          required_by_date,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING requisition_id
      `, [
        salesOrderId,
        req.material_id,
        req.material_code,
        req.material_name,
        req.material_type,
        req.quantity_required,
        req.quantity_available,
        req.quantity_shortage,
        req.unit_cost,
        req.total_cost,
        req.has_shortage ? 'PENDING' : 'FULFILLED',
        req.is_critical ? 'HIGH' : 'NORMAL',
        requiredByDate,
        createdBy
      ]);
      
      requisitionIds.push(result.rows[0].requisition_id);
    }
    
    await client.query('COMMIT');
    
    logger.info({ 
      salesOrderId, 
      productId, 
      requisitionsCreated: requisitionIds.length 
    }, 'Material requisitions created');
    
    return requisitionIds;
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, params }, 'Error creating material requisitions');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Generate purchase requisitions for shortages
 * @param {string} salesOrderId - Sales Order ID
 * @returns {Promise<Array>} - Array of created PR IDs
 */
export async function generatePurchaseRequisitions(salesOrderId) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get all material requisitions with shortages
    const requisitionsQuery = await client.query(`
      SELECT * FROM material_requisition
      WHERE sales_order_id = $1
        AND quantity_shortage > 0
        AND status = 'PENDING'
    `, [salesOrderId]);
    
    const prIds = [];
    
    for (const req of requisitionsQuery.rows) {
      const shortageQty = Number(req.quantity_shortage) || 0;

      if (shortageQty <= 0) {
        continue;
      }

      // Create purchase requisition
      const prResult = await client.query(`
        INSERT INTO purchase_requisition (
          requester_id,
          status,
          priority,
          requested_by,
          notes
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING requisition_id
      `, [
        req.created_by,
        'PENDING_APPROVAL',
        req.priority,
        req.created_by,
        `Material requisition for Sales Order: ${salesOrderId}`
      ]);
      
      const prId = prResult.rows[0].requisition_id;
      
      // Create purchase requisition item
      await client.query(`
        INSERT INTO purchase_requisition_item (
          requisition_id,
          material_id,
          product_id,
          quantity,
          required_by_date
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        prId,
        req.material_id,
        null, // Material, not product
        shortageQty,
        req.required_by_date
      ]);

      // Mirror this requisition as a procurement request for the dashboard
      try {
        await procurementRequestService.createProcurementRequest({
          material_id: req.material_id,
          quantity: shortageQty,
          requested_by: req.created_by || 'MRP System',
          notes: `Generated from purchase requisition ${prId} for sales order ${salesOrderId || 'manual run'}`,
        });
      } catch (error) {
        logger.error(
          { error, prId, material_id: req.material_id },
          'Failed to create procurement request mirror for purchase requisition'
        );
      }

      prIds.push(prId);
    }
    
    await client.query('COMMIT');
    
    logger.info({ 
      salesOrderId, 
      prCreated: prIds.length 
    }, 'Purchase requisitions generated from MRP');
    
    return prIds;
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, salesOrderId }, 'Error generating purchase requisitions');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get MRP results for a sales order
 * @param {string} salesOrderId - Sales Order ID
 * @returns {Promise<Object>} - MRP results
 */
export async function getMRPResults(salesOrderId) {
  try {
    const requisitionsQuery = await db.query(`
      SELECT * FROM material_requisition
      WHERE sales_order_id = $1
      ORDER BY priority DESC, material_type, material_name
    `, [salesOrderId]);
    
    const requirements = requisitionsQuery.rows;
    const shortages = requirements.filter(req => req.quantity_shortage > 0);
    
    return {
      sales_order_id: salesOrderId,
      material_requirements: requirements,
      shortages,
      summary: {
        total_requirements: requirements.length,
        total_shortages: shortages.length,
        total_cost: requirements.reduce((sum, req) => sum + parseFloat(req.total_cost || 0), 0),
        shortage_cost: shortages.reduce((sum, req) => sum + (req.quantity_shortage * parseFloat(req.unit_cost || 0)), 0),
        can_proceed: shortages.length === 0
      }
    };
  } catch (error) {
    logger.error({ error, salesOrderId }, 'Error fetching MRP results');
    throw error;
  }
}

export default {
  runMRP,
  generatePurchaseRequisitions,
  getMRPResults
};

