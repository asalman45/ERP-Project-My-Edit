// src/services/reports.service.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateWastageReport = async (filters = {}) => {
  const { start_date, end_date, material_id, wo_id, location_id } = filters;
  
  const where = {};
  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }
  if (material_id) where.material_id = material_id;
  if (wo_id) where.wo_id = wo_id;
  if (location_id) where.location_id = location_id;

  const wastage = await prisma.wastage.findMany({
    where,
    include: {
      material: true,
      uom: true,
      workOrder: {
        include: {
          product: true
        }
      },
      location: true,
      step: true
    },
    orderBy: { created_at: 'desc' }
  });

  // Calculate summary statistics
  const summary = wastage.reduce((acc, item) => {
    const materialId = item.material_id;
    const materialName = item.material?.name || 'Unknown';
    
    if (!acc[materialId]) {
      acc[materialId] = {
        material_id: materialId,
        material_name: materialName,
        total_wastage: 0,
        wastage_count: 0,
        work_orders: new Set(),
        locations: new Set(),
        avg_wastage_per_incident: 0
      };
    }
    
    acc[materialId].total_wastage += item.quantity;
    acc[materialId].wastage_count += 1;
    acc[materialId].work_orders.add(item.wo_id);
    if (item.location_id) {
      acc[materialId].locations.add(item.location_id);
    }
    
    return acc;
  }, {});

  // Calculate averages and format
  const summaryArray = Object.values(summary).map(item => ({
    ...item,
    work_orders: Array.from(item.work_orders),
    locations: Array.from(item.locations),
    work_order_count: item.work_orders.size,
    location_count: item.locations.size,
    avg_wastage_per_incident: item.wastage_count > 0 ? item.total_wastage / item.wastage_count : 0
  }));

  return {
    summary: summaryArray,
    details: wastage,
    total_records: wastage.length,
    date_range: { start_date, end_date }
  };
};

