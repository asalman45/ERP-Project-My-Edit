// src/services/inventory.service.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Fixed location codes (not IDs, since IDs are generated dynamically)
// These will be used to find or create locations
const MAIN_STORE_CODE = 'MAIN-STORE';
const QA_CODE = 'QA-SECTION';
const FINISHED_GOODS_CODE = 'FINISHED-GOODS';
const REWORK_AREA_CODE = 'REWORK-AREA';
const SCRAP_YARD_CODE = 'SCRAP-YARD';

/**
 * ===================================================================
 * IMPORTANT BUSINESS RULE - RAW MATERIAL LOCATION POLICY
 * ===================================================================
 * 
 * ALL RAW MATERIALS (materials from Material table) MUST:
 * 1. Be received into MAIN_STORE location only (stockIn)
 * 2. Be issued from MAIN_STORE location only (stockOut)
 * 3. Be checked in MAIN_STORE location only (getCurrentStock)
 * 
 * ANY locationId parameter passed to these functions for materials
 * will be IGNORED and MAIN_STORE will be used instead.
 * 
 * This ensures centralized raw material inventory management.
 * 
 * Products (finished goods) can have different locations.
 * ===================================================================
 */

/**
 * Helper function to get or create a location by code
 * @param {string} code - Location code
 * @param {string} name - Location name
 * @param {string} type - Location type
 * @returns {string} Location ID
 */
const getOrCreateLocation = async (code, name, type = null) => {
  let location = await prisma.location.findUnique({
    where: { code }
  });

  if (!location) {
    location = await prisma.location.create({
      data: { code, name, type }
    });
    logger.info({ location_id: location.location_id, code, name }, 'Created new location');
  }

  return location.location_id;
};

/**
 * Core inventory service with business logic and atomic transactions
 * Handles all inventory operations with proper validation and error handling
 */

/**
 * Adjust stock quantity with atomic transaction
 * @param {string} itemId - Material or Product ID
 * @param {string} itemType - 'material' or 'product'
 * @param {number} quantity - Quantity to adjust (positive for stock in, negative for stock out)
 * @param {string} locationId - Location ID
 * @param {Object} options - Additional options
 * @returns {Object} Transaction result
 */
