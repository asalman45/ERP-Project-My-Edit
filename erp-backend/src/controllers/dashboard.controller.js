// src/controllers/dashboard.controller.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Dashboard Controller
 * Handles dashboard statistics and analytics
 */

/**
 * GET /api/dashboard/stats
 * Get comprehensive dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      productsResult,
      materialsResult,
      workOrdersResult,
      // Financial Results
      revenueResult,
      expenseResult,
      arResult,
      apResult
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM product'),
      db.query('SELECT COUNT(*) as count FROM material'),
      db.query('SELECT COUNT(*) as count FROM work_order'),
      // Revenue (FinancialAccount type REVENUE)
      db.query("SELECT SUM(credit - debit) as total FROM journal_line jl JOIN financial_account fa ON jl.account_id = fa.account_id WHERE fa.type = 'REVENUE'"),
      // Expense (FinancialAccount type EXPENSE)
      db.query("SELECT SUM(debit - credit) as total FROM journal_line jl JOIN financial_account fa ON jl.account_id = fa.account_id WHERE fa.type = 'EXPENSE'"),
      // Accounts Receivable (Customer Invoices pending)
      db.query("SELECT SUM(total_amount) as total FROM customer_invoice WHERE payment_status IN ('PENDING', 'PARTIAL')"),
      // Accounts Payable (Vendor Invoices unpaid)
      db.query("SELECT SUM(total_amount) as total FROM invoice WHERE status != 'PAID'")
    ]);

    const stats = {
      totalProducts: parseInt(productsResult.rows[0].count),
      totalMaterials: parseInt(materialsResult.rows[0].count),
      totalWorkOrders: parseInt(workOrdersResult.rows[0].count),
      financials: {
        totalRevenue: parseFloat(revenueResult.rows[0].total || 0),
        totalExpense: parseFloat(expenseResult.rows[0].total || 0),
        accountsReceivable: parseFloat(arResult.rows[0].total || 0),
        accountsPayable: parseFloat(apResult.rows[0].total || 0),
        netProfit: parseFloat(revenueResult.rows[0].total || 0) - parseFloat(expenseResult.rows[0].total || 0)
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
 * Get inventory summary with value calculations
 */
export const getInventorySummary = async (req, res) => {
  try {
    // Get inventory items with product details using raw SQL
    const inventoryResult = await db.query(`
      SELECT 
        i.quantity,
        p.product_code,
        p.part_name,
        p.standard_cost,
        m.name as material_name,
        m.material_code,
        m.min_stock,
        m.max_stock
      FROM inventory i
      LEFT JOIN product p ON i.product_id = p.product_id
      LEFT JOIN material m ON i.material_id = m.material_id
      WHERE i.quantity > 0
    `);

    const inventoryItems = inventoryResult.rows;

    // Calculate total value
    const totalValue = inventoryItems.reduce((sum, item) => {
      const cost = item.standard_cost || 0;
      return sum + (item.quantity * cost);
    }, 0);

    // Get top products by quantity
    const topProducts = inventoryItems
      .filter(item => item.product_code || item.material_code)
      .map(item => ({
        item_code: item.product_code || item.material_code,
        item_name: item.part_name || item.material_name,
        quantity: item.quantity,
        standard_cost: item.standard_cost,
        min_stock: item.min_stock,
        max_stock: item.max_stock
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const summary = {
      totalValue,
      totalItems: inventoryItems.length,
      lowStockCount: 0, // Placeholder
      zeroStockCount: 0, // Placeholder
      topProducts
    };

    logger.info({ summary }, 'Inventory summary retrieved');

    return res.status(200).json({
      success: true,
      data: summary
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get inventory summary');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve inventory summary'
    });
  }
};

/**
 * GET /api/dashboard/work-order-status
 * Get work order status breakdown
 */
export const getWorkOrderStatus = async (req, res) => {
  try {
    const workOrdersResult = await db.query('SELECT status FROM work_order');
    const workOrders = workOrdersResult.rows;

    const statusCounts = {
      pending: workOrders.filter(wo => wo.status === 'PENDING').length,
      in_progress: workOrders.filter(wo => wo.status === 'IN_PROGRESS').length,
      completed: workOrders.filter(wo => wo.status === 'COMPLETED').length,
      cancelled: workOrders.filter(wo => wo.status === 'CANCELLED').length
    };

    logger.info({ statusCounts }, 'Work order status retrieved');

    return res.status(200).json({
      success: true,
      data: statusCounts
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get work order status');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve work order status'
    });
  }
};

/**
 * GET /api/dashboard/recent-activities
 * Get recent system activities (placeholder for now)
 */
export const getRecentActivities = async (req, res) => {
  try {
    // This would typically come from an audit log or activity log table
    // For now, we'll return mock data
    const activities = [
      {
        id: '1',
        type: 'stock_in',
        description: 'Stock received for Product ABC-123',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: 'John Doe',
        status: 'completed'
      },
      {
        id: '2',
        type: 'work_order',
        description: 'Work Order WO-2024-001 started',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        user: 'Jane Smith',
        status: 'in_progress'
      },
      {
        id: '3',
        type: 'stock_out',
        description: 'Material XYZ-456 issued for production',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        user: 'Mike Johnson',
        status: 'completed'
      },
      {
        id: '4',
        type: 'purchase_order',
        description: 'Purchase Order PO-2024-005 created',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        user: 'Sarah Wilson',
        status: 'pending'
      }
    ];

    return res.status(200).json({
      success: true,
      data: activities
    });

  } catch (error) {
    logger.error({
      error: error.message,
      stack: error.stack
    }, 'Failed to get recent activities');

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent activities'
    });
  }
};
