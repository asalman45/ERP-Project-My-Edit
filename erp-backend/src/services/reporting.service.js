// src/services/reporting.service.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Comprehensive Reporting Service
 * Generates various business reports and analytics
 */

/**
 * Generate inventory valuation report
 */
export const getInventoryValuationReport = async (options = {}) => {
  try {
    const { as_of_date, location_id, category } = options;
    
    const whereClause = {};
    if (location_id) whereClause.location_id = location_id;
    if (as_of_date) whereClause.created_at = { lte: new Date(as_of_date) };

    let whereCondition = '';
    if (location_id) whereCondition += ` AND i.location_id = '${location_id}'`;
    if (as_of_date) whereCondition += ` AND i.created_at <= '${as_of_date}'`;

    const inventoryResult = await db.query(`
      SELECT 
        i.inventory_id,
        i.quantity,
        i.status,
        i.updated_at,
        p.product_code,
        p.part_name,
        p.category as product_category,
        p.standard_cost,
        m.material_code,
        m.name as material_name,
        m.category as material_category,
        u.name as uom_name,
        u.code as uom_code
      FROM inventory i
      LEFT JOIN product p ON i.product_id = p.product_id
      LEFT JOIN material m ON i.material_id = m.material_id
      LEFT JOIN uom u ON i.uom_id = u.uom_id
      WHERE 1=1 ${whereCondition}
    `);

    const inventoryItems = inventoryResult.rows;

    const valuationData = inventoryItems.map(item => {
      const itemName = item.material_name || item.part_name;
      const itemCode = item.material_code || item.product_code;
      const category = item.material_category || item.product_category;
      const unitCost = item.standard_cost || 0;
      const totalValue = item.quantity * unitCost;

      return {
        inventory_id: item.inventory_id,
        item_name: itemName,
        item_code: itemCode,
        category,
        quantity: item.quantity,
        unit_cost: unitCost,
        total_value: totalValue,
        uom: item.uom_name || 'EA',
        status: item.status,
        last_updated: item.updated_at
      };
    });

    const summary = {
      total_items: valuationData.length,
      total_quantity: valuationData.reduce((sum, item) => sum + item.quantity, 0),
      total_value: valuationData.reduce((sum, item) => sum + item.total_value, 0),
      category_breakdown: {},
      status_breakdown: {}
    };

    // Calculate category breakdown
    valuationData.forEach(item => {
      const cat = item.category || 'UNKNOWN';
      if (!summary.category_breakdown[cat]) {
        summary.category_breakdown[cat] = { count: 0, value: 0 };
      }
      summary.category_breakdown[cat].count++;
      summary.category_breakdown[cat].value += item.total_value;
    });

    // Calculate status breakdown
    valuationData.forEach(item => {
      const status = item.status || 'UNKNOWN';
      if (!summary.status_breakdown[status]) {
        summary.status_breakdown[status] = { count: 0, value: 0 };
      }
      summary.status_breakdown[status].count++;
      summary.status_breakdown[status].value += item.total_value;
    });

    logger.info({ 
      total_items: summary.total_items, 
      total_value: summary.total_value,
      as_of_date 
    }, 'Inventory valuation report generated');

    return {
      report_type: 'INVENTORY_VALUATION',
      generated_at: new Date(),
      as_of_date: as_of_date || new Date(),
      summary,
      details: valuationData
    };
  } catch (error) {
    logger.error({ error: error.message, options }, 'Failed to generate inventory valuation report');
    throw error;
  }
};

/**
 * Generate stock movement report
 */