export const generateScrapReport = async (filters = {}) => {
  const { start_date, end_date, material_id, location_id, status } = filters;
  
  const where = {};
  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }
  if (material_id) where.material_id = material_id;
  if (location_id) where.location_id = location_id;
  if (status) where.status = status;

  const scrap = await prisma.scrapInventory.findMany({
    where,
    include: {
      material: true,
      location: true,
      blank: true,
      scrapTxns: {
        orderBy: { created_at: 'desc' }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  // Calculate summary statistics
  const summary = scrap.reduce((acc, item) => {
    const status = item.status;
    
    if (!acc[status]) {
      acc[status] = {
        status,
        count: 0,
        total_weight: 0,
        avg_weight: 0
      };
    }
    
    acc[status].count += 1;
    acc[status].total_weight += item.weight_kg;
    
    return acc;
  }, {});

  // Calculate averages
  Object.values(summary).forEach(item => {
    item.avg_weight = item.count > 0 ? item.total_weight / item.count : 0;
  });

  return {
    summary: Object.values(summary),
    details: scrap,
    total_records: scrap.length,
    date_range: { start_date, end_date }
  };
};

export const generateInventoryReport = async (filters = {}) => {
  const { product_id, material_id, location_id, low_stock_only } = filters;
  
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

  // Add low stock indicators and filter if needed
  let filteredInventory = inventory.map(item => {
    let isLowStock = false;
    let reorderLevel = null;

    if (item.product_id && item.product) {
      reorderLevel = item.product.min_stock;
      isLowStock = reorderLevel ? item.quantity <= reorderLevel : false;
    } else if (item.material_id && item.material) {
      reorderLevel = item.material.min_stock;
      isLowStock = reorderLevel ? item.quantity <= reorderLevel : false;
    }

    return {
      ...item,
      is_low_stock: isLowStock,
      reorder_level: reorderLevel
    };
  });

  if (low_stock_only) {
    filteredInventory = filteredInventory.filter(item => item.is_low_stock);
  }

  // Calculate summary
  const totalItems = filteredInventory.length;
  const lowStockItems = filteredInventory.filter(item => item.is_low_stock).length;
  const totalValue = filteredInventory.reduce((sum, item) => {
    const cost = item.product?.standard_cost || 0;
    return sum + (cost * item.quantity);
  }, 0);

  return {
    summary: {
      total_items: totalItems,
      low_stock_items: lowStockItems,
      low_stock_percentage: totalItems > 0 ? (lowStockItems / totalItems) * 100 : 0,
      estimated_total_value: totalValue
    },
    details: filteredInventory,
    date_range: { generated_at: new Date() }
  };
};

export const generateProductionReport = async (filters = {}) => {
  const { start_date, end_date, product_id, status } = filters;
  
  const where = {};
  if (start_date && end_date) {
    where.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }
  if (product_id) where.product_id = product_id;
  if (status) where.status = status;

  const productions = await prisma.productionOrder.findMany({
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
    orderBy: { created_at: 'desc' }
  });

  // Calculate summary statistics
  const summary = productions.reduce((acc, production) => {
    const status = production.status;
    
    if (!acc[status]) {
      acc[status] = {
        status,
        count: 0,
        total_ordered: 0,
        total_completed: 0,
        completion_rate: 0
      };
    }
    
    acc[status].count += 1;
    acc[status].total_ordered += production.qty_ordered;
    acc[status].total_completed += production.qty_completed;
    
    return acc;
  }, {});

  // Calculate completion rates
  Object.values(summary).forEach(item => {
    item.completion_rate = item.total_ordered > 0 ? (item.total_completed / item.total_ordered) * 100 : 0;
  });

  return {
    summary: Object.values(summary),
    details: productions,
    total_records: productions.length,
    date_range: { start_date, end_date }
  };
};

export const generateCostAnalysisReport = async (filters = {}) => {
  const { start_date, end_date, product_id, material_id } = filters;
  
  // Get material usage from production
  const materialUsageWhere = {};
  if (start_date && end_date) {
    materialUsageWhere.production = {
      created_at: {
        gte: new Date(start_date),
        lte: new Date(end_date)
      }
    };
  }

  const materialUsage = await prisma.productionMaterialUsage.findMany({
    where: materialUsageWhere,
    include: {
      production: {
        include: {
          product: true
        }
      },
      material: true,
      scrap: true
    }
  });

  // Get wastage costs
  const wastageWhere = {};
  if (start_date && end_date) {
    wastageWhere.created_at = {
      gte: new Date(start_date),
      lte: new Date(end_date)
    };
  }
  if (material_id) wastageWhere.material_id = material_id;

  const wastage = await prisma.wastage.findMany({
    where: wastageWhere,
    include: {
      material: true,
      workOrder: {
        include: {
          product: true
        }
      }
    }
  });

  // Calculate costs (assuming average material cost of $10/kg)
  const materialCosts = materialUsage.reduce((acc, usage) => {
    const materialId = usage.material_id;
    const materialName = usage.material?.name || 'Unknown';
    const cost = (usage.qty_issued || 0) * 10; // $10 per unit
    
    if (!acc[materialId]) {
      acc[materialId] = {
        material_id: materialId,
        material_name: materialName,
        total_used: 0,
        total_cost: 0,
        wastage_cost: 0
      };
    }
    
    acc[materialId].total_used += usage.qty_issued || 0;
    acc[materialId].total_cost += cost;
    
    return acc;
  }, {});

  // Add wastage costs
  wastage.forEach(item => {
    const materialId = item.material_id;
    const wastageCost = item.quantity * 10; // $10 per unit
    
    if (materialCosts[materialId]) {
      materialCosts[materialId].wastage_cost += wastageCost;
    } else {
      materialCosts[materialId] = {
        material_id: materialId,
        material_name: item.material?.name || 'Unknown',
        total_used: 0,
        total_cost: 0,
        wastage_cost: wastageCost
      };
    }
  });

  // Calculate efficiency metrics
  const costAnalysis = Object.values(materialCosts).map(item => ({
    ...item,
    wastage_percentage: item.total_used > 0 ? (item.wastage_cost / (item.total_cost + item.wastage_cost)) * 100 : 0,
    efficiency_percentage: item.total_used > 0 ? (item.total_cost / (item.total_cost + item.wastage_cost)) * 100 : 0
  }));

  return {
    summary: costAnalysis,
    total_material_cost: costAnalysis.reduce((sum, item) => sum + item.total_cost, 0),
    total_wastage_cost: costAnalysis.reduce((sum, item) => sum + item.wastage_cost, 0),
    overall_efficiency: costAnalysis.length > 0 ? 
      costAnalysis.reduce((sum, item) => sum + item.efficiency_percentage, 0) / costAnalysis.length : 0,
    date_range: { start_date, end_date }
  };
};
