// src/services/stockAdjustment.service.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const adjustStock = async (adjustmentData) => {
  const { 
    product_id, 
    material_id, 
    quantity, 
    adjustment_type, 
    reason, 
    location_id, 
    reference, 
    created_by 
  } = adjustmentData;

  return await prisma.$transaction(async (tx) => {
    // 1. Verify product or material exists and get item details
    let itemName = 'Unknown';
    let uom_id = null;
    
    if (product_id) {
      const product = await tx.product.findUnique({
        where: { product_id },
        select: { 
          uom_id: true,
          part_name: true
        }
      });
      
      if (!product) {
        throw new Error(`Product with ID ${product_id} not found`);
      }
      
      itemName = product.part_name || 'Unknown Product';
      uom_id = product.uom_id;
    } else if (material_id) {
      const material = await tx.material.findUnique({
        where: { material_id },
        select: { 
          uom_id: true,
          name: true
        }
      });
      
      if (!material) {
        throw new Error(`Material with ID ${material_id} not found`);
      }
      
      itemName = material.name || 'Unknown Material';
      uom_id = material.uom_id;
    }

    // 2. Find existing inventory record with proper uniqueness
    const whereClause = {
      status: 'AVAILABLE'
    };
    
    if (product_id) {
      whereClause.product_id = product_id;
      whereClause.material_id = null;
    } else {
      whereClause.material_id = material_id;
      whereClause.product_id = null;
    }
    
    if (location_id) {
      whereClause.location_id = location_id;
    }

    const existingInventory = await tx.inventory.findFirst({
      where: whereClause,
      include: {
        product: product_id ? true : false,
        material: material_id ? true : false
      }
    });

    let newQuantity = 0;
    let inventoryRecord;

    // Generate reference once to use consistently
    const adjustmentReference = reference || `STOCK_ADJUSTMENT_${Date.now()}`;

    if (existingInventory) {
      // Calculate new quantity based on adjustment type
      if (adjustment_type === 'INCREASE') {
        newQuantity = existingInventory.quantity + quantity;
      } else if (adjustment_type === 'DECREASE') {
        const calculatedQuantity = existingInventory.quantity - quantity;
        
        // Validate: Prevent negative balances for DECREASE operations
        if (calculatedQuantity < 0) {
          throw new Error(
            `Insufficient stock for ${product_id ? 'product' : 'material'} '${itemName}'. ` +
            `Available: ${existingInventory.quantity}, Required: ${quantity}, ` +
            `Shortage: ${Math.abs(calculatedQuantity)}. Please record stock-in first.`
          );
        }
        
        newQuantity = calculatedQuantity;
      } else if (adjustment_type === 'SET') {
        newQuantity = quantity;
      }

      // Update existing inventory
      inventoryRecord = await tx.inventory.update({
        where: { inventory_id: existingInventory.inventory_id },
        data: {
          quantity: newQuantity,
          updated_at: new Date()
        }
      });
    } else {
      // Create new inventory record
      if (adjustment_type === 'INCREASE' || adjustment_type === 'SET') {
        newQuantity = quantity;
      } else {
        throw new Error(
          `Cannot decrease stock for non-existent inventory. ` +
          `${product_id ? 'Product' : 'Material'} '${itemName}' has no inventory record. ` +
          `Please record stock-in first.`
        );
      }

      inventoryRecord = await tx.inventory.create({
        data: {
          product_id,
          material_id,
          quantity: newQuantity,
          location_id,
          uom_id,
          status: 'AVAILABLE'
        }
      });
    }

    // 3. Create inventory transaction record
    const inventoryTxn = await tx.inventoryTxn.create({
      data: {
        inventory_id: inventoryRecord.inventory_id,
        product_id,
        material_id,
        txn_type: 'ADJUSTMENT',
        quantity: adjustment_type === 'DECREASE' ? -quantity : quantity,
        location_id,
        reference: adjustmentReference,
        created_by
      }
    });

    // 4. Create stock ledger entry
    const stockLedger = await tx.stockLedger.create({
      data: {
        item_type: product_id ? 'PRODUCT' : 'MATERIAL',
        product_id,
        material_id,
        txn_id: inventoryTxn.txn_id,
        txn_type: 'ADJUSTMENT',
        quantity: adjustment_type === 'DECREASE' ? -quantity : quantity,
        location_id,
        reference: adjustmentReference,
        created_by
      }
    });

    return {
      inventory: inventoryRecord,
      transaction: inventoryTxn,
      ledger: stockLedger,
      adjustment_summary: {
        item_type: product_id ? 'PRODUCT' : 'MATERIAL',
        item_id: product_id || material_id,
        previous_quantity: existingInventory?.quantity || 0,
        adjustment_quantity: adjustment_type === 'DECREASE' ? -quantity : quantity,
        new_quantity: newQuantity,
        adjustment_type,
        reason
      }
    };
  });
};

