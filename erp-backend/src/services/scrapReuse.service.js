// src/services/scrapReuse.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reuseScrapIntoStock = async (reuseData) => {
  const { scrap_id, quantity_to_reuse, location_id, reference, created_by } = reuseData;

  return await prisma.$transaction(async (tx) => {
    // 1. Get scrap details
    const scrap = await tx.scrapInventory.findUnique({
      where: { scrap_id },
      include: { material: true }
    });

    if (!scrap) {
      throw new Error('Scrap not found');
    }

    if (scrap.status !== 'AVAILABLE') {
      throw new Error('Scrap is not available for reuse');
    }

    if (scrap.weight_kg < quantity_to_reuse) {
      throw new Error('Insufficient scrap quantity');
    }

    // 2. Create inventory transaction for re-entering scrap
    const inventoryTxn = await tx.inventoryTxn.create({
      data: {
        material_id: scrap.material_id,
        txn_type: 'RECEIVE',
        quantity: quantity_to_reuse,
        location_id: location_id || scrap.location_id,
        reference: reference || `SCRAP_REUSE_${scrap_id}`,
        created_by
      }
    });

    // 3. Update or create inventory record
    const existingInventory = await tx.inventory.findFirst({
      where: {
        material_id: scrap.material_id,
        location_id: location_id || scrap.location_id
      }
    });

    if (existingInventory) {
      await tx.inventory.update({
        where: { inventory_id: existingInventory.inventory_id },
        data: {
          quantity: existingInventory.quantity + quantity_to_reuse,
          updated_at: new Date()
        }
      });
    } else {
      await tx.inventory.create({
        data: {
          material_id: scrap.material_id,
          quantity: quantity_to_reuse,
          location_id: location_id || scrap.location_id,
          uom_id: scrap.material?.uom_id,
          status: 'AVAILABLE'
        }
      });
    }

    // 4. Update scrap status or quantity
    if (scrap.weight_kg === quantity_to_reuse) {
      // Fully consumed
      await tx.scrapInventory.update({
        where: { scrap_id },
        data: { status: 'CONSUMED' }
      });
    } else {
      // Partially consumed - update weight
      await tx.scrapInventory.update({
        where: { scrap_id },
        data: { 
          weight_kg: scrap.weight_kg - quantity_to_reuse 
        }
      });
    }

    // 5. Create scrap transaction record
    const scrapTxn = await tx.scrapTransaction.create({
      data: {
        scrap_id,
        txn_type: 'REUSED',
        weight_kg: quantity_to_reuse,
        reference: reference || `INVENTORY_TXN_${inventoryTxn.txn_id}`,
        created_by
      }
    });

    // 6. Update wastage record with reentry transaction reference
    const wastage = await tx.wastage.findFirst({
      where: { 
        material_id: scrap.material_id,
        reentry_txn_id: null
      }
    });

    if (wastage) {
      await tx.wastage.update({
        where: { wastage_id: wastage.wastage_id },
        data: { reentry_txn_id: inventoryTxn.txn_id }
      });
    }

    return {
      inventory_txn: inventoryTxn,
      scrap_transaction: scrapTxn,
      scrap_updated: scrap,
      wastage_updated: wastage
    };
  });
};

export const getReusableScrap = async (materialId, locationId = null) => {
  const where = {
    material_id: materialId,
    status: 'AVAILABLE'
  };

  if (locationId) {
    where.location_id = locationId;
  }

  return await prisma.scrapInventory.findMany({
    where,
    include: {
      material: true,
      location: true,
      blank: true
    },
    orderBy: { created_at: 'asc' } // FIFO - First In, First Out
  });
};

export const getScrapReuseHistory = async (filters = {}) => {
  const { material_id, location_id, start_date, end_date, limit = 50, offset = 0 } = filters;
  
  const where = {
    txn_type: 'REUSED'
  };

  if (material_id) {
    where.scrap = {
      material_id
    };
  }

  if (location_id) {
    where.scrap = {
      ...where.scrap,
      location_id
    };
  }

  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }

  return await prisma.scrapTransaction.findMany({
    where,
    include: {
      scrap: {
        include: {
          material: true,
          location: true
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};

export const calculateScrapReuseSavings = async (filters = {}) => {
  const { start_date, end_date, material_id } = filters;
  
  const where = {
    txn_type: 'REUSED'
  };

  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }

  const reuseTransactions = await prisma.scrapTransaction.findMany({
    where,
    include: {
      scrap: {
        include: {
          material: true
        }
      }
    }
  });

  // Calculate savings by material
  const savings = reuseTransactions.reduce((acc, txn) => {
    const materialId = txn.scrap.material_id;
    const materialName = txn.scrap.material?.name || 'Unknown';
    
    if (!acc[materialId]) {
      acc[materialId] = {
        material_id: materialId,
        material_name: materialName,
        total_weight_reused: 0,
        estimated_cost_savings: 0,
        reuse_count: 0
      };
    }
    
    acc[materialId].total_weight_reused += txn.weight_kg || 0;
    acc[materialId].reuse_count += 1;
    // Assuming average material cost of $10/kg for calculation
    acc[materialId].estimated_cost_savings += (txn.weight_kg || 0) * 10;
    
    return acc;
  }, {});

  return Object.values(savings);
};
