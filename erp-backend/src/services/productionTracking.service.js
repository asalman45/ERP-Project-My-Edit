// src/services/productionTracking.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const recordMaterialUsage = async (usageData) => {
  const { 
    production_id, 
    material_id, 
    scrap_id, 
    qty_issued, 
    uom_id, 
    created_by 
  } = usageData;

  return await prisma.$transaction(async (tx) => {
    // 1. Get production order details
    const productionOrder = await tx.productionOrder.findUnique({
      where: { po_id: production_id },
      include: { product: true }
    });

    if (!productionOrder) {
      throw new Error('Production order not found');
    }

    // 2. Update production material usage
    const materialUsage = await tx.productionMaterialUsage.findFirst({
      where: {
        production_id,
        material_id: material_id || null,
        scrap_id: scrap_id || null
      }
    });

    if (materialUsage) {
      await tx.productionMaterialUsage.update({
        where: { usage_id: materialUsage.usage_id },
        data: {
          qty_issued: materialUsage.qty_issued + qty_issued
        }
      });
    } else {
      await tx.productionMaterialUsage.create({
        data: {
          production_id,
          material_id,
          scrap_id,
          qty_required: qty_issued, // Assuming required = issued for now
          qty_issued,
          uom_id
        }
      });
    }

    // 3. Create inventory transaction
    const inventoryTxn = await tx.inventoryTxn.create({
      data: {
        material_id,
        txn_type: 'ISSUE',
        quantity: -qty_issued, // Negative for issue
        reference: `PRODUCTION_${production_id}`,
        created_by
      }
    });

    // 4. Update inventory
    const inventory = await tx.inventory.findFirst({
      where: {
        material_id,
        status: 'AVAILABLE'
      }
    });

    if (inventory) {
      await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: {
          quantity: Math.max(0, inventory.quantity - qty_issued),
          updated_at: new Date()
        }
      });
    }

    // 5. Create stock ledger entry
    await tx.stockLedger.create({
      data: {
        item_type: 'MATERIAL',
        material_id,
        txn_id: inventoryTxn.txn_id,
        txn_type: 'ISSUE',
        quantity: -qty_issued,
        reference: `PRODUCTION_${production_id}`,
        created_by
      }
    });

    return {
      material_usage: materialUsage,
      inventory_transaction: inventoryTxn,
      inventory_updated: inventory
    };
  });
};

export const updateProductionStep = async (stepData) => {
  const { 
    ps_id, 
    completed_qty, 
    status, 
    start_time, 
    end_time, 
    remarks 
  } = stepData;

  return await prisma.productionStep.update({
    where: { ps_id },
    data: {
      completed_qty,
      status,
      start_time: start_time ? new Date(start_time) : null,
      end_time: end_time ? new Date(end_time) : null,
      remarks
    },
    include: {
      production: {
        include: {
          product: true
        }
      }
    }
  });
};

export const getProductionProgress = async (productionId) => {
  const production = await prisma.productionOrder.findUnique({
    where: { po_id: productionId },
    include: {
      product: true,
      uom: true,
      materials: {
        include: {
          material: true,
          scrap: true,
          uom: true
        }
      },
      steps: {
        orderBy: { step_no: 'asc' }
      }
    }
  });

  if (!production) {
    throw new Error('Production order not found');
  }

  // Calculate progress metrics
  const totalSteps = production.steps.length;
  const completedSteps = production.steps.filter(step => step.status === 'COMPLETED').length;
  const inProgressSteps = production.steps.filter(step => step.status === 'IN_PROGRESS').length;
  
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const totalMaterialRequired = production.materials.reduce((sum, mat) => sum + mat.qty_required, 0);
  const totalMaterialIssued = production.materials.reduce((sum, mat) => sum + mat.qty_issued, 0);
  const materialProgressPercentage = totalMaterialRequired > 0 ? (totalMaterialIssued / totalMaterialRequired) * 100 : 0;

  return {
    ...production,
    progress_metrics: {
      step_progress: {
        total_steps: totalSteps,
        completed_steps: completedSteps,
        in_progress_steps: inProgressSteps,
        progress_percentage: Math.round(progressPercentage * 100) / 100
      },
      material_progress: {
        total_required: totalMaterialRequired,
        total_issued: totalMaterialIssued,
        progress_percentage: Math.round(materialProgressPercentage * 100) / 100
      },
      production_progress: {
        qty_ordered: production.qty_ordered,
        qty_completed: production.qty_completed,
        completion_percentage: Math.round((production.qty_completed / production.qty_ordered) * 100 * 100) / 100
      }
    }
  };
};

export const getProductionOrders = async (filters = {}) => {
  const { 
    status, 
    product_id, 
    start_date, 
    end_date, 
    limit = 50, 
    offset = 0 
  } = filters;
  
  const where = {};
  if (status) where.status = status;
  if (product_id) where.product_id = product_id;

  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }

  return await prisma.productionOrder.findMany({
    where,
    include: {
      product: true,
      uom: true,
      materials: {
        include: {
          material: true,
          scrap: true
        }
      },
      steps: true
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};

export const getProductionEfficiency = async (filters = {}) => {
  const { start_date, end_date, product_id } = filters;
  
  const where = {};
  if (product_id) where.product_id = product_id;
  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }

  const productions = await prisma.productionOrder.findMany({
    where,
    include: {
      product: true,
      materials: {
        include: {
          material: true
        }
      },
      steps: true
    }
  });

  // Calculate efficiency metrics
  const efficiencyMetrics = productions.map(production => {
    const totalPlannedTime = production.steps.reduce((sum, step) => {
      // Assuming each step has a planned duration (you might need to add this to your schema)
      return sum + (step.planned_qty || 0);
    }, 0);

    const totalActualTime = production.steps.reduce((sum, step) => {
      return sum + (step.completed_qty || 0);
    }, 0);

    const materialEfficiency = production.materials.reduce((sum, mat) => {
      const efficiency = mat.qty_required > 0 ? (mat.qty_issued / mat.qty_required) * 100 : 0;
      return sum + efficiency;
    }, 0) / production.materials.length;

    return {
      production_id: production.po_id,
      production_no: production.po_no,
      product_name: production.product?.part_name,
      qty_ordered: production.qty_ordered,
      qty_completed: production.qty_completed,
      completion_rate: production.qty_ordered > 0 ? (production.qty_completed / production.qty_ordered) * 100 : 0,
      material_efficiency: materialEfficiency || 0,
      status: production.status,
      created_at: production.created_at
    };
  });

  return efficiencyMetrics;
};