export const adjustStock = async (itemId, itemType, quantity, locationId, options = {}) => {
  const {
    txnType = 'ADJUSTMENT',
    reference = null,
    woId = null,
    poId = null,
    procurementRequestId = null,
    batchNo = null,
    unitCost = null,
    createdBy = 'system',
    reason = null,
    allowNegative = false
  } = options;

  // Validate inputs
  if (!itemId || !itemType || !locationId) {
    throw new Error('Missing required parameters: itemId, itemType, locationId');
  }

  if (quantity === 0) {
    throw new Error('Quantity cannot be zero');
  }

  if (!['material', 'product'].includes(itemType)) {
    throw new Error('itemType must be either "material" or "product"');
  }

  return await prisma.$transaction(async (tx) => {
    try {
      // Find existing inventory record
      const whereClause = {
        location_id: locationId,
        status: 'AVAILABLE'
      };
      
      if (itemType === 'material') {
        whereClause.material_id = itemId;
      } else {
        whereClause.product_id = itemId;
      }

      let inventory = await tx.inventory.findFirst({
        where: whereClause,
        include: {
          material: itemType === 'material',
          product: itemType === 'product',
          location: true
        }
      });

      let newQuantity;
      let inventoryRecord;

      if (!inventory) {
        // Create baseline inventory record at 0 to allow negative balances if needed
        inventory = await tx.inventory.create({
          data: {
            material_id: itemType === 'material' ? itemId : null,
            product_id: itemType === 'product' ? itemId : null,
            quantity: 0,
            location_id: locationId,
            batch_no: batchNo,
            status: 'AVAILABLE'
          }
        });
      }

      // Calculate new quantity
      newQuantity = (inventory.quantity || 0) + quantity;

      // Validate: Prevent negative balances for stock-out operations (ISSUE)
      // Allow negative only for ADJUSTMENT transactions (with proper reason) or if explicitly allowed
      if (newQuantity < 0 && txnType === 'ISSUE' && !allowNegative) {
        const currentQty = inventory.quantity || 0;
        const materialName = inventory.material?.name || inventory.product?.name || itemId;
        throw new Error(
          `Insufficient stock for ${itemType} '${materialName}'. ` +
          `Available: ${currentQty}, Required: ${Math.abs(quantity)}, ` +
          `Shortage: ${Math.abs(newQuantity)}. Please record stock-in first.`
        );
      }

      inventoryRecord = await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: { 
          quantity: newQuantity,
          updated_at: new Date()
        }
      });

      // Create inventory transaction record
      const transaction = await tx.inventoryTxn.create({
        data: {
          inventory_id: inventoryRecord.inventory_id,
          material_id: itemType === 'material' ? itemId : null,
          product_id: itemType === 'product' ? itemId : null,
          wo_id: woId,
          po_id: poId,
          procurement_request_id: procurementRequestId,
          txn_type: txnType,
          quantity: quantity,
          unit_cost: unitCost,
          location_id: locationId,
          batch_no: batchNo,
          reference: reference,
          created_by: createdBy
        }
      });

      logger.info({
        inventory_id: inventoryRecord.inventory_id,
        txn_id: transaction.txn_id,
        item_type: itemType,
        quantity_change: quantity,
        new_quantity: newQuantity,
        txn_type: txnType
      }, 'Stock adjusted successfully');

      return {
        success: true,
        inventory: inventoryRecord,
        transaction: transaction,
        newQuantity: newQuantity,
        quantityChange: quantity
      };

    } catch (error) {
      logger.error({
        error: error.message,
        itemId,
        itemType,
        quantity,
        locationId
      }, 'Failed to adjust stock');
      throw error;
    }
  });
};

/**
 * Stock In - Add inventory (Raw Material Purchase)
 * @param {string} materialId - Material ID
 * @param {number} quantity - Quantity to add
 * @param {string} locationId - Location ID (IGNORED - always uses MAIN_STORE for raw materials)
 * @param {Object} options - Additional options
 */
export const stockIn = async (materialId, quantity, locationId = null, options = {}) => {
  // BUSINESS RULE: Raw materials MUST always go to MAIN_STORE location
  // Ignore any locationId parameter and always use MAIN_STORE
  const fixedLocationId = await getOrCreateLocation(MAIN_STORE_CODE, 'Main Store', 'STORAGE');
  
  const {
    poId = null,
    batchNo = null,
    unitCost = null,
    createdBy = 'system',
    reference = null,
    procurementRequestId = null
  } = options;

  // Business Rule: Stock in must be positive
  if (quantity <= 0) {
    throw new Error('Stock in quantity must be positive');
  }

  logger.info({
    materialId,
    quantity,
    locationId: fixedLocationId,
    note: 'Raw material stock-in always uses MAIN_STORE location'
  }, 'Stock In - Raw Material');

  return await adjustStock(materialId, 'material', quantity, fixedLocationId, {
    txnType: 'RECEIVE',
    poId,
    batchNo,
    unitCost,
    createdBy,
    reference: reference || `STOCK-IN-${Date.now()}`,
    procurementRequestId
  });
};

/**
 * Stock Out - Reduce inventory (Production Consumption)
 * @param {string} materialId - Material ID
 * @param {number} quantity - Quantity to reduce
 * @param {string} locationId - Location ID (IGNORED - always uses MAIN_STORE for raw materials)
 * @param {Object} options - Additional options
 */