export const getStockMovementReport = async (options = {}) => {
  try {
    const { 
      start_date, 
      end_date, 
      item_type, // 'material', 'product', 'all'
      movement_type, // 'IN', 'OUT', 'all'
      location_id 
    } = options;

    let whereCondition = '';
    if (start_date) whereCondition += ` AND it.created_at >= '${start_date}'`;
    if (end_date) whereCondition += ` AND it.created_at <= '${end_date}'`;
    if (location_id) whereCondition += ` AND it.location_id = '${location_id}'`;
    if (movement_type && movement_type !== 'all') {
      if (movement_type === 'IN') {
        whereCondition += ` AND it.txn_type IN ('STOCK_IN', 'FINISHED_GOODS_RECEIVE', 'REENTRY')`;
      } else if (movement_type === 'OUT') {
        whereCondition += ` AND it.txn_type IN ('STOCK_OUT', 'WASTAGE', 'ISSUE')`;
      }
    }

    let transactions = [];
    try {
      const transactionResult = await db.query(`
        SELECT 
          it.txn_id,
          it.txn_type,
          it.quantity,
          it.unit_cost,
          it.reference,
          it.created_by,
          it.created_at,
          it.location_id,
          m.name as material_name,
          m.material_code,
          p.part_name,
          p.product_code
        FROM inventory_transaction it
        LEFT JOIN material m ON it.material_id = m.material_id
        LEFT JOIN product p ON it.product_id = p.product_id
        WHERE 1=1 ${whereCondition}
        ORDER BY it.created_at DESC
      `);
      transactions = transactionResult.rows;
    } catch (tableError) {
      logger.info('Inventory transaction table not available yet, returning empty report');
      transactions = [];
    }

    const movementData = transactions.map(txn => {
      const itemName = txn.material_name || txn.part_name;
      const itemCode = txn.material_code || txn.product_code;
      const movementType = txn.quantity > 0 ? 'IN' : 'OUT';
      const absoluteQuantity = Math.abs(txn.quantity);

      return {
        txn_id: txn.txn_id,
        txn_type: txn.txn_type,
        item_name: itemName,
        item_code: itemCode,
        quantity: absoluteQuantity,
        movement_type: movementType,
        unit_cost: txn.unit_cost,
        total_value: absoluteQuantity * (txn.unit_cost || 0),
        reference: txn.reference,
        created_by: txn.created_by,
        created_at: txn.created_at,
        location_id: txn.location_id
      };
    });

    const summary = {
      total_transactions: movementData.length,
      total_in_quantity: movementData.filter(m => m.movement_type === 'IN').reduce((sum, m) => sum + m.quantity, 0),
      total_out_quantity: movementData.filter(m => m.movement_type === 'OUT').reduce((sum, m) => sum + m.quantity, 0),
      net_movement: movementData.filter(m => m.movement_type === 'IN').reduce((sum, m) => sum + m.quantity, 0) - 
                   movementData.filter(m => m.movement_type === 'OUT').reduce((sum, m) => sum + m.quantity, 0),
      total_in_value: movementData.filter(m => m.movement_type === 'IN').reduce((sum, m) => sum + m.total_value, 0),
      total_out_value: movementData.filter(m => m.movement_type === 'OUT').reduce((sum, m) => sum + m.total_value, 0),
      txn_type_breakdown: {}
    };

    // Calculate transaction type breakdown
    movementData.forEach(movement => {
      const txnType = movement.txn_type;
      if (!summary.txn_type_breakdown[txnType]) {
        summary.txn_type_breakdown[txnType] = { count: 0, quantity: 0, value: 0 };
      }
      summary.txn_type_breakdown[txnType].count++;
      summary.txn_type_breakdown[txnType].quantity += movement.quantity;
      summary.txn_type_breakdown[txnType].value += movement.total_value;
    });

    logger.info({ 
      total_transactions: summary.total_transactions,
      period: { start_date, end_date }
    }, 'Stock movement report generated');

    return {
      report_type: 'STOCK_MOVEMENT',
      generated_at: new Date(),
      period: { start_date, end_date },
      summary,
      details: movementData
    };
  } catch (error) {
    logger.error({ error: error.message, options }, 'Failed to generate stock movement report');
    throw error;
  }
};

/**
 * Generate purchase order status report
 */
