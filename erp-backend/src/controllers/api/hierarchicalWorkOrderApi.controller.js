// src/controllers/api/hierarchicalWorkOrderApi.controller.js
// API Controller for Hierarchical Work Orders

import { 
  createMasterWorkOrder, 
  createChildWorkOrder, 
  getWorkOrderHierarchy,
  getChildWorkOrders,
  checkWorkOrderDependencies,
  triggerNextWorkOrders,
  calculateSheetAllocation
} from '../../services/hierarchicalWorkOrderService.js';
import { generateScrapFromCutting } from '../../services/productionExecutionService.js';
import { logger } from '../../utils/logger.js';
import db from '../../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create Master Work Order (MWO) only - MWO-first workflow
 * POST /api/hierarchical-work-order/hierarchical
 * Body: { productId, quantity, dueDate, createdBy, customer, sales_order_ref, purchase_order_ref }
 */
export async function generateHierarchicalWOs(req, res) {
  try {
    const { productId, quantity, dueDate, startDate, createdBy, customer, sales_order_ref, purchase_order_ref } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }
    
    logger.info({ productId, quantity }, 'API: Creating Master Work Order (MWO)');
    
    const result = await createMasterWorkOrder({
      productId,
      quantity,
      dueDate: dueDate ? new Date(dueDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      createdBy: createdBy || 'system',
      customer,
      sales_order_ref,
      purchase_order_ref
    });
    
    res.json({
      success: true,
      data: result.data,
      message: 'Master Work Order (MWO) created successfully'
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error creating master work order');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create master work order'
    });
  }
}

/**
 * Get work order hierarchy
 * GET /api/work-orders/:woId/hierarchy
 */
export async function getHierarchy(req, res) {
  try {
    const { woId } = req.params;
    
    logger.info({ woId }, 'API: Fetching work order hierarchy');
    
    const result = await getWorkOrderHierarchy(woId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error fetching hierarchy');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch work order hierarchy'
    });
  }
}

/**
 * Get child work orders
 * GET /api/work-orders/:woId/children
 */
export async function getChildren(req, res) {
  try {
    const { woId } = req.params;
    
    logger.info({ woId }, 'API: Fetching child work orders');
    
    const children = await getChildWorkOrders(woId);
    
    res.json({
      success: true,
      data: children,
      total: children.length
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error fetching children');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch child work orders'
    });
  }
}

/**
 * Check work order dependencies
 * GET /api/work-orders/:woId/dependencies
 */
export async function checkDependencies(req, res) {
  try {
    const { woId } = req.params;
    
    logger.info({ woId }, 'API: Checking work order dependencies');
    
    const result = await checkWorkOrderDependencies(woId);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error checking dependencies');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check work order dependencies'
    });
  }
}

/**
 * Trigger next work orders
 * POST /api/work-orders/:woId/trigger-next
 */
export async function triggerNext(req, res) {
  try {
    const { woId } = req.params;
    
    logger.info({ woId }, 'API: Triggering next work orders');
    
    const triggeredWOs = await triggerNextWorkOrders(woId);
    
    res.json({
      success: true,
      data: { triggered_work_orders: triggeredWOs },
      message: `${triggeredWOs.length} work order(s) triggered`
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error triggering next work orders');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger next work orders'
    });
  }
}

/**
 * Calculate sheet allocation for a product
 * POST /api/work-orders/calculate-sheets
 * Body: { productId, quantity }
 */
export async function calculateSheets(req, res) {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and quantity are required'
      });
    }
    
    logger.info({ productId, quantity }, 'API: Calculating sheet allocation');
    
    const result = await calculateSheetAllocation(productId, quantity);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error calculating sheet allocation');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate sheet allocation'
    });
  }
}

/**
 * Create a child work order manually (Frontend API)
 * POST /api/hierarchical-work-order/create
 * Body: { parent_wo_id, operation_type, quantity, customer, sales_order_ref, createdBy }
 */
