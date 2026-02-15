// src/controllers/reporting.controller.js
import reportingService from '../services/reporting.service.js';
import { logger } from '../utils/logger.js';

/**
 * Reporting Controller
 * Handles comprehensive business reports and analytics
 */

/**
 * GET /api/reports/inventory-valuation
 * Generate inventory valuation report
 */
export const getInventoryValuationReport = async (req, res) => {
  try {
    const { as_of_date, location_id, category } = req.query;
    
    const report = await reportingService.getInventoryValuationReport({
      as_of_date,
      location_id,
      category
    });

    logger.info({ 
      as_of_date, 
      location_id, 
      category,
      total_items: report.summary.total_items,
      total_value: report.summary.total_value
    }, 'Inventory valuation report generated');

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error({ error: error.message, query: req.query }, 'Failed to generate inventory valuation report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate inventory valuation report'
    });
  }
};

/**
 * GET /api/reports/stock-movement
 * Generate stock movement report
 */
export const getStockMovementReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      item_type, 
      movement_type, 
      location_id 
    } = req.query;
    
    const report = await reportingService.getStockMovementReport({
      start_date,
      end_date,
      item_type,
      movement_type,
      location_id
    });

    logger.info({ 
      start_date, 
      end_date,
      total_transactions: report.summary.total_transactions
    }, 'Stock movement report generated');

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error({ error: error.message, query: req.query }, 'Failed to generate stock movement report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate stock movement report'
    });
  }
};

/**
 * GET /api/reports/purchase-order-status
 * Generate purchase order status report
 */
export const getPurchaseOrderStatusReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      supplier_id, 
      status,
      include_items 
    } = req.query;
    
    const report = await reportingService.getPurchaseOrderStatusReport({
      start_date,
      end_date,
      supplier_id,
      status,
      include_items: include_items === 'true'
    });

    logger.info({ 
      start_date, 
      end_date,
      total_orders: report.summary.total_orders,
      total_value: report.summary.total_ordered_value
    }, 'Purchase order status report generated');

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error({ error: error.message, query: req.query }, 'Failed to generate purchase order status report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate purchase order status report'
    });
  }
};

/**
 * GET /api/reports/work-order-performance
 * Generate work order performance report
 */
export const getWorkOrderPerformanceReport = async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      product_id,
      status,
      include_materials 
    } = req.query;
    
    const report = await reportingService.getWorkOrderPerformanceReport({
      start_date,
      end_date,
      product_id,
      status,
      include_materials: include_materials === 'true'
    });

    logger.info({ 
      start_date, 
      end_date,
      total_work_orders: report.summary.total_work_orders
    }, 'Work order performance report generated');

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error({ error: error.message, query: req.query }, 'Failed to generate work order performance report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate work order performance report'
    });
  }
};

/**
 * GET /api/reports/dashboard-analytics
 * Generate comprehensive dashboard analytics
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const analytics = await reportingService.getDashboardAnalytics();

    logger.info('Dashboard analytics generated');

    return res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate dashboard analytics');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard analytics'
    });
  }
};

/**
 * GET /api/reports/available-reports
 * Get list of available reports
 */
export const getAvailableReports = async (req, res) => {
  try {
    const availableReports = [
      {
        id: 'inventory-valuation',
        name: 'Inventory Valuation Report',
        description: 'Comprehensive inventory valuation with category and status breakdown',
        endpoint: '/api/reports/inventory-valuation',
        parameters: [
          { name: 'as_of_date', type: 'date', description: 'Valuation as of date' },
          { name: 'location_id', type: 'string', description: 'Filter by location' },
          { name: 'category', type: 'string', description: 'Filter by category' }
        ]
      },
      {
        id: 'stock-movement',
        name: 'Stock Movement Report',
        description: 'Detailed stock movement transactions with in/out analysis',
        endpoint: '/api/reports/stock-movement',
        parameters: [
          { name: 'start_date', type: 'date', description: 'Report start date' },
          { name: 'end_date', type: 'date', description: 'Report end date' },
          { name: 'item_type', type: 'string', description: 'Filter by item type (material/product/all)' },
          { name: 'movement_type', type: 'string', description: 'Filter by movement type (IN/OUT/all)' },
          { name: 'location_id', type: 'string', description: 'Filter by location' }
        ]
      },
      {
        id: 'purchase-order-status',
        name: 'Purchase Order Status Report',
        description: 'Purchase order status tracking with receipt and invoice analysis',
        endpoint: '/api/reports/purchase-order-status',
        parameters: [
          { name: 'start_date', type: 'date', description: 'Report start date' },
          { name: 'end_date', type: 'date', description: 'Report end date' },
          { name: 'supplier_id', type: 'string', description: 'Filter by supplier' },
          { name: 'status', type: 'string', description: 'Filter by PO status' },
          { name: 'include_items', type: 'boolean', description: 'Include detailed items' }
        ]
      },
      {
        id: 'work-order-performance',
        name: 'Work Order Performance Report',
        description: 'Work order performance analysis with step completion and material efficiency',
        endpoint: '/api/reports/work-order-performance',
        parameters: [
          { name: 'start_date', type: 'date', description: 'Report start date' },
          { name: 'end_date', type: 'date', description: 'Report end date' },
          { name: 'product_id', type: 'string', description: 'Filter by product' },
          { name: 'status', type: 'string', description: 'Filter by WO status' },
          { name: 'include_materials', type: 'boolean', description: 'Include material details' }
        ]
      },
      {
        id: 'dashboard-analytics',
        name: 'Dashboard Analytics',
        description: 'Comprehensive dashboard analytics for real-time insights',
        endpoint: '/api/reports/dashboard-analytics',
        parameters: []
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        available_reports: availableReports,
        total_reports: availableReports.length,
        generated_at: new Date()
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get available reports');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve available reports'
    });
  }
};