export const getPurchaseOrderStatusReport = async (options = {}) => {
  try {
    const { 
      start_date, 
      end_date, 
      supplier_id, 
      status,
      include_items = false 
    } = options;

    const whereClause = {};
    if (start_date) whereClause.order_date = { gte: new Date(start_date) };
    if (end_date) {
      whereClause.order_date = { 
        ...whereClause.order_date, 
        lte: new Date(end_date) 
      };
    }
    if (supplier_id) whereClause.supplier_id = supplier_id;
    if (status) whereClause.status = status;

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: {
          select: { supplier_name: true, supplier_code: true }
        },
        items: include_items ? {
          include: {
            material: { select: { name: true, material_code: true } },
            product: { select: { part_name: true, product_code: true } }
          }
        } : true,
        goodsReceipts: true,
        threeWayMatches: true,
        invoices: true
      },
      orderBy: { order_date: 'desc' }
    });

    const poStatusData = purchaseOrders.map(po => {
      const totalOrderedValue = po.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const totalReceivedValue = po.goodsReceipts.reduce((sum, grn) => 
        sum + grn.items.reduce((grnSum, item) => grnSum + (item.quantity_received * item.unit_price), 0), 0
      );
      const totalInvoicedValue = po.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);

      const receiptPercentage = totalOrderedValue > 0 ? (totalReceivedValue / totalOrderedValue) * 100 : 0;
      const invoicePercentage = totalOrderedValue > 0 ? (totalInvoicedValue / totalOrderedValue) * 100 : 0;

      return {
        po_id: po.po_id,
        po_no: po.po_no,
        supplier_name: po.supplier.supplier_name,
        supplier_code: po.supplier.supplier_code,
        order_date: po.order_date,
        expected_date: po.expected_date,
        status: po.status,
        total_ordered_value: totalOrderedValue,
        total_received_value: totalReceivedValue,
        total_invoiced_value: totalInvoicedValue,
        receipt_percentage: receiptPercentage,
        invoice_percentage: invoicePercentage,
        items_count: po.items.length,
        grns_count: po.goodsReceipts.length,
        invoices_count: po.invoices.length,
        matching_completed: po.threeWayMatches.length > 0,
        created_by: po.created_by
      };
    });

    const summary = {
      total_orders: poStatusData.length,
      total_ordered_value: poStatusData.reduce((sum, po) => sum + po.total_ordered_value, 0),
      total_received_value: poStatusData.reduce((sum, po) => sum + po.total_received_value, 0),
      total_invoiced_value: poStatusData.reduce((sum, po) => sum + po.total_invoiced_value, 0),
      status_breakdown: {},
      supplier_breakdown: {}
    };

    // Calculate status breakdown
    poStatusData.forEach(po => {
      const status = po.status;
      if (!summary.status_breakdown[status]) {
        summary.status_breakdown[status] = { count: 0, value: 0 };
      }
      summary.status_breakdown[status].count++;
      summary.status_breakdown[status].value += po.total_ordered_value;
    });

    // Calculate supplier breakdown
    poStatusData.forEach(po => {
      const supplier = po.supplier_name;
      if (!summary.supplier_breakdown[supplier]) {
        summary.supplier_breakdown[supplier] = { count: 0, value: 0 };
      }
      summary.supplier_breakdown[supplier].count++;
      summary.supplier_breakdown[supplier].value += po.total_ordered_value;
    });

    logger.info({ 
      total_orders: summary.total_orders,
      total_value: summary.total_ordered_value,
      period: { start_date, end_date }
    }, 'Purchase order status report generated');

    return {
      report_type: 'PURCHASE_ORDER_STATUS',
      generated_at: new Date(),
      period: { start_date, end_date },
      summary,
      details: poStatusData
    };
  } catch (error) {
    logger.error({ error: error.message, options }, 'Failed to generate purchase order status report');
    throw error;
  }
};

/**
 * Generate work order performance report
 */