export const getStockAdjustmentHistory = async (filters = {}) => {
  const { 
    product_id, 
    material_id, 
    location_id, 
    start_date, 
    end_date, 
    limit = 50, 
    offset = 0 
  } = filters;
  
  const where = {
    txn_type: 'ADJUSTMENT'
  };

  if (product_id) where.product_id = product_id;
  if (material_id) where.material_id = material_id;
  if (location_id) where.location_id = location_id;

  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }

  return await prisma.inventoryTxn.findMany({
    where,
    include: {
      product: true,
      location: true,
      inventory: true
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};

export const getStockLevels = async (filters = {}) => {
  const { product_id, material_id, location_id, low_stock_threshold } = filters;
  
  const where = {};
  if (product_id) where.product_id = product_id;
  if (material_id) where.material_id = material_id;
  if (location_id) where.location_id = location_id;

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: {
        include: {
          oem: true,
          model: true
        }
      },
      material: true,
      location: true,
      uom: true
    },
    orderBy: [
      { product_id: 'asc' },
      { material_id: 'asc' },
      { location_id: 'asc' }
    ]
  });

  // Add low stock indicators
  const inventoryWithAlerts = inventory.map(item => {
    let isLowStock = false;
    let reorderLevel = null;

    if (item.product_id && item.product) {
      reorderLevel = item.product.min_stock;
      isLowStock = reorderLevel ? item.quantity <= reorderLevel : false;
    } else if (item.material_id && item.material) {
      reorderLevel = item.material.min_stock;
      isLowStock = reorderLevel ? item.quantity <= reorderLevel : false;
    }

    // Override with custom threshold if provided
    if (low_stock_threshold) {
      isLowStock = item.quantity <= low_stock_threshold;
    }

    return {
      ...item,
      is_low_stock: isLowStock,
      reorder_level: reorderLevel
    };
  });

  return inventoryWithAlerts;
};

export const getStockMovementReport = async (filters = {}) => {
  const { 
    product_id, 
    material_id, 
    location_id, 
    start_date, 
    end_date 
  } = filters;

  const where = {};
  if (product_id) where.product_id = product_id;
  if (material_id) where.material_id = material_id;
  if (location_id) where.location_id = location_id;

  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }

  const transactions = await prisma.inventoryTxn.findMany({
    where,
    include: {
      product: true,
      location: true
    },
    orderBy: { created_at: 'desc' }
  });

  // Group by item and calculate movement summary
  const movementSummary = transactions.reduce((acc, txn) => {
    const key = txn.product_id || txn.material_id;
    const itemName = txn.product?.part_name || 'Unknown';
    const itemType = txn.product_id ? 'PRODUCT' : 'MATERIAL';

    if (!acc[key]) {
      acc[key] = {
        item_id: key,
        item_name: itemName,
        item_type: itemType,
        total_in: 0,
        total_out: 0,
        net_movement: 0,
        transaction_count: 0,
        locations: new Set()
      };
    }

    if (txn.quantity > 0) {
      acc[key].total_in += txn.quantity;
    } else {
      acc[key].total_out += Math.abs(txn.quantity);
    }

    acc[key].net_movement += txn.quantity;
    acc[key].transaction_count += 1;
    if (txn.location_id) {
      acc[key].locations.add(txn.location_id);
    }

    return acc;
  }, {});

  // Convert sets to arrays
  return Object.values(movementSummary).map(item => ({
    ...item,
    locations: Array.from(item.locations)
  }));
};
