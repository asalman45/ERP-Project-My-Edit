// src/services/wastage.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createWastage = async (wastageData) => {
  return await prisma.wastage.create({
    data: wastageData,
    include: {
      workOrder: {
        include: {
          product: true
        }
      },
      step: true,
      material: true,
      uom: true,
      location: true,
      reentry_txn: true
    }
  });
};

export const getAllWastage = async (filters = {}) => {
  const { wo_id, material_id, location_id, limit = 50, offset = 0 } = filters;
  
  const where = {};
  if (wo_id) where.wo_id = wo_id;
  if (material_id) where.material_id = material_id;
  if (location_id) where.location_id = location_id;

  return await prisma.wastage.findMany({
    where,
    include: {
      workOrder: {
        include: {
          product: true
        }
      },
      step: true,
      material: true,
      uom: true,
      location: true,
      reentry_txn: true
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset
  });
};

export const getWastageById = async (wastageId) => {
  return await prisma.wastage.findUnique({
    where: { wastage_id: wastageId },
    include: {
      workOrder: {
        include: {
          product: true
        }
      },
      step: true,
      material: true,
      uom: true,
      location: true,
      reentry_txn: true
    }
  });
};

export const getWastageByWorkOrder = async (woId) => {
  return await prisma.wastage.findMany({
    where: { wo_id: woId },
    include: {
      workOrder: {
        include: {
          product: true
        }
      },
      step: true,
      material: true,
      uom: true,
      location: true,
      reentry_txn: true
    },
    orderBy: { created_at: 'desc' }
  });
};

export const getWastageByMaterial = async (materialId) => {
  return await prisma.wastage.findMany({
    where: { material_id: materialId },
    include: {
      workOrder: {
        include: {
          product: true
        }
      },
      step: true,
      material: true,
      uom: true,
      location: true,
      reentry_txn: true
    },
    orderBy: { created_at: 'desc' }
  });
};

export const updateWastage = async (wastageId, updateData) => {
  return await prisma.wastage.update({
    where: { wastage_id: wastageId },
    data: updateData,
    include: {
      workOrder: {
        include: {
          product: true
        }
      },
      step: true,
      material: true,
      uom: true,
      location: true,
      reentry_txn: true
    }
  });
};

export const getWastageSummary = async (filters = {}) => {
  const { start_date, end_date, material_id, wo_id } = filters;
  
  const where = {};
  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }
  if (material_id) where.material_id = material_id;
  if (wo_id) where.wo_id = wo_id;

  const wastage = await prisma.wastage.findMany({
    where,
    include: {
      material: true,
      uom: true,
      workOrder: {
        include: {
          product: true
        }
      }
    }
  });

  // Group by material and calculate totals
  const summary = wastage.reduce((acc, item) => {
    const key = item.material_id;
    if (!acc[key]) {
      acc[key] = {
        material: item.material,
        total_quantity: 0,
        total_weight: 0,
        wastage_count: 0,
        work_orders: new Set()
      };
    }
    
    acc[key].total_quantity += item.quantity;
    acc[key].wastage_count += 1;
    acc[key].work_orders.add(item.wo_id);
    
    return acc;
  }, {});

  // Convert sets to arrays and format
  return Object.values(summary).map(item => ({
    ...item,
    work_orders: Array.from(item.work_orders),
    work_order_count: item.work_orders.size
  }));
};
