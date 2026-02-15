// src/services/productionExecutionService.js
// Production Execution Service for material issue, output recording, and scrap generation

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Issue materials to a work order
 * @param {Object} params - Material issue parameters
 * @param {string} params.workOrderId - Work Order ID
 * @param {Array} params.materials - Array of materials to issue
 *   Each material object can have:
 *   - material_id: Material ID (required)
 *   - scrap_id: Scrap inventory ID (optional) - if provided, deducts from scrap inventory instead of regular inventory
 *   - quantity_issued: Quantity to issue (required)
 *   - quantity_planned: Planned quantity (optional)
 *   - material_type: Type of material (optional, default: 'SHEET')
 *   - unit_cost: Unit cost (optional, default: 0)
 * @param {string} params.issuedBy - User issuing materials
 * @returns {Promise<Object>} - Issue result
 */
export async function issueMaterialToWorkOrder(params) {
  const { workOrderId, materials, issuedBy } = params;
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info({ workOrderId, materialsCount: materials.length }, 'Issuing materials to work order');
    
    const issueIds = [];
    
    for (const material of materials) {
      // 1. Create material issue record
      const issueResult = await client.query(`
        INSERT INTO work_order_material_issue (
          work_order_id,
          material_id,
          material_type,
          quantity_planned,
          quantity_issued,
          unit_cost,
          total_cost,
          issued_by,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING issue_id
      `, [
        workOrderId,
        material.material_id,
        material.material_type || 'SHEET',
        material.quantity_planned,
        material.quantity_issued,
        material.unit_cost || 0,
        (material.quantity_issued * (material.unit_cost || 0)),
        issuedBy,
        'ISSUED'
      ]);
      
      issueIds.push(issueResult.rows[0].issue_id);
      
      // 2. Handle material deduction - Check if scrap_id is provided
      if (material.scrap_id) {
        // ⭐ NEW: Deduct from scrap inventory
        logger.info({ 
          scrap_id: material.scrap_id, 
          quantity: material.quantity_issued, 
          workOrderId 
        }, 'Deducting scrap inventory for work order');
        
        // Get scrap details
        const scrapCheck = await client.query(`
          SELECT scrap_id, weight_kg, status, material_id
          FROM scrap_inventory
          WHERE scrap_id = $1
            AND status = 'AVAILABLE'
        `, [material.scrap_id]);
        
        if (scrapCheck.rows.length === 0) {
          throw new Error(`Scrap inventory ${material.scrap_id} not found or not available`);
        }
        
        const scrap = scrapCheck.rows[0];
        
        if (scrap.weight_kg < material.quantity_issued) {
          throw new Error(
            `Insufficient scrap quantity. Available: ${scrap.weight_kg} kg, Required: ${material.quantity_issued} kg`
          );
        }
        
        // Calculate remaining weight and status
        const remainingWeight = scrap.weight_kg - material.quantity_issued;
        const isFullyConsumed = remainingWeight <= 0;
        const newStatus = isFullyConsumed ? 'CONSUMED' : 'AVAILABLE';
        
        await client.query(`
          UPDATE scrap_inventory SET
            weight_kg = GREATEST(0, weight_kg - $1),
            status = $3::"ScrapStatus"
          WHERE scrap_id = $2
        `, [material.quantity_issued, material.scrap_id, newStatus]);
        
        // Create scrap transaction record
        const scrapTxnId = uuidv4();
        await client.query(`
          INSERT INTO scrap_transaction (
            txn_id,
            scrap_id,
            txn_type,
            qty_used,
            weight_kg,
            reference,
            created_by,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [
          scrapTxnId,
          material.scrap_id,
          'CONSUMED',
          material.quantity_issued,
          material.quantity_issued,
          `WO-${workOrderId}`,
          issuedBy
        ]);
        
        // Create scrap movement record for audit trail
        await client.query(`
          INSERT INTO scrap_movement (
            scrap_id,
            movement_type,
            quantity,
            reason,
            reference,
            created_by,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
          material.scrap_id,
          'REUSE',
          material.quantity_issued,
          `Issued to Work Order: ${workOrderId}`,
          `WO-${workOrderId}`,
          issuedBy
        ]);
        
        logger.info({ 
          scrap_id: material.scrap_id,
          quantity_issued: material.quantity_issued,
          remaining_weight: remainingWeight,
          fully_consumed: isFullyConsumed,
          workOrderId
        }, 'Scrap inventory deducted successfully');
        
      } else {
        // Existing logic: Deduct from regular inventory
      await client.query(`
        UPDATE inventory SET
          quantity = quantity - $1
        WHERE material_id = $2
          AND status = 'AVAILABLE'
          AND quantity >= $1
      `, [material.quantity_issued, material.material_id]);
      }
      
      // 3. Create inventory transaction (for both scrap and regular inventory)
      await client.query(`
        INSERT INTO inventory_txn (
          txn_id,
          material_id,
          wo_id,
          txn_type,
          quantity,
          reference,
          created_by
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      `, [
        material.material_id,
        workOrderId,
        'ISSUE',
        -material.quantity_issued,
        workOrderId,
        issuedBy
      ]);
    }
    
    // 4. Update work order status
    await client.query(`
      UPDATE work_order SET
        status = 'IN_PROGRESS',
        scheduled_start = COALESCE(scheduled_start, CURRENT_TIMESTAMP)
      WHERE wo_id = $1
    `, [workOrderId]);
    
    await client.query('COMMIT');
    
    logger.info({ 
      workOrderId, 
      issueIds, 
      materialsIssued: materials.length 
    }, 'Materials issued successfully');
    
    return {
      work_order_id: workOrderId,
      issue_ids: issueIds,
      materials_issued: materials.length,
      total_cost: materials.reduce((sum, m) => sum + (m.quantity_issued * (m.unit_cost || 0)), 0),
      issued_at: new Date(),
      issued_by: issuedBy
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, workOrderId }, 'Error issuing materials to work order');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Record production output for a work order
 * @param {Object} params - Production output parameters
 * @param {string} params.workOrderId - Work Order ID
 * @param {string} params.itemId - Item ID (blank_id, product_id, etc.)
 * @param {string} params.itemType - Item type (BLANK, SUB_ASSEMBLY, FINISHED_GOOD)
 * @param {string} params.itemName - Item name
 * @param {number} params.quantityPlanned - Planned quantity
 * @param {number} params.quantityGood - Good quantity produced
 * @param {number} params.quantityRejected - Rejected quantity
 * @param {number} params.quantityRework - Rework quantity
 * @param {string} params.rejectionReason - Rejection reason
 * @param {string} params.recordedBy - User recording output
 * @returns {Promise<Object>} - Output result
 */
