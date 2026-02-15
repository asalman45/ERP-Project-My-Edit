// src/services/stockLevel.service.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Smart Stock Level Management Service
 * Handles reorder points, alerts, and intelligent stock management
 */

/**
 * Calculate and update stock levels for all items
 */
export const updateStockLevels = async () => {
  try {
    logger.info('Starting stock level calculation...');
    
    const inventoryItems = await prisma.inventory.findMany({
      include: {
        material: true,
        product: true
      }
    });

    const updates = [];
    
    for (const item of inventoryItems) {
      const currentQuantity = item.quantity;
      const minStock = item.min_stock || 0;
      const maxStock = item.max_stock || 0;
      const reorderQty = item.reorder_qty || 0;
      
      // Calculate stock status
      let status = 'AVAILABLE';
      if (currentQuantity === 0) {
        status = 'CONSUMED';
      } else if (currentQuantity <= minStock) {
        status = 'AVAILABLE'; // Keep as AVAILABLE but track urgency separately
      } else if (currentQuantity <= minStock * 1.5) {
        status = 'AVAILABLE';
      }
      
      // Calculate reorder point (when to reorder)
      const reorderPoint = minStock + (reorderQty * 0.5); // Reorder when at 50% of reorder quantity above min
      
      updates.push({
        inventory_id: item.inventory_id,
        status,
        reorder_point: reorderPoint,
        updated_at: new Date()
      });
    }
    
    // Batch update all items
    await Promise.all(
      updates.map(update => 
        prisma.inventory.update({
          where: { inventory_id: update.inventory_id },
          data: {
            status: update.status,
            updated_at: update.updated_at
          }
        })
      )
    );
    
    logger.info({ updated_count: updates.length }, 'Stock levels updated successfully');
    return { updated_count: updates.length, updates };
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to update stock levels');
    throw error;
  }
};

/**
 * Get low stock alerts
 */
export const getLowStockAlerts = async () => {
  try {
    // Get all inventory items and filter for low stock in JavaScript
    const allInventoryItems = await prisma.inventory.findMany({
      include: {
        material: {
          select: { name: true, material_code: true }
        },
        product: {
          select: { part_name: true, product_code: true }
        }
      }
    });

    // Filter for low stock items
    const lowStockItems = allInventoryItems.filter(item => {
      const minStock = item.min_stock || 0;
      return item.quantity <= minStock || item.status === 'CONSUMED';
    }).sort((a, b) => a.quantity - b.quantity);

    const alerts = lowStockItems.map(item => ({
      inventory_id: item.inventory_id,
      item_name: item.material?.name || item.product?.part_name,
      item_code: item.material?.material_code || item.product?.product_code,
      current_quantity: item.quantity,
      min_stock: item.min_stock,
      max_stock: item.max_stock,
      reorder_qty: item.reorder_qty,
      status: item.status,
      urgency: item.status === 'CONSUMED' ? 'CRITICAL' : 
               item.quantity === 0 ? 'CRITICAL' : 'HIGH',
      suggested_reorder: Math.max(item.reorder_qty || item.max_stock - item.quantity, 0)
    }));

    return alerts;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get low stock alerts');
    throw error;
  }
};

/**
 * Generate reorder suggestions
 */
export const generateReorderSuggestions = async () => {
  try {
    const alerts = await getLowStockAlerts();
    
    const suggestions = alerts.map(alert => ({
      ...alert,
      estimated_cost: alert.suggested_reorder * (alert.unit_cost || 0),
      days_until_stockout: Math.ceil(alert.current_quantity / (alert.daily_usage || 1)),
      priority_score: calculatePriorityScore(alert)
    })).sort((a, b) => b.priority_score - a.priority_score);

    return suggestions;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate reorder suggestions');
    throw error;
  }
};

/**
 * Calculate priority score for reorder suggestions
 */
const calculatePriorityScore = (alert) => {
  let score = 0;
  
  // Status priority
  switch (alert.status) {
    case 'OUT_OF_STOCK': score += 100; break;
    case 'CRITICAL': score += 75; break;
    case 'LOW_STOCK': score += 50; break;
    default: score += 25; break;
  }
  
  // Quantity ratio (lower current vs min = higher priority)
  if (alert.min_stock > 0) {
    const ratio = alert.current_quantity / alert.min_stock;
    score += Math.max(0, (1 - ratio) * 50);
  }
  
  // Urgency multiplier
  switch (alert.urgency) {
    case 'CRITICAL': score *= 2; break;
    case 'HIGH': score *= 1.5; break;
    case 'MEDIUM': score *= 1.2; break;
  }
  
  return Math.round(score);
};

/**
 * Set stock levels for an item
 */
export const setStockLevels = async (inventoryId, levels) => {
  try {
    const { min_stock, max_stock, reorder_qty } = levels;
    
    const updated = await prisma.inventory.update({
      where: { inventory_id: inventoryId },
      data: {
        min_stock: min_stock || 0,
        max_stock: max_stock || 0,
        reorder_qty: reorder_qty || 0,
        updated_at: new Date()
      }
    });
    
    // Update stock status after setting levels
    await updateStockLevels();
    
    logger.info({ inventory_id: inventoryId, levels }, 'Stock levels set successfully');
    return updated;
    
  } catch (error) {
    logger.error({ error: error.message, inventory_id: inventoryId }, 'Failed to set stock levels');
    throw error;
  }
};

/**
 * Get stock level summary
 */
export const getStockLevelSummary = async () => {
  try {
    const summary = await prisma.inventory.groupBy({
      by: ['status'],
      _count: { status: true },
      _sum: { quantity: true }
    });
    
    const totalItems = await prisma.inventory.count();
    const totalValue = await prisma.inventory.aggregate({
      _sum: { quantity: true }
    });
    
    return {
      total_items: totalItems,
      total_quantity: totalValue._sum.quantity || 0,
      status_breakdown: summary.map(item => ({
        status: item.status,
        count: item._count.status,
        total_quantity: item._sum.quantity || 0
      })),
      last_updated: new Date()
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get stock level summary');
    throw error;
  }
};

export default {
  updateStockLevels,
  getLowStockAlerts,
  generateReorderSuggestions,
  setStockLevels,
  getStockLevelSummary
};
