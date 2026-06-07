// src/controllers/dashboard.controller.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Safe query helper — returns default value instead of throwing
 */
const safeQuery = async (sql, params = [], defaultValue = null) => {
  try {
    const result = await db.query(sql, params);
    return result.rows;
  } catch (err) {
    logger.warn({ error: err.message, sql }, 'Dashboard safeQuery failed — using default');
    return defaultValue !== null ? defaultValue : [];
  }
};

const safeCount = async (sql, params = []) => {
  try {
    const result = await db.query(sql, params);
    return parseInt(result.rows[0]?.count || result.rows[0]?.total || 0);
  } catch (err) {
    logger.warn({ error: err.message, sql }, 'Dashboard safeCount failed — returning 0');
    return 0;
  }
};

const safeSum = async (sql, params = []) => {
  try {
    const result = await db.query(sql, params);
    return parseFloat(result.rows[0]?.total || result.rows[0]?.sum || 0);
  } catch (err) {
    logger.warn({ error: err.message, sql }, 'Dashboard safeSum failed — returning 0');
    return 0;
  }
};

/**
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalMaterials,
      totalWorkOrders,
      totalSuppliers,
      totalCustomers,
      totalSalesOrders,
      activeSalesOrders,
      lowStockCount,
      totalDispatches,
      dispatchedCount,
      totalRevenue,
      totalExpense,
      accountsReceivable,
      accountsPayable
    ] = await Promise.all([
      safeCount('SELECT COUNT(*) as count FROM product'),
      safeCount('SELECT COUNT(*) as count FROM material'),
      safeCount('SELECT COUNT(*) as count FROM work_order'),
      safeCount('SELECT COUNT(*) as count FROM supplier'),
      safeCount('SELECT COUNT(*) as count FROM customer'),
      safeCount("SELECT COUNT(*) as count FROM sales_order"),
      safeCount("SELECT COUNT(*) as count FROM sales_order WHERE status IN ('PENDING','APPROVED','IN_PRODUCTION')"),
      safeCount("SELECT COUNT(*) as count FROM inventory WHERE quantity <= 5 AND quantity > 0 AND status = 'AVAILABLE'"),
      safeCount('SELECT COUNT(*) as count FROM dispatch_order'),
      safeCount("SELECT COUNT(*) as count FROM dispatch_order WHERE status = 'DISPATCHED'"),
      safeSum("SELECT COALESCE(SUM(credit - debit), 0) as total FROM journal_line jl JOIN financial_account fa ON jl.account_id = fa.account_id WHERE fa.type = 'REVENUE'"),
      safeSum("SELECT COALESCE(SUM(debit - credit), 0) as total FROM journal_line jl JOIN financial_account fa ON jl.account_id = fa.account_id WHERE fa.type = 'EXPENSE'"),
      // AR: outstanding customer invoices — handle both status and payment_status column names
      (async () => {
        try {
          // Try payment_status first
          const r = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM customer_invoice WHERE payment_status IN ('PENDING', 'PARTIAL')");
          return parseFloat(r.rows[0]?.total || 0);
        } catch {
          try {
            // Fallback to status column
            const r = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM customer_invoice WHERE status NOT IN ('PAID', 'CANCELLED')");
            return parseFloat(r.rows[0]?.total || 0);
          } catch {
            return 0;
          }
        }
      })(),
      // AP: outstanding purchase invoices
      (async () => {
        try {
          const r = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM purchase_order WHERE status NOT IN ('PAID', 'CANCELLED')");
          return parseFloat(r.rows[0]?.total || 0);
        } catch {
          return 0;
        }
      })()
    ]);

    const stats = {
      totalProducts,
      totalMaterials,
      totalWorkOrders,
      totalSalesOrders,
      activeSalesOrders,
      totalSuppliers,
      totalCustomers,
      lowStockCount,
      totalDispatches,
      dispatchedCount,
      financials: {
        totalRevenue,
        totalExpense,
        accountsReceivable,
        accountsPayable,
        netProfit: totalRevenue - totalExpense
      }
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get dashboard stats');
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/dashboard/inventory-summary
 */
