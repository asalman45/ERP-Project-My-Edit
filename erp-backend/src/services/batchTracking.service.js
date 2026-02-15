// src/services/batchTracking.service.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Smart Batch Tracking Service
 * Handles FIFO/LIFO logic, expiry tracking, and batch management
 */

/**
 * Create batch record for inventory item
 */
export const createBatch = async (batchData) => {
  try {
    const {
      inventory_id,
      batch_no,
      quantity,
      unit_cost,
      expiry_date,
      supplier_id,
      received_date,
      quality_status = 'PENDING',
      created_by = 'system'
    } = batchData;

    const batch = await prisma.batch.create({
      data: {
        inventory_id,
        batch_no,
        quantity,
        unit_cost,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        supplier_id,
        received_date: received_date ? new Date(received_date) : new Date(),
        quality_status,
        created_by,
        status: 'AVAILABLE'
      }
    });

    logger.info({ batch_id: batch.batch_id, batch_no, inventory_id }, 'Batch created successfully');
    return batch;
  } catch (error) {
    logger.error({ error: error.message, batchData }, 'Failed to create batch');
    throw error;
  }
};

/**
 * Get batches for inventory item with FIFO/LIFO sorting
 */
export const getBatchesForItem = async (inventoryId, sortMethod = 'FIFO') => {
  try {
    const orderBy = sortMethod === 'FIFO' 
      ? { received_date: 'asc' }  // First In, First Out
      : { received_date: 'desc' }; // Last In, First Out

    const batches = await prisma.batch.findMany({
      where: {
        inventory_id: inventoryId,
        status: 'AVAILABLE',
        quantity: { gt: 0 }
      },
      include: {
        supplier: {
          select: { supplier_name: true, supplier_code: true }
        }
      },
      orderBy
    });

    // Add expiry warnings
    const batchesWithWarnings = batches.map(batch => {
      const expiryWarning = getExpiryWarning(batch.expiry_date);
      return {
        ...batch,
        expiry_warning: expiryWarning,
        days_to_expiry: batch.expiry_date ? 
          Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
      };
    });

    logger.info({ inventory_id: inventoryId, batch_count: batches.length, sort_method: sortMethod }, 'Batches retrieved');
    return batchesWithWarnings;
  } catch (error) {
    logger.error({ error: error.message, inventoryId }, 'Failed to get batches for item');
    throw error;
  }
};

/**
 * Consume batch quantity using FIFO/LIFO
 */
export const consumeBatchQuantity = async (inventoryId, quantity, sortMethod = 'FIFO', options = {}) => {
  try {
    const { wo_id, reference, created_by = 'system' } = options;
    
    const batches = await getBatchesForItem(inventoryId, sortMethod);
    
    if (batches.length === 0) {
      throw new Error('No available batches found for this inventory item');
    }

    let remainingQuantity = quantity;
    const consumedBatches = [];

    for (const batch of batches) {
      if (remainingQuantity <= 0) break;

      const availableQuantity = batch.quantity;
      const consumeQuantity = Math.min(remainingQuantity, availableQuantity);

      // Update batch quantity
      const updatedBatch = await prisma.batch.update({
        where: { batch_id: batch.batch_id },
        data: {
          quantity: availableQuantity - consumeQuantity,
          status: (availableQuantity - consumeQuantity) === 0 ? 'CONSUMED' : 'AVAILABLE',
          updated_at: new Date()
        }
      });

      // Create batch consumption record
      await prisma.batchConsumption.create({
        data: {
          batch_id: batch.batch_id,
          quantity: consumeQuantity,
          wo_id,
          reference: reference || `CONSUMPTION-${Date.now()}`,
          created_by,
          consumption_date: new Date()
        }
      });

      consumedBatches.push({
        batch_id: batch.batch_id,
        batch_no: batch.batch_no,
        consumed_quantity: consumeQuantity,
        remaining_quantity: updatedBatch.quantity,
        unit_cost: batch.unit_cost,
        expiry_date: batch.expiry_date
      });

      remainingQuantity -= consumeQuantity;
    }

    if (remainingQuantity > 0) {
      throw new Error(`Insufficient batch quantity. Requested: ${quantity}, Available: ${quantity - remainingQuantity}`);
    }

    logger.info({ 
      inventory_id: inventoryId, 
      total_consumed: quantity, 
      batch_count: consumedBatches.length 
    }, 'Batch quantity consumed successfully');

    return {
      total_consumed: quantity,
      consumed_batches: consumedBatches,
      sort_method: sortMethod
    };
  } catch (error) {
    logger.error({ error: error.message, inventoryId, quantity }, 'Failed to consume batch quantity');
    throw error;
  }
};