export async function recordProductionOutput(params) {
  const {
    workOrderId,
    itemId,
    itemType,
    itemName,
    quantityPlanned,
    quantityGood,
    quantityRejected,
    quantityRework,
    rejectionReason,
    recordedBy
  } = params;
  
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    logger.info({ workOrderId, itemId, quantityGood }, 'Recording production output');
    
    // 1. Create production output record
    const outputResult = await client.query(`
      INSERT INTO production_output (
        work_order_id,
        item_id,
        item_type,
        item_name,
        quantity_planned,
        quantity_good,
        quantity_rejected,
        quantity_rework,
        rejection_reason,
        recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING output_id
    `, [
      workOrderId,
      itemId,
      itemType,
      itemName,
      quantityPlanned,
      quantityGood,
      quantityRejected || 0,
      quantityRework || 0,
      rejectionReason,
      recordedBy
    ]);
    
    const outputId = outputResult.rows[0].output_id;
    
    // 2. Add good output to inventory
    if (quantityGood > 0) {
      // Check if inventory record exists
      const invCheck = await client.query(`
        SELECT inventory_id FROM inventory
        WHERE (product_id = $1 OR material_id = $1)
          AND status = 'AVAILABLE'
        LIMIT 1
      `, [itemId]);
      
      if (invCheck.rows.length > 0) {
        // Update existing
        await client.query(`
          UPDATE inventory SET
            quantity = quantity + $1
          WHERE inventory_id = $2
        `, [quantityGood, invCheck.rows[0].inventory_id]);
      } else {
        // Create new
        await client.query(`
          INSERT INTO inventory (
            inventory_id,
            material_id,
            product_id,
            quantity,
            status,
            created_at,
            updated_at
          ) VALUES (gen_random_uuid(), $1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          itemType === 'BLANK' ? itemId : null,
          itemType === 'FINISHED_GOOD' ? itemId : null,
          quantityGood,
          'AVAILABLE'
        ]);
      }
      
      // Create inventory transaction
      await client.query(`
        INSERT INTO inventory_txn (
          txn_id,
          material_id,
          product_id,
          wo_id,
          txn_type,
          quantity,
          reference,
          created_by
        ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
      `, [
        itemType === 'BLANK' ? itemId : null,
        itemType === 'FINISHED_GOOD' ? itemId : null,
        workOrderId,
        'RECEIPT',
        quantityGood,
        workOrderId,
        recordedBy
      ]);
      
      // ⭐ NEW: Auto-allocate to Sales Order if work order is linked
      if (itemType === 'FINISHED_GOOD') {
        try {
          // Check if work order is linked to a sales order
          const soLinkQuery = `
            SELECT 
              sow.sales_order_id,
              sow.sales_order_item_id,
              sow.quantity as wo_linked_quantity
            FROM sales_order_work_order sow
            WHERE sow.work_order_id = $1
            LIMIT 1
          `;
          
          const soLinkResult = await client.query(soLinkQuery, [workOrderId]);
          
          if (soLinkResult.rows.length > 0) {
            const link = soLinkResult.rows[0];
            
            // Allocate newly produced goods to the sales order item
            // Note: sales_order_item uses 'soi_id' as primary key
            await client.query(`
              UPDATE sales_order_item
              SET 
                qty_allocated_from_stock = COALESCE(qty_allocated_from_stock, 0) + $1,
                qty_to_produce = GREATEST(0, COALESCE(qty_to_produce, qty_ordered) - $1)
              WHERE soi_id = $2
            `, [quantityGood, link.sales_order_item_id]);
            
            logger.info({
              work_order_id: workOrderId,
              sales_order_id: link.sales_order_id,
              quantity_allocated: quantityGood
            }, 'Auto-allocated production output to sales order');
          }
          
          // Check if work order is from Planned Production
          const planCheckQuery = `
            SELECT 
              pp.planned_production_id,
              pp.plan_number,
              pp.product_id,
              pp.quantity_planned
            FROM work_order wo
            JOIN planned_production pp ON wo.sales_order_ref = pp.plan_number
            WHERE wo.wo_id = $1
            LIMIT 1
          `;
          
          const planCheckResult = await client.query(planCheckQuery, [workOrderId]);
          
          if (planCheckResult.rows.length > 0) {
            const plan = planCheckResult.rows[0];
            
            // Mark planned production as completed
            await client.query(`
              UPDATE planned_production
              SET status = 'COMPLETED',
                  end_date = CURRENT_DATE,
                  updated_at = CURRENT_TIMESTAMP
              WHERE planned_production_id = $1
            `, [plan.planned_production_id]);
            
            logger.info({
              planned_production_id: plan.planned_production_id,
              plan_number: plan.plan_number,
              quantity_produced: quantityGood
            }, 'Planned production completed, finished goods added to inventory');
          }
        } catch (allocError) {
          logger.warn({ error: allocError.message, workOrderId }, 
            'Failed to auto-allocate production output, but output recorded');
          // Don't fail the production output recording if allocation fails
        }
      }
    }
    
    // 3. Update material issue consumed quantity
    await client.query(`
      UPDATE work_order_material_issue SET
        quantity_consumed = quantity_issued,
        status = 'CONSUMED'
      WHERE work_order_id = $1
        AND status = 'ISSUED'
    `, [workOrderId]);
    
    await client.query('COMMIT');
    
    logger.info({ 
      workOrderId, 
      outputId, 
      quantityGood, 
      quantityRejected 
    }, 'Production output recorded');
    
    return {
      output_id: outputId,
      work_order_id: workOrderId,
      quantity_good: quantityGood,
      quantity_rejected: quantityRejected,
      quantity_rework: quantityRework,
      recorded_at: new Date()
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, workOrderId }, 'Error recording production output');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Auto-generate scrap records from cutting operation
 * @param {Object} params - Scrap generation parameters
 * @param {string} params.workOrderId - Work Order ID
 * @param {string} params.blankId - Blank spec ID
 * @param {number} params.sheetsProcessed - Number of sheets processed
 * @param {string} params.createdBy - User
 * @returns {Promise<Array>} - Array of created scrap IDs
 */
/**
 * Calculate scrap data from cutting operation (doesn't create records, just returns data)
 * @param {Object} params - Scrap calculation parameters
 * @param {string} params.workOrderId - Work Order ID
 * @param {string} params.blankId - Blank Spec ID
 * @param {number} params.sheetsProcessed - Number of sheets processed
 * @returns {Promise<Object>} - Scrap data object
 */
export async function generateScrapFromCutting(params) {
  const { workOrderId, blankId, sheetsProcessed } = params;
  const client = await db.connect();
  
  try {
    logger.info({ workOrderId, blankId, sheetsProcessed }, 'Calculating scrap from cutting operation');
    
    // Get blank spec details with material_id from BOM
    // Note: blank_spec.sub_assembly_name might be "Shell HRC" while bom.sub_assembly_name is "Shell"
    // So we use LIKE to match partial names (e.g., "Shell HRC" LIKE "Shell%")
    const blankQuery = await client.query(`
      SELECT bs.*, 
             bom.material_id as bom_material_id,
             m.name as material_name
      FROM blank_spec bs
      LEFT JOIN bom ON bs.product_id = bom.product_id 
                    AND (bs.sub_assembly_name = bom.sub_assembly_name 
                         OR bs.sub_assembly_name LIKE bom.sub_assembly_name || '%'
                         OR bom.sub_assembly_name LIKE bs.sub_assembly_name || '%')
      LEFT JOIN material m ON bom.material_id = m.material_id
      WHERE bs.blank_id = $1
    `, [blankId]);
    
    if (blankQuery.rows.length === 0) {
      throw new Error(`Blank spec ${blankId} not found`);
    }
    
    const blank = blankQuery.rows[0];
    blank.material_id = blank.bom_material_id; // Use material_id from BOM
    
    // ✅ Calculate scrap using consumption percentage (better approach)
    const sheetWeightKg = blank.sheet_weight_kg;
    const consumptionPct = blank.consumption_pct || blank.sheet_util_pct;
    
    // Get dimensions for scrap record
    const sheetWidth = blank.sheet_width_mm || 1220;
    const sheetLength = blank.sheet_length_mm || 2440;
    const blankWidth = blank.width_mm;
    const blankLength = blank.length_mm;
    const thickness = blank.thickness_mm || 3;
    
    let scrapWeightPerSheet = 0;
    
    // Use consumption % if available, otherwise fallback to strip calculation
    if (sheetWeightKg && sheetWeightKg > 0 && consumptionPct && consumptionPct > 0 && consumptionPct <= 100) {
      // ✅ Method 1: Consumption percentage based (preferred)
      const scrapPercentage = 100 - consumptionPct;
      scrapWeightPerSheet = Math.round((sheetWeightKg * (scrapPercentage / 100)) * 100) / 100; // Round to 2 decimal places
      
      logger.info({
        workOrderId,
        blankId,
        method: 'consumption_based',
        sheetWeightKg,
        consumptionPct,
        scrapPercentage,
        scrapWeightPerSheet
      }, 'Calculating scrap from consumption percentage');
    } else {
      // ✅ Method 2: Fallback to strip-based calculation
      logger.warn({
        workOrderId,
        blankId,
        sheetWeightKg,
        consumptionPct,
        message: 'Consumption % not available, using strip-based calculation'
      });
    
    // Calculate blanks across and along
    const blanksAcross = Math.floor(sheetWidth / blankWidth);
    const blanksAlong = Math.floor(sheetLength / blankLength);
    
    // Calculate leftover
    const leftoverWidth = sheetWidth - (blanksAcross * blankWidth);
    const leftoverLength = sheetLength - (blanksAlong * blankLength);
    
    // Material density (kg/mm³)
    const density = 0.00000785; // Steel
    
      // Calculate strip weights
      const rightStripWeight = leftoverWidth > 10 
        ? leftoverWidth * sheetLength * thickness * density 
        : 0;
      const bottomStripWeight = leftoverLength > 10 
        ? sheetWidth * leftoverLength * thickness * density 
        : 0;
      
      scrapWeightPerSheet = Math.round((rightStripWeight + bottomStripWeight) * 100) / 100; // Round to 2 decimal places
      
      logger.info({
          workOrderId,
          blankId,
        method: 'strip_based',
          leftoverWidth,
          leftoverLength,
        rightStripWeight,
          bottomStripWeight,
        scrapWeightPerSheet
      }, 'Calculating scrap from strip dimensions');
    }
    
    // ✅ Return scrap data instead of creating records
    const totalScrapWeight = Math.round((scrapWeightPerSheet * sheetsProcessed) * 100) / 100;
    
    return {
      material_id: blank.material_id || null,
      material_name: blank.material_name || 'HRC Sheet',
      thickness_mm: thickness,
      width_mm: sheetWidth,
      length_mm: sheetLength,
      weight_kg: totalScrapWeight, // Total weight for all sheets
      scrap_per_sheet: scrapWeightPerSheet,
      sheets_processed: sheetsProcessed,
      blank_id: blankId,
      product_id: blank.product_id,
      sub_assembly_name: blank.sub_assembly_name,
      consumption_pct: consumptionPct,
      sheet_util_pct: blank.sheet_util_pct,
      cutting_direction: blank.cutting_direction || 'HORIZONTAL',
      blank_width: blankWidth,
      blank_length: blankLength
    };
    
  } catch (error) {
    logger.error({ error, workOrderId, blankId }, 'Error calculating scrap from cutting');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Complete a work order operation
 * @param {string} workOrderId - Work Order ID
 * @param {string} completedBy - User completing the operation
 * @returns {Promise<Object>} - Completion result
 */
export async function completeWorkOrderOperation(workOrderId, completedBy) {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update work order status
    await client.query(`
      UPDATE work_order SET
        status = 'COMPLETED',
        scheduled_end = CURRENT_TIMESTAMP
      WHERE wo_id = $1
    `, [workOrderId]);
    
    // Check for dependent work orders and update their status
    await client.query(`
      UPDATE work_order SET
        dependency_status = 'READY'
      WHERE depends_on_wo_id = $1
        AND status = 'PLANNED'
    `, [workOrderId]);
    
    await client.query('COMMIT');
    
    logger.info({ workOrderId, completedBy }, 'Work order operation completed');
    
    return {
      work_order_id: workOrderId,
      completed_at: new Date(),
      completed_by: completedBy
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, workOrderId }, 'Error completing work order operation');
    throw error;
  } finally {
    client.release();
  }
}

export default {
  issueMaterialToWorkOrder,
  recordProductionOutput,
  generateScrapFromCutting,
  completeWorkOrderOperation
};