export const getInventorySummary = async (req, res) => {
  try {
    // Use safe individual queries to avoid JOIN failures
    const inventoryRows = await safeQuery(`
      SELECT
        i.quantity,
        i.product_id,
        i.material_id
      FROM inventory i
      WHERE i.quantity > 0
      LIMIT 500
    `, [], []);

    const totalItems = inventoryRows.length;

    // Fetch product codes separately to avoid JOIN issues
    let topProducts = [];
    try {
      const topProductsResult = await db.query(`
        SELECT
          p.product_code,
          p.part_name,
          p.standard_cost,
          COALESCE(SUM(i.quantity), 0) as total_qty
        FROM inventory i
        JOIN product p ON i.product_id = p.product_id
        WHERE i.quantity > 0 AND i.product_id IS NOT NULL
        GROUP BY p.product_code, p.part_name, p.standard_cost
        ORDER BY total_qty DESC
        LIMIT 5
      `);
      topProducts = topProductsResult.rows.map(r => ({
        item_code: r.product_code,
        item_name: r.part_name,
        quantity: parseFloat(r.total_qty || 0),
        standard_cost: parseFloat(r.standard_cost || 0)
      }));
    } catch (err) {
      logger.warn({ error: err.message }, 'Could not fetch top products for dashboard');
    }

    // Calculate total value from safe inventory rows
    const totalValue = inventoryRows.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

    // Low stock count
    const lowStockCount = await safeCount("SELECT COUNT(*) as count FROM inventory WHERE quantity <= 5 AND quantity > 0 AND status = 'AVAILABLE'");
    const zeroStockCount = await safeCount("SELECT COUNT(*) as count FROM inventory WHERE quantity = 0");

    const summary = {
      totalValue,
      totalItems,
      lowStockCount,
      zeroStockCount,
      topProducts
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to get inventory summary');
    return res.status(500).json({ success: false, error: 'Failed to retrieve inventory summary' });
  }
};

/**
 * GET /api/dashboard/work-order-status
 */
export const getWorkOrderStatus = async (req, res) => {
  try {
    // Use aggregation query instead of fetching all rows
    const result = await safeQuery(`
      SELECT status, COUNT(*) as count
      FROM work_order
      GROUP BY status
    `, [], []);

    // Build status map from rows
    const statusMap = {};
    for (const row of result) {
      statusMap[row.status] = parseInt(row.count || 0);
    }

    // Total count fallback
    const totalCount = Object.values(statusMap).reduce((a, b) => a + b, 0);

    const statusCounts = {
      pending: statusMap['PENDING'] || statusMap['DRAFT'] || 0,
      in_progress: statusMap['IN_PROGRESS'] || statusMap['IN_PRODUCTION'] || statusMap['ACTIVE'] || 0,
      completed: statusMap['COMPLETED'] || 0,
      cancelled: statusMap['CANCELLED'] || 0,
      total: totalCount,
      all: statusMap
    };

    return res.status(200).json({ success: true, data: statusCounts });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to get work order status');
    return res.status(500).json({ success: false, error: 'Failed to retrieve work order status' });
  }
};

/**
 * GET /api/dashboard/recent-activities
 * Returns recent GRNs, dispatches, and work orders as activity feed
 */
export const getRecentActivities = async (req, res) => {
  try {
    const activities = [];

    // Recent dispatches
    try {
      const dispatches = await db.query(`
        SELECT dispatch_no, status, created_by, dispatch_date as created_at
        FROM dispatch_order
        ORDER BY dispatch_date DESC NULLS LAST
        LIMIT 3
      `);
      for (const d of dispatches.rows) {
        activities.push({
          id: d.dispatch_no,
          type: 'dispatch',
          description: `Dispatch ${d.dispatch_no} — ${d.status}`,
          timestamp: d.created_at,
          user: d.created_by || 'System',
          status: d.status?.toLowerCase() || 'completed'
        });
      }
    } catch { /* non-fatal */ }

    // Recent work orders
    try {
      const wos = await db.query(`
        SELECT wo_no, status, created_at
        FROM work_order
        ORDER BY created_at DESC NULLS LAST
        LIMIT 3
      `);
      for (const w of wos.rows) {
        activities.push({
          id: w.wo_no,
          type: 'work_order',
          description: `Work Order ${w.wo_no} — ${w.status}`,
          timestamp: w.created_at,
          user: 'Production',
          status: w.status?.toLowerCase() === 'completed' ? 'completed' : 'in_progress'
        });
      }
    } catch { /* non-fatal */ }

    // Recent GRNs
    try {
      const grns = await db.query(`
        SELECT grn_no, received_by, created_at
        FROM goods_receipt
        ORDER BY created_at DESC NULLS LAST
        LIMIT 2
      `);
      for (const g of grns.rows) {
        activities.push({
          id: g.grn_no,
          type: 'goods_receipt',
          description: `GRN ${g.grn_no} received`,
          timestamp: g.created_at,
          user: g.received_by || 'Warehouse',
          status: 'completed'
        });
      }
    } catch { /* non-fatal */ }

    // Sort all activities by timestamp desc
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Fallback mock data if no real activities
    if (activities.length === 0) {
      activities.push(
        { id: '1', type: 'system', description: 'ERP system is running normally', timestamp: new Date().toISOString(), user: 'System', status: 'completed' }
      );
    }

    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get recent activities');
    return res.status(500).json({ success: false, error: 'Failed to retrieve recent activities' });
  }
};