export async function createWorkOrder(req, res) {
  try {
    let { parent_wo_id, operation_type, quantity, customer, sales_order_ref, createdBy } = req.body;
    
    // Accept operation_type as-is (no mapping, use exact name provided)
    if (operation_type) {
      operation_type = operation_type.trim(); // Just trim whitespace, keep exact name
    }
    
    if (!parent_wo_id || !operation_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Parent WO ID, operation type, and quantity are required'
      });
    }
    
    logger.info({ parent_wo_id, operation_type, quantity }, 'API: Creating child work order');
    
    const result = await createChildWorkOrder({
      parent_wo_id,
      operation_type,
      quantity,
      createdBy: createdBy || 'system',
      customer,
      sales_order_ref
    });
    
    res.json({
      success: true,
      data: result.data,
      message: 'Child work order created successfully'
    });
    
  } catch (error) {
    logger.error({ error, body: req.body }, 'API: Error creating child work order');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create child work order'
    });
  }
}

/**
 * Get all work orders (Frontend API)
 * GET /api/hierarchical-work-order/work-orders
 */
export async function getWorkOrders(req, res) {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        wo.wo_id,
        wo.wo_no,
        wo.product_id,
        p.part_name as product_name,
        wo.quantity,
        wo.status,
        wo.operation_type,
        wo.parent_wo_id,
        wo.scheduled_start,
        wo.scheduled_end,
        wo.priority,
        wo.created_at,
        wo.customer,
        wo.sales_order_ref,
        wo.purchase_order_ref
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE wo.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY wo.created_at DESC`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      workOrders: result.rows
    });
    
  } catch (error) {
    logger.error({ error }, 'API: Error fetching work orders');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch work orders'
    });
  }
}

/**
 * Update work order status
 * PUT /api/hierarchical-work-order/:woId/status
 */
/**
 * Delete work order (with cascading delete for child work orders)
 * DELETE /api/hierarchical-work-order/:woId
 */
export async function deleteWorkOrder(req, res) {
  try {
    const { woId } = req.params;
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if work order exists
      const woCheck = await client.query(`
        SELECT wo_id, wo_no, parent_wo_id, status
        FROM work_order 
        WHERE wo_id = $1
      `, [woId]);
      
      if (woCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Work order not found'
        });
      }
      
      const workOrder = woCheck.rows[0];
      const isParent = !workOrder.parent_wo_id;
      
      // If this is a parent work order, delete all child work orders first
      let deletedChildrenCount = 0;
      if (isParent) {
        // Check for child work orders
        const childrenCheck = await client.query(`
          SELECT wo_id, wo_no, status
          FROM work_order 
          WHERE parent_wo_id = $1
        `, [woId]);
        
        if (childrenCheck.rows.length > 0) {
          deletedChildrenCount = childrenCheck.rows.length;
          logger.info({ 
            parent_wo_id: woId, 
            parent_wo_no: workOrder.wo_no,
            children_count: deletedChildrenCount 
          }, 'Deleting parent work order: will also delete child work orders');
          
          // Delete child work orders (cascade will handle related records)
          await client.query(`
            DELETE FROM work_order 
            WHERE parent_wo_id = $1
          `, [woId]);
        }
      } else {
        // This is a child work order being deleted independently
        logger.info({ 
          child_wo_id: woId, 
          child_wo_no: workOrder.wo_no,
          parent_wo_id: workOrder.parent_wo_id
        }, 'Deleting child work order independently (parent will remain)');
      }
      
      // Delete work order steps (if any)
      await client.query(`
        DELETE FROM work_order_step 
        WHERE wo_id = $1
      `, [woId]);
      
      // Delete work order items (if any)
      await client.query(`
        DELETE FROM work_order_item 
        WHERE wo_id = $1
      `, [woId]);
      
      // Delete the work order itself
      const deleteResult = await client.query(`
        DELETE FROM work_order 
        WHERE wo_id = $1
        RETURNING wo_id, wo_no
      `, [woId]);
      
      await client.query('COMMIT');
      
      logger.info({ 
        wo_id: woId, 
        wo_no: workOrder.wo_no,
        was_parent: isParent,
        deleted_children: deletedChildrenCount
      }, 'Work order deleted successfully');
      
      const message = isParent && deletedChildrenCount > 0
        ? `Parent work order and ${deletedChildrenCount} child work order(s) deleted successfully`
        : isParent
        ? 'Parent work order deleted successfully'
        : 'Child work order deleted successfully';
      
      res.json({
        success: true,
        message: message,
        data: {
          deleted_wo_id: woId,
          deleted_wo_no: workOrder.wo_no,
          was_parent: isParent,
          deleted_children_count: deletedChildrenCount
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    logger.error({ error: error.message, woId: req.params.woId }, 'API: Error deleting work order');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete work order'
    });
  }
}

export async function updateWorkOrderStatus(req, res) {
  try {
    const { woId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    logger.info({ woId, status }, 'API: Updating work order status');
    
    // Get work order details before updating
    const woQuery = `
      SELECT wo_id, wo_no, status, product_id, quantity, parent_wo_id, operation_type
      FROM work_order 
      WHERE wo_id = $1
    `;
    
    const woResult = await db.query(woQuery, [woId]);
    
    if (woResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Work order not found'
      });
    }
    
    const workOrder = woResult.rows[0];
    
    logger.info({
      woId,
      currentStatus: workOrder.status,
      newStatus: status,
      parentWOId: workOrder.parent_wo_id,
      isChildWO: !!workOrder.parent_wo_id,
      willCheckQA: status === 'COMPLETED' && !!workOrder.parent_wo_id
    }, 'Work order status update details');
    
    // Update work order status with automatic date updates
    let updateQuery = '';
    let queryParams = [];
    
    if (status === 'IN_PROGRESS') {
      // Set start date when starting work order (only if not already set)
      updateQuery = `
        UPDATE work_order 
        SET status = $1,
            scheduled_start = COALESCE(scheduled_start, CURRENT_TIMESTAMP)
        WHERE wo_id = $2
        RETURNING wo_id, wo_no, status, scheduled_start, scheduled_end
      `;
      queryParams = [status, woId];
    } else if (status === 'COMPLETED') {
      // Set end date when completing work order
      updateQuery = `
        UPDATE work_order 
        SET status = $1,
            scheduled_end = CURRENT_TIMESTAMP
        WHERE wo_id = $2
        RETURNING wo_id, wo_no, status, scheduled_start, scheduled_end
      `;
      queryParams = [status, woId];
    } else {
      // For other status changes, just update status
      updateQuery = `
        UPDATE work_order 
        SET status = $1
        WHERE wo_id = $2
        RETURNING wo_id, wo_no, status, scheduled_start, scheduled_end
      `;
      queryParams = [status, woId];
    }
    
    const result = await db.query(updateQuery, queryParams);
    
    // ✅ NEW: Auto-calculate scrap when cutting work order is completed
    if (status === 'COMPLETED' && workOrder.operation_type === 'CUTTING') {
      // Run scrap calculation asynchronously (don't block work order completion)
      (async () => {
        try {
          // ✅ FIX: Check if scrap already exists for this work order (prevent duplicate calculation)
          const existingScrapCheck = await db.query(`
            SELECT COUNT(*) as scrap_count
            FROM scrap_inventory si
            WHERE si.reference = $1
          `, [woId]);
          
          if (parseInt(existingScrapCheck.rows[0].scrap_count) > 0) {
            logger.info({ 
              workOrderId: woId, 
              existingScrapCount: existingScrapCheck.rows[0].scrap_count 
            }, 'Scrap already calculated for this work order, skipping duplicate calculation');
            return;
          }
          
          // 1. Get material issued for this work order
          const materialIssueQuery = await db.query(`
            SELECT 
              womi.material_id,
              womi.quantity_issued,
              womi.material_type
            FROM work_order_material_issue womi
            WHERE womi.work_order_id = $1
              AND womi.status = 'ISSUED'
            LIMIT 1
          `, [woId]);
          
          if (materialIssueQuery.rows.length === 0) {
            logger.warn({ workOrderId: woId }, 'No material issued found for scrap calculation');
            return;
          }
          
          const materialIssued = materialIssueQuery.rows[0];
          
          // 2. Get work order quantity (total pieces to produce)
          const woQuantity = parseFloat(workOrder.quantity) || 0;
          
          // 3. Get ALL blank_specs with BOM quantity for this product
          // BOM tells us how many of each sub-assembly is needed per finished product
          const blankSpecQuery = await db.query(`
            SELECT 
              bs.blank_id,
              bs.product_id,
              bs.sub_assembly_name,
              bs.width_mm,
              bs.length_mm,
              bs.thickness_mm,
              bs.sheet_width_mm,
              bs.sheet_length_mm,
              bs.sheet_weight_kg,
              bs.consumption_pct,
              bs.sheet_util_pct,
              bs.pcs_per_sheet,
              bs.material_type,
              bs.cutting_direction,
              COALESCE(bom.quantity, 1) as bom_quantity_per_unit
            FROM blank_spec bs
            LEFT JOIN bom ON bs.product_id = bom.product_id 
                          AND (bs.sub_assembly_name = bom.sub_assembly_name 
                               OR bs.sub_assembly_name LIKE bom.sub_assembly_name || '%'
                               OR bom.sub_assembly_name LIKE bs.sub_assembly_name || '%')
            WHERE bs.product_id = $1
            ORDER BY bs.sub_assembly_name
          `, [workOrder.product_id]);
          
          if (blankSpecQuery.rows.length === 0) {
            logger.warn({ workOrderId: woId, productId: workOrder.product_id }, 'No blank spec found for scrap calculation');
            return;
          }
          
          const blankSpecs = blankSpecQuery.rows;
          
          logger.info({
            workOrderId: woId,
            productId: workOrder.product_id,
            woQuantity,
            blankSpecsCount: blankSpecs.length,
            subAssemblies: blankSpecs.map(bs => ({
              name: bs.sub_assembly_name,
              pcs_per_sheet: bs.pcs_per_sheet,
              consumption_pct: bs.consumption_pct || bs.sheet_util_pct,
              bom_qty: bs.bom_quantity_per_unit
            }))
          }, 'Processing scrap for multiple sub-assemblies with BOM quantities');
          
          // 4. Calculate scrap for EACH sub-assembly and collect data by material_id
          const scrapDataByMaterial = {}; // Group by material_id
          
          for (const blankSpec of blankSpecs) {
            // ✅ FIX: First calculate total blanks needed using BOM quantity
            // blanks_needed = woQuantity × bom_quantity_per_unit
            const bomQty = parseFloat(blankSpec.bom_quantity_per_unit) || 1;
            const blanksNeeded = woQuantity * bomQty;
            
            // Then calculate sheets needed
            const pcsPerSheet = blankSpec.pcs_per_sheet || 1;
            const sheetsForThisSubAssembly = Math.ceil(blanksNeeded / pcsPerSheet);
            
            if (sheetsForThisSubAssembly <= 0) {
              continue;
            }
            
            // ✅ Get scrap data (doesn't create records yet)
            const scrapData = await generateScrapFromCutting({
              workOrderId: woId,
              blankId: blankSpec.blank_id,
              sheetsProcessed: sheetsForThisSubAssembly
            });
            
            // ✅ Group by material_id
            const materialId = scrapData.material_id || 'UNKNOWN';
            
            if (!scrapDataByMaterial[materialId]) {
              scrapDataByMaterial[materialId] = {
                material_id: scrapData.material_id,
                material_name: scrapData.material_name,
                thickness_mm: scrapData.thickness_mm,
                width_mm: scrapData.width_mm,
                length_mm: scrapData.length_mm,
                total_weight_kg: 0,
                total_sheets: 0,
                sub_assemblies: [], // Track which sub-assemblies contributed
                blank_ids: [],
                product_id: scrapData.product_id,
                cutting_direction: scrapData.cutting_direction
              };
            }
            
            // ✅ Combine weights
            scrapDataByMaterial[materialId].total_weight_kg += scrapData.weight_kg;
            scrapDataByMaterial[materialId].total_sheets += scrapData.sheets_processed;
            scrapDataByMaterial[materialId].sub_assemblies.push({
              sub_assembly_name: scrapData.sub_assembly_name,
              blank_id: scrapData.blank_id,
              sheets: scrapData.sheets_processed,
              weight: scrapData.weight_kg,
              scrap_per_sheet: scrapData.scrap_per_sheet,
              consumption_pct: scrapData.consumption_pct,
              blank_width: scrapData.blank_width,
              blank_length: scrapData.blank_length
            });
            scrapDataByMaterial[materialId].blank_ids.push(scrapData.blank_id);
            
            logger.info({
              workOrderId: woId,
              subAssembly: blankSpec.sub_assembly_name,
              blankId: blankSpec.blank_id,
              bomQtyPerUnit: bomQty,
              blanksNeeded: blanksNeeded,
              pcsPerSheet: pcsPerSheet,
              sheetsProcessed: sheetsForThisSubAssembly,
              materialId: materialId,
              scrapWeight: scrapData.weight_kg.toFixed(2)
            }, 'Scrap calculated for sub-assembly (BOM qty considered)');
          }
          
          // ✅ Create combined scrap records by material_id
          const dbClient = await db.connect();
          try {
            await dbClient.query('BEGIN');
            
            const createdScrapIds = [];
            
            for (const [materialId, combinedData] of Object.entries(scrapDataByMaterial)) {
              const scrapId = uuidv4();
              
              // Round total weight to 2 decimals
              const roundedWeight = Math.round(combinedData.total_weight_kg * 100) / 100;
              
              // Create scrap inventory record (ONE per material_id)
              await dbClient.query(`
                INSERT INTO scrap_inventory (
                  scrap_id,
                  material_id,
                  material_name,
                  thickness_mm,
                  width_mm,
                  length_mm,
                  weight_kg,
                  reference,
                  status,
                  orientation
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              `, [
                scrapId,
                combinedData.material_id,
                combinedData.material_name,
                combinedData.thickness_mm,
                combinedData.width_mm,
                combinedData.length_mm,
                roundedWeight, // Combined weight for all sub-assemblies of same material
                woId,
                'AVAILABLE',
                combinedData.cutting_direction || 'HORIZONTAL'
              ]);
              
              // ✅ Create ONE scrap origin record per scrap_id (scrap_id is unique constraint)
              // Use first sub-assembly's data, but note that this scrap contains multiple sub-assemblies
              const firstSubAssembly = combinedData.sub_assemblies[0];
              if (firstSubAssembly) {
                await dbClient.query(`
                  INSERT INTO scrap_origin (
                    scrap_id,
                    source_type,
                    source_reference,
                    product_id,
                    blank_id,
                    bom_efficiency,
                    sheet_dimensions,
                    blank_dimensions,
                    cutting_direction
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                `, [
                  scrapId, // One record per scrap_id (unique constraint)
                  'PRODUCTION',
                  woId,
                  combinedData.product_id,
                  firstSubAssembly.blank_id, // First sub-assembly's blank_id
                  firstSubAssembly.consumption_pct,
                  `${combinedData.width_mm}×${combinedData.length_mm}`,
                  `${firstSubAssembly.blank_width}×${firstSubAssembly.blank_length}`,
                  combinedData.cutting_direction || 'HORIZONTAL'
                ]);
                
                logger.info({
                  workOrderId: woId,
                  scrapId: scrapId,
                  materialId: materialId,
                  subAssembliesCount: combinedData.sub_assemblies.length,
                  firstSubAssembly: firstSubAssembly.sub_assembly_name,
                  note: 'scrap_origin created with first sub-assembly (scrap_id is unique constraint)'
                }, 'Created scrap_origin record (combined material)');
              }
              
              createdScrapIds.push(scrapId);
              
              logger.info({
                workOrderId: woId,
                materialId: materialId,
                materialName: combinedData.material_name,
                totalWeight: roundedWeight,
                totalSheets: combinedData.total_sheets,
                subAssemblies: combinedData.sub_assemblies.map(sa => ({
                  name: sa.sub_assembly_name,
                  sheets: sa.sheets,
                  weight: sa.weight.toFixed(2)
                }))
              }, 'Created combined scrap record by material_id');
            }
            
            await dbClient.query('COMMIT');
            
            logger.info({
              workOrderId: woId,
              woQuantity,
              materialsProcessed: Object.keys(scrapDataByMaterial).length,
              totalScrapRecordsCreated: createdScrapIds.length,
              totalScrapGeneratedKg: Object.values(scrapDataByMaterial).reduce((sum, d) => sum + d.total_weight_kg, 0).toFixed(2),
              materialIssued: materialIssued.quantity_issued
            }, 'Auto-calculated and combined scrap by material_id');
            
          } catch (error) {
            await dbClient.query('ROLLBACK');
            logger.error({ error, workOrderId: woId }, 'Error creating combined scrap records');
            throw error;
          } finally {
            dbClient.release();
          }
          
        } catch (error) {
          logger.error({ error, workOrderId: woId }, 'Error auto-calculating scrap for cutting work order');
          // Don't throw - scrap calculation failure shouldn't fail work order completion
        }
      })();
    }
    
    // If this is a child work order being marked as COMPLETED, check if all children are done
    let qaTransferResult = null;
    if (status === 'COMPLETED' && workOrder.parent_wo_id) {
      try {
        // Small delay to ensure the UPDATE is committed (though shouldn't be needed)
        // Check if all child work orders for the parent are completed
        // Query again to get the most up-to-date statuses
        const childrenQuery = `
          SELECT wo_id, wo_no, status, operation_type
          FROM work_order 
          WHERE parent_wo_id = $1
          ORDER BY created_at
        `;
        
        const childrenResult = await db.query(childrenQuery, [workOrder.parent_wo_id]);
        const allChildren = childrenResult.rows;
        
        logger.info({
          parentWOId: workOrder.parent_wo_id,
          totalChildren: allChildren.length,
          childrenDetails: allChildren.map(c => ({
            wo_id: c.wo_id,
            wo_no: c.wo_no,
            status: c.status,
            operation_type: c.operation_type
          })),
          completedCount: allChildren.filter(c => c.status === 'COMPLETED').length,
          allStatuses: allChildren.map(c => c.status)
        }, 'Child work orders status check');
        
        // Check if all children are COMPLETED (including the one we just updated)
        const allCompleted = allChildren.length > 0 && allChildren.every(child => child.status === 'COMPLETED');
        
        logger.info({
          parentWOId: workOrder.parent_wo_id,
          totalChildren: allChildren.length,
          completedCount: allChildren.filter(c => c.status === 'COMPLETED').length,
          allCompleted,
          statusBreakdown: {
            COMPLETED: allChildren.filter(c => c.status === 'COMPLETED').length,
            IN_PROGRESS: allChildren.filter(c => c.status === 'IN_PROGRESS').length,
            PLANNED: allChildren.filter(c => c.status === 'PLANNED').length,
            OTHER: allChildren.filter(c => !['COMPLETED', 'IN_PROGRESS', 'PLANNED'].includes(c.status)).map(c => c.status)
          }
        }, 'Child work orders completion analysis');
        
        if (allCompleted) {
          // Get parent work order details
          const parentQuery = `
            SELECT product_id, quantity, wo_no
            FROM work_order 
            WHERE wo_id = $1
          `;
          
          const parentResult = await db.query(parentQuery, [workOrder.parent_wo_id]);
          
          if (parentResult.rows.length > 0) {
            const parentWO = parentResult.rows[0];
            
            // Validate quantity before moving to QA
            if (!parentWO.quantity || parentWO.quantity <= 0) {
              logger.error({
                parentWOId: workOrder.parent_wo_id,
                parentWONo: parentWO.wo_no,
                productId: parentWO.product_id,
                quantity: parentWO.quantity,
                message: 'Cannot move product to QA: work order quantity is zero or invalid'
              }, 'QA transfer skipped - invalid quantity');
              
              // Skip QA transfer but continue with work order status update
              // QA transfer will be skipped, but work order status update will proceed
            } else {
            
            logger.info({
              parentWOId: workOrder.parent_wo_id,
              parentWONo: parentWO.wo_no,
              productId: parentWO.product_id,
              quantity: parentWO.quantity,
              message: 'All child work orders completed, preparing to move product to QA'
            }, 'QA transfer starting');
            
            // Move finished product to QA section using fixed location
            const { receiveFinishedGoods, getOrCreateLocation, QA_CODE, FINISHED_GOODS_CODE } = await import('../../services/inventory.service.js');
            
            // Get or create QA location
            const qaLocationId = await getOrCreateLocation(QA_CODE, 'Quality Assurance Section', 'QA');
            
            // Get FINISHED-GOODS location ID (source location)
            const finishedGoodsLocationId = await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');
            
            logger.info({
              qaLocationId,
              qaLocationCode: QA_CODE,
              finishedGoodsLocationId,
              finishedGoodsCode: FINISHED_GOODS_CODE,
              message: 'Locations retrieved/created'
            }, 'QA transfer locations ready');
            
            // Transfer finished goods from FINISHED-GOODS to QA location
            // This will create a proper TRANSFER transaction instead of a new RECEIVE
            try {
              qaTransferResult = await receiveFinishedGoods(
                parentWO.product_id,
                parentWO.quantity,
                qaLocationId,
                {
                  woId: workOrder.parent_wo_id,
                  createdBy: 'system',
                  reference: `QA-TRANSFER-${workOrder.parent_wo_id}`,
                  fromLocationId: finishedGoodsLocationId // This triggers transfer instead of receive
                }
              );
            } catch (qaError) {
              logger.error({
                error: qaError.message,
                stack: qaError.stack,
                parentWOId: workOrder.parent_wo_id,
                productId: parentWO.product_id,
                quantity: parentWO.quantity,
                qaLocationId
              }, 'Failed to transfer product to QA');
              
              // Re-throw if it's a critical error, but allow work order status update to complete
              if (qaError.message.includes('must be positive')) {
                logger.warn({
                  parentWOId: workOrder.parent_wo_id,
                  quantity: parentWO.quantity
                }, 'QA transfer failed due to invalid quantity, but work order status updated');
                // Continue without QA transfer
              } else {
                throw qaError;
              }
            }
            
            logger.info({
              parentWOId: workOrder.parent_wo_id,
              parentWONo: parentWO.wo_no,
              productId: parentWO.product_id,
              quantity: parentWO.quantity,
              qaLocationId,
              qaTransferSuccess: qaTransferResult?.success,
              inventoryId: qaTransferResult?.inventory?.inventory_id,
              transactionId: qaTransferResult?.transaction?.txn_id
            }, 'Finished product moved to QA section');
            }
          } else {
            logger.warn({
              parentWOId: workOrder.parent_wo_id,
              message: 'Parent work order not found'
            }, 'QA transfer skipped - parent WO missing');
          }
        } else {
          logger.info({
            parentWOId: workOrder.parent_wo_id,
            totalChildren: allChildren.length,
            completedCount: allChildren.filter(c => c.status === 'COMPLETED').length,
            message: 'Not all child work orders completed yet'
          }, 'QA transfer skipped - waiting for all children');
        }
      } catch (qaError) {
        logger.error({ 
          error: qaError.message, 
          stack: qaError.stack,
          woId,
          parentWOId: workOrder?.parent_wo_id 
        }, 'Failed to move product to QA section');
        // Don't fail the status update if QA transfer fails
      }
    }
    
    res.json({
      success: true,
      workOrder: result.rows[0],
      qaTransfer: qaTransferResult ? {
        success: true,
        message: 'Product moved to QA section'
      } : null,
      message: 'Work order status updated successfully'
    });
    
  } catch (error) {
    logger.error({ error, woId: req.params.woId }, 'API: Error updating work order status');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update work order status'
    });
  }
}

/**
 * Start a work order with inventory check
 * POST /api/hierarchical-work-order/:woId/start
 */
// start endpoint removed

/**
 * Export Work Orders (PDF/CSV)
 * GET /api/hierarchical-work-order/export
 */
export async function exportWorkOrders(req, res) {
  try {
    const { format = 'csv' } = req.query;
    const { status } = req.query;
    
    let query = `
      SELECT 
        wo.wo_id,
        wo.wo_no,
        wo.product_id,
        p.product_code,
        p.part_name as product_name,
        o.oem_name,
        m.model_name,
        wo.quantity,
        u.code as uom_code,
        wo.status,
        wo.operation_type,
        wo.parent_wo_id,
        wo.scheduled_start,
        wo.scheduled_end,
        wo.priority,
        wo.created_at,
        wo.customer,
        wo.sales_order_ref,
        wo.purchase_order_ref
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      LEFT JOIN oem o ON p.oem_id = o.oem_id
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN uom u ON wo.uom_id = u.uom_id
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE wo.status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY wo.created_at DESC`;
    
    const result = await db.query(query, params);
    const workOrders = result.rows;
    
    // Helper function to format date for Excel (DD/MM/YYYY)
    const formatDateForExcel = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return '';
      }
    };

    // Transform data for export
    const exportData = workOrders.map(wo => ({
      wo_no: wo.wo_no || '',
      product_code: wo.product_code || '',
      product_name: wo.product_name || '',
      oem: wo.oem_name || '',
      model: wo.model_name || '',
      quantity: parseFloat(wo.quantity || 0),
      uom: wo.uom_code || '',
      status: wo.status || '',
      operation_type: wo.operation_type || '',
      priority: wo.priority || '',
      customer: wo.customer || '',
      sales_order_ref: wo.sales_order_ref || '',
      purchase_order_ref: wo.purchase_order_ref || '',
      scheduled_start: formatDateForExcel(wo.scheduled_start),
      scheduled_end: formatDateForExcel(wo.scheduled_end),
      created_at: formatDateForExcel(wo.created_at)
    }));

    if (format === 'pdf') {
      let browser;
      try {
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Work Orders Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .company-header { text-align: center; margin-bottom: 20px; }
                .company-header h1 { color: #333; margin: 0; }
                .company-header p { color: #666; margin: 4px 0; }
                .meta { text-align: center; margin: 12px 0 18px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
                th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 20px; text-align: center; color: #666; font-size: 11px; }
              </style>
            </head>
            <body>
              <div class="company-header">
                <h1>Enterprising Manufacturing Co Pvt. Ltd.</h1>
                <p>Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900</p>
                <p>Tel: (+9221) 3507 5579 | (+92300) 9279500</p>
                <p>NTN No: 7268945-5 | Sales Tax No: 3277-87612-9785</p>
              </div>
              <div class="meta">
                <h2>Work Orders Report</h2>
                <p>Generated on: ${new Date().toLocaleDateString()} &nbsp; | &nbsp; Total Records: ${exportData.length}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>WO No</th>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>OEM</th>
                    <th>Model</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Operation</th>
                    <th>Priority</th>
                    <th>Customer</th>
                    <th>SO Ref</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  ${exportData.map(item => `
                    <tr>
                      <td>${item.wo_no || ''}</td>
                      <td>${item.product_code || ''}</td>
                      <td>${item.product_name || ''}</td>
                      <td>${item.oem || ''}</td>
                      <td>${item.model || ''}</td>
                      <td>${item.quantity} ${item.uom}</td>
                      <td>${item.status || ''}</td>
                      <td>${item.operation_type || ''}</td>
                      <td>${item.priority || ''}</td>
                      <td>${item.customer || ''}</td>
                      <td>${item.sales_order_ref || ''}</td>
                      <td>${item.created_at || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                This report was generated automatically by the ERP system.
              </div>
            </body>
          </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="work-orders-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
      } catch (pdfError) {
        logger.error({ error: pdfError }, 'Failed to generate work orders PDF');
        if (browser) await browser.close();
        return res.status(500).json({
          error: 'Failed to generate PDF',
          message: 'PDF generation failed. Please try again or use CSV export instead.',
        });
      }
    } else if (format === 'csv') {
      const headers = ['WO No', 'Product Code', 'Product Name', 'OEM', 'Model', 'Quantity', 'UOM', 'Status', 'Operation', 'Priority', 'Customer', 'SO Ref', 'PO Ref', 'Scheduled Start', 'Scheduled End', 'Created At'];
      const csvRows = exportData.map(item =>
        [
          item.wo_no,
          item.product_code,
          item.product_name,
          item.oem,
          item.model,
          item.quantity,
          item.uom,
          item.status,
          item.operation_type,
          item.priority,
          item.customer,
          item.sales_order_ref,
          item.purchase_order_ref,
          item.scheduled_start,
          item.scheduled_end,
          item.created_at
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      );

      // Add company header information (centered by adding empty cells)
      const numColumns = headers.length;
      const emptyCells = Array(numColumns).fill('').map(c => `"${c}"`).join(',');
      // Center text by adding empty cells before (approximately half the columns)
      const centerPadding = Math.floor(numColumns / 2) - 1;
      const leftPadding = Array(centerPadding).fill('').map(c => `"${c}"`).join(',');
      const rightPadding = Array(numColumns - centerPadding - 1).fill('').map(c => `"${c}"`).join(',');
      
      // Company info with spacing for emphasis (using uppercase for bold effect)
      const companyHeader = `${leftPadding},"ENTERPRISING MANUFACTURING CO PVT. LTD.",${rightPadding}`;
      const companyInfo = `${leftPadding},"Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900",${rightPadding}`;
      const companyContact = `${leftPadding},"Tel: (+9221) 3507 5579 | (+92300) 9279500",${rightPadding}`;
      const companyTax = `${leftPadding},"NTN No: 7268945-5 | Sales Tax No: 3277-87612-9785",${rightPadding}`;
      const reportTitle = `${leftPadding},"WORK ORDERS REPORT",${rightPadding}`;
      const reportMeta = `${leftPadding},"Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Records: ${exportData.length}",${rightPadding}`;
      
      const csvContent = companyHeader + '\n' +
                        companyInfo + '\n' +
                        companyContact + '\n' +
                        companyTax + '\n' +
                        emptyCells + '\n' +
                        reportTitle + '\n' +
                        reportMeta + '\n' +
                        emptyCells + '\n' +
                        headers.join(',') + '\n' +
                        csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="work-orders-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    return res.status(200).json({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to export work orders');
    return res.status(500).json({
      success: false,
      error: 'Failed to export work orders',
      message: error.message
    });
  }
}

export default {
  generateHierarchicalWOs,
  getHierarchy,
  getChildren,
  checkDependencies,
  triggerNext,
  calculateSheets,
  createWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
  deleteWorkOrder,
  exportWorkOrders
};