/**
 * Get expiry warnings for batches
 */
export const getExpiryWarnings = async (daysBeforeExpiry = 30) => {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);

    // Check if batch table exists and has data
    let expiringBatches = [];
    try {
      expiringBatches = await prisma.batch.findMany({
        where: {
          expiry_date: {
            lte: expiryDate,
            gte: new Date()
          },
          status: 'AVAILABLE',
          quantity: { gt: 0 }
        },
        include: {
          inventory: {
            include: {
              material: { select: { name: true, material_code: true } },
              product: { select: { part_name: true, product_code: true } }
            }
          },
          supplier: {
            select: { supplier_name: true, supplier_code: true }
          }
        },
        orderBy: { expiry_date: 'asc' }
      });
    } catch (tableError) {
      // Batch table might not exist yet, return empty array
      logger.info('Batch table not available yet, returning empty expiry warnings');
      return [];
    }

    const warnings = expiringBatches.map(batch => {
      const daysToExpiry = Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        batch_id: batch.batch_id,
        batch_no: batch.batch_no,
        item_name: batch.inventory.material?.name || batch.inventory.product?.part_name,
        item_code: batch.inventory.material?.material_code || batch.inventory.product?.product_code,
        quantity: batch.quantity,
        expiry_date: batch.expiry_date,
        days_to_expiry: daysToExpiry,
        supplier_name: batch.supplier?.supplier_name,
        urgency: daysToExpiry <= 7 ? 'CRITICAL' : daysToExpiry <= 14 ? 'HIGH' : 'MEDIUM'
      };
    });

    logger.info({ warning_count: warnings.length, days_before_expiry: daysBeforeExpiry }, 'Expiry warnings generated');
    return warnings;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get expiry warnings');
    throw error;
  }
};

/**
 * Get batch summary for inventory item
 */
export const getBatchSummary = async (inventoryId) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { inventory_id: inventoryId },
      include: {
        supplier: {
          select: { supplier_name: true, supplier_code: true }
        }
      }
    });

    const summary = {
      total_batches: batches.length,
      available_batches: batches.filter(b => b.status === 'AVAILABLE' && b.quantity > 0).length,
      total_quantity: batches.reduce((sum, b) => sum + b.quantity, 0),
      total_value: batches.reduce((sum, b) => sum + (b.quantity * b.unit_cost), 0),
      average_cost: batches.length > 0 ? 
        batches.reduce((sum, b) => sum + b.unit_cost, 0) / batches.length : 0,
      expiring_soon: batches.filter(b => {
        if (!b.expiry_date) return false;
        const daysToExpiry = Math.ceil((new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        return daysToExpiry <= 30 && daysToExpiry > 0;
      }).length,
      expired_batches: batches.filter(b => {
        if (!b.expiry_date) return false;
        return new Date(b.expiry_date) < new Date();
      }).length
    };

    return summary;
  } catch (error) {
    logger.error({ error: error.message, inventoryId }, 'Failed to get batch summary');
    throw error;
  }
};

/**
 * Helper function to get expiry warning level
 */
const getExpiryWarning = (expiryDate) => {
  if (!expiryDate) return null;
  
  const daysToExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  if (daysToExpiry < 0) return 'EXPIRED';
  if (daysToExpiry <= 7) return 'CRITICAL';
  if (daysToExpiry <= 14) return 'HIGH';
  if (daysToExpiry <= 30) return 'MEDIUM';
  return 'LOW';
};

export default {
  createBatch,
  getBatchesForItem,
  consumeBatchQuantity,
  getExpiryWarnings,
  getBatchSummary
};