export const getWorkOrderPerformanceReport = async (options = {}) => {
  try {
    const { 
      start_date, 
      end_date, 
      product_id,
      status,
      include_materials = false 
    } = options;

    const whereClause = {};
    if (start_date) whereClause.created_at = { gte: new Date(start_date) };
    if (end_date) {
      whereClause.created_at = { 
        ...whereClause.created_at, 
        lte: new Date(end_date) 
      };
    }
    if (product_id) whereClause.product_id = product_id;
    if (status) whereClause.status = status;

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      include: {
        product: {
          select: { part_name: true, product_code: true }
        },
        wo_items: true,
        materialReservations: include_materials ? {
          include: {
            material: { select: { name: true, material_code: true } }
          }
        } : true,
        materialConsumptions: include_materials ? {
          include: {
            material: { select: { name: true, material_code: true } }
          }
        } : true,
        steps: {
          orderBy: { step_no: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const performanceData = workOrders.map(wo => {
      const totalQuantity = wo.wo_items.reduce((sum, item) => sum + item.quantity, 0);
      const totalReservedMaterials = wo.materialReservations.reduce((sum, res) => sum + res.quantity, 0);
      const totalConsumedMaterials = wo.materialConsumptions.reduce((sum, cons) => sum + cons.quantity, 0);
      
      const completedSteps = wo.steps.filter(step => step.status === 'COMPLETED').length;
      const totalSteps = wo.steps.length;
      const stepCompletionPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

      // Calculate duration
      const duration = wo.scheduled_end && wo.scheduled_start ? 
        Math.ceil((new Date(wo.scheduled_end) - new Date(wo.scheduled_start)) / (1000 * 60 * 60 * 24)) : null;

      return {
        wo_id: wo.wo_id,
        wo_no: wo.wo_no,
        product_name: wo.product.part_name,
        product_code: wo.product.product_code,
        quantity: totalQuantity,
        status: wo.status,
        priority: wo.priority,
        scheduled_start: wo.scheduled_start,
        scheduled_end: wo.scheduled_end,
        duration_days: duration,
        step_completion_percentage: stepCompletionPercentage,
        total_steps: totalSteps,
        completed_steps: completedSteps,
        materials_reserved: totalReservedMaterials,
        materials_consumed: totalConsumedMaterials,
        material_efficiency: totalReservedMaterials > 0 ? (totalConsumedMaterials / totalReservedMaterials) * 100 : 0,
        created_by: wo.created_by,
        created_at: wo.created_at
      };
    });

    const summary = {
      total_work_orders: performanceData.length,
      total_quantity: performanceData.reduce((sum, wo) => sum + wo.quantity, 0),
      average_duration: performanceData.filter(wo => wo.duration_days).reduce((sum, wo) => sum + wo.duration_days, 0) / 
                       performanceData.filter(wo => wo.duration_days).length || 0,
      average_step_completion: performanceData.reduce((sum, wo) => sum + wo.step_completion_percentage, 0) / performanceData.length || 0,
      status_breakdown: {},
      priority_breakdown: {}
    };

    // Calculate status breakdown
    performanceData.forEach(wo => {
      const status = wo.status;
      if (!summary.status_breakdown[status]) {
        summary.status_breakdown[status] = { count: 0, quantity: 0 };
      }
      summary.status_breakdown[status].count++;
      summary.status_breakdown[status].quantity += wo.quantity;
    });

    // Calculate priority breakdown
    performanceData.forEach(wo => {
      const priority = wo.priority || 'NORMAL';
      if (!summary.priority_breakdown[priority]) {
        summary.priority_breakdown[priority] = { count: 0, quantity: 0 };
      }
      summary.priority_breakdown[priority].count++;
      summary.priority_breakdown[priority].quantity += wo.quantity;
    });

    logger.info({ 
      total_work_orders: summary.total_work_orders,
      period: { start_date, end_date }
    }, 'Work order performance report generated');

    return {
      report_type: 'WORK_ORDER_PERFORMANCE',
      generated_at: new Date(),
      period: { start_date, end_date },
      summary,
      details: performanceData
    };
  } catch (error) {
    logger.error({ error: error.message, options }, 'Failed to generate work order performance report');
    throw error;
  }
};

/**
 * Generate comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async () => {
  try {
    // Inventory summary
    let inventorySummary = { _count: { inventory_id: 0 }, _sum: { quantity: 0 } };
    try {
      const inventoryResult = await db.query('SELECT COUNT(*) as count, SUM(quantity) as total FROM inventory');
      if (inventoryResult.rows.length > 0) {
        inventorySummary = {
          _count: { inventory_id: parseInt(inventoryResult.rows[0].count) },
          _sum: { quantity: parseFloat(inventoryResult.rows[0].total) || 0 }
        };
      }
    } catch (error) {
      logger.info('Inventory table not available for analytics');
    }

    // Purchase orders summary
    let purchaseOrdersSummary = [];
    try {
      const poResult = await db.query('SELECT status, COUNT(*) as count FROM purchase_order GROUP BY status');
      purchaseOrdersSummary = poResult.rows.map(row => ({
        status: row.status,
        _count: { po_id: parseInt(row.count) }
      }));
    } catch (error) {
      logger.info('Purchase order table not available for analytics');
    }

    // Work orders summary
    let workOrdersSummary = [];
    try {
      const woResult = await db.query('SELECT status, COUNT(*) as count FROM work_order GROUP BY status');
      workOrdersSummary = woResult.rows.map(row => ({
        status: row.status,
        _count: { wo_id: parseInt(row.count) }
      }));
    } catch (error) {
      logger.info('Work order table not available for analytics');
    }

    // Recent activities (from audit log)
    let recentActivities = [];
    try {
      const auditResult = await db.query(`
        SELECT action, entity_type, entity_id, user_id, timestamp 
        FROM audit_log 
        ORDER BY timestamp DESC 
        LIMIT 10
      `);
      recentActivities = auditResult.rows;
    } catch (error) {
      logger.info('Audit log table not available for analytics');
    }

    const analytics = {
      inventory: {
        total_items: inventorySummary._count.inventory_id,
        total_quantity: inventorySummary._sum.quantity || 0
      },
      purchase_orders: {
        status_breakdown: purchaseOrdersSummary.reduce((acc, item) => {
          acc[item.status] = item._count.po_id;
          return acc;
        }, {})
      },
      work_orders: {
        status_breakdown: workOrdersSummary.reduce((acc, item) => {
          acc[item.status] = item._count.wo_id;
          return acc;
        }, {})
      },
      recent_activities: recentActivities.map(activity => ({
        action: activity.action,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        user_id: activity.user_id,
        timestamp: activity.timestamp
      })),
      generated_at: new Date()
    };

    logger.info('Dashboard analytics generated');
    return analytics;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate dashboard analytics');
    throw error;
  }
};

export default {
  getInventoryValuationReport,
  getStockMovementReport,
  getPurchaseOrderStatusReport,
  getWorkOrderPerformanceReport,
  getDashboardAnalytics
};