export const stockOut = async (materialId, quantity, locationId = null, options = {}) => {
  // BUSINESS RULE: Raw materials MUST always be issued from MAIN_STORE location
  // Ignore any locationId parameter and always use MAIN_STORE
  const fixedLocationId = await getOrCreateLocation(MAIN_STORE_CODE, 'Main Store', 'STORAGE');
  
  const {
    woId = null,
    reference = null,
    createdBy = 'system'
  } = options;

  // Business Rule: Stock out must be positive (will be converted to negative)
  if (quantity <= 0) {
    throw new Error('Stock out quantity must be positive');
  }

  logger.info({
    materialId,
    quantity,
    locationId: fixedLocationId,
    woId,
    note: 'Raw material stock-out always uses MAIN_STORE location'
  }, 'Stock Out - Raw Material');

  return await adjustStock(materialId, 'material', -quantity, fixedLocationId, {
    txnType: 'ISSUE',
    woId,
    createdBy,
    reference: reference || `STOCK-OUT-${Date.now()}`
  });
};

/**
 * Record Wastage - Reduce inventory and log wastage
 * @param {string} materialId - Material ID
 * @param {number} quantity - Quantity wasted
 * @param {string} locationId - Location ID
 * @param {Object} options - Additional options
 */
export const recordWastage = async (materialId, quantity, locationId, options = {}) => {
  const {
    woId = null,
    stepId = null,
    reason = 'Production wastage',
    createdBy = 'system'
  } = options;

  return await prisma.$transaction(async (tx) => {
    try {
      // First, reduce inventory
      const stockResult = await stockOut(materialId, quantity, locationId, {
        woId,
        createdBy,
        reference: `WASTAGE-${Date.now()}`
      });

      // Create wastage record
      const wastage = await tx.wastage.create({
        data: {
          wo_id: woId,
          step_id: stepId,
          material_id: materialId,
          quantity: quantity,
          location_id: locationId,
          reason: reason
        }
      });

      logger.info({
        wastage_id: wastage.wastage_id,
        material_id: materialId,
        quantity,
        wo_id: woId
      }, 'Wastage recorded successfully');

      return {
        success: true,
        wastage: wastage,
        inventoryChange: stockResult
      };

    } catch (error) {
      logger.error({
        error: error.message,
        materialId,
        quantity,
        locationId,
        woId
      }, 'Failed to record wastage');
      throw error;
    }
  });
};

/**
 * Re-entry - Process wastage back to inventory
 * @param {string} wastageId - Wastage ID
 * @param {number} quantity - Quantity to re-enter
 * @param {string} locationId - Destination location
 * @param {Object} options - Additional options
 */
export const reentryWastage = async (wastageId, quantity, locationId, options = {}) => {
  const {
    createdBy = 'system',
    reason = 'Wastage re-entry'
  } = options;

  return await prisma.$transaction(async (tx) => {
    try {
      // Get wastage record
      const wastage = await tx.wastage.findUnique({
        where: { wastage_id: wastageId },
        include: { material: true }
      });

      if (!wastage) {
        throw new Error('Wastage record not found');
      }

      // Business Rule: Cannot re-enter more than available wastage
      if (quantity > wastage.quantity) {
        throw new Error(`Cannot re-enter more than available wastage. Available: ${wastage.quantity}, Requested: ${quantity}`);
      }

      // Add back to inventory
      const stockResult = await stockIn(wastage.material_id, quantity, locationId, {
        createdBy,
        reference: `REENTRY-${wastageId}`
      });

      // Update wastage record
      const updatedWastage = await tx.wastage.update({
        where: { wastage_id: wastageId },
        data: { 
          quantity: wastage.quantity - quantity,
          reentry_txn_id: stockResult.transaction.txn_id
        }
      });

      logger.info({
        wastage_id: wastageId,
        material_id: wastage.material_id,
        quantity_reentered: quantity,
        remaining_wastage: updatedWastage.quantity
      }, 'Wastage re-entry completed');

      return {
        success: true,
        wastage: updatedWastage,
        stockAdded: stockResult
      };

    } catch (error) {
      logger.error({
        error: error.message,
        wastageId,
        quantity,
        locationId
      }, 'Failed to re-enter wastage');
      throw error;
    }
  });
};

/**
 * Finished Goods - Move from raw materials to finished products
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity produced
 * @param {string} locationId - Destination location
 * @param {Object} options - Additional options
 */
export const receiveFinishedGoods = async (productId, quantity, locationId = null, options = {}) => {
  const {
    woId = null,
    batchNo = null,
    unitCost = null,
    createdBy = 'system'
  } = options;

  // Business Rule: Finished goods must be positive
  if (quantity <= 0) {
    throw new Error('Finished goods quantity must be positive');
  }

  // Use fixed location if not provided
  const targetLocationId = locationId || await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');

  return await adjustStock(productId, 'product', quantity, targetLocationId, {
    txnType: 'RECEIVE',
    woId,
    batchNo,
    unitCost,
    createdBy,
    reference: `FINISHED-GOODS-${Date.now()}`
  });
};

/**
 * Get current inventory levels for a specific item and location
 * @param {string} itemId - Material or Product ID
 * @param {string} itemType - 'material' or 'product'
 * @param {string} locationId - Location ID (IGNORED for materials - always checks MAIN_STORE)
 */
export const getCurrentStock = async (itemId, itemType, locationId = null) => {
  try {
    let fixedLocationId;
    
    // BUSINESS RULE: Raw materials are always in MAIN_STORE
    if (itemType === 'material') {
      // For materials, ALWAYS check MAIN_STORE regardless of locationId parameter
      fixedLocationId = await getOrCreateLocation(MAIN_STORE_CODE, 'Main Store', 'STORAGE');
      logger.info({
        itemId,
        itemType,
        location: 'MAIN_STORE (forced)',
        note: 'Raw materials always checked in MAIN_STORE location'
      }, 'Get Current Stock - Material');
    } else {
      // For products, use provided location or default to FINISHED_GOODS
      fixedLocationId = locationId || await getOrCreateLocation(FINISHED_GOODS_CODE, 'Finished Goods Warehouse', 'FINISHED_GOODS');
      logger.info({
        itemId,
        itemType,
        location: locationId ? 'provided' : 'FINISHED_GOODS (default)'
      }, 'Get Current Stock - Product');
    }
    
    const whereClause = {
      location_id: fixedLocationId,
      status: 'AVAILABLE'
    };
    
    if (itemType === 'material') {
      whereClause.material_id = itemId;
    } else {
      whereClause.product_id = itemId;
    }

    const inventory = await prisma.inventory.findFirst({
      where: whereClause,
      include: {
        material: itemType === 'material',
        product: itemType === 'product',
        location: true,
        uom: true
      }
    });

    return {
      available: inventory?.quantity || 0,
      inventory: inventory
    };

  } catch (error) {
    logger.error({
      error: error.message,
      itemId,
      itemType,
      locationId
    }, 'Failed to get current stock');
    throw error;
  }
};

/**
 * Get inventory summary by location
 */
export const getInventorySummary = async () => {
  try {
    const summary = await prisma.inventory.groupBy({
      by: ['location_id'],
      _sum: {
        quantity: true
      },
      _count: {
        inventory_id: true
      },
      where: {
        status: 'AVAILABLE'
      }
    });

    // Get location details
    const locations = await prisma.location.findMany({
      where: {
        location_id: {
          in: summary.map(s => s.location_id)
        }
      }
    });

    return summary.map(s => {
      const location = locations.find(l => l.location_id === s.location_id);
      return {
        location_id: s.location_id,
        location_name: location?.name || 'Unknown',
        location_code: location?.code || 'UNK',
        total_items: s._count.inventory_id,
        total_quantity: s._sum.quantity || 0
      };
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get inventory summary');
    throw error;
  }
};

export default {
  adjustStock,
  stockIn,
  stockOut,
  recordWastage,
  reentryWastage,
  receiveFinishedGoods,
  getCurrentStock,
  getInventorySummary
};

// Export fixed location codes and helper function for use in other modules
export { MAIN_STORE_CODE, QA_CODE, FINISHED_GOODS_CODE, REWORK_AREA_CODE, SCRAP_YARD_CODE, getOrCreateLocation };
