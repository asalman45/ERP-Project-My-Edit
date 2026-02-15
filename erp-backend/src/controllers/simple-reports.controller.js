// src/controllers/simple-reports.controller.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { generateExcelFromReport } from '../utils/excel-generator.js';
import { generatePDFFromReport } from '../utils/pdf-generator.js';

/**
 * Simple Reports Controller
 * Handles generation of various business reports in JSON format
 */

/**
 * Generate Production Report
 */
export const generateProductionReport = async (req, res) => {
  try {
    const { format = 'json', start_date, end_date, product_id, status } = req.query;
    
    logger.info({ query: req.query }, 'Generating production report');
    
    // Build query based on parameters
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (start_date) {
      whereClause += ` AND wo.created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      whereClause += ` AND wo.created_at <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    if (product_id) {
      whereClause += ` AND wo.product_id = $${paramIndex}`;
      queryParams.push(product_id);
      paramIndex++;
    }
    if (status) {
      whereClause += ` AND wo.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Get production data
    const productionQuery = `
      SELECT 
        wo.wo_id,
        wo.wo_no,
        wo.quantity,
        wo.status,
        wo.priority,
        wo.scheduled_start,
        wo.scheduled_end,
        wo.created_at,
        p.product_code,
        p.part_name,
        p.standard_cost,
        (wo.quantity * COALESCE(p.standard_cost, 0)) as estimated_cost
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      ${whereClause}
      ORDER BY wo.created_at DESC
      LIMIT 100
    `;

    logger.info({ query: productionQuery, params: queryParams }, 'Executing production query');

    const productionResult = await db.query(productionQuery, queryParams);
    const productionData = productionResult.rows;

    // Get production summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'PLANNED' THEN 1 END) as planned_orders,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        SUM(quantity) as total_quantity,
        SUM(quantity * COALESCE(p.standard_cost, 0)) as total_estimated_cost
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      ${whereClause}
    `;

    const summaryResult = await db.query(summaryQuery, queryParams);
    const summary = summaryResult.rows[0];

    const reportData = {
      title: 'Production Report',
      generated_at: new Date().toISOString(),
      period: {
        start_date: start_date || 'All Time',
        end_date: end_date || 'Present'
      },
      summary,
      data: productionData
    };

    logger.info({ reportData }, 'Production report generated successfully');

    // Set appropriate headers based on format
    if (format === 'excel') {
      const excelBuffer = await generateExcelFromReport(reportData, 'production');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="production_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(excelBuffer);
    } else if (format === 'pdf') {
      const pdfBuffer = await generatePDFFromReport(reportData, 'production');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="production_report_${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(Buffer.from(pdfBuffer));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="production_report_${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        success: true,
        data: reportData,
        format,
        message: `Production report generated successfully in ${format.toUpperCase()} format`
      });
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate production report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate production report',
      details: error.message
    });
  }
};

/**
 * Generate Scrap Management Report
 */
export const generateScrapReport = async (req, res) => {
  try {
    const { format = 'json', start_date, end_date, material_id, location_id, status } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (start_date) {
      whereClause += ` AND s.created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      whereClause += ` AND s.created_at <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    if (material_id) {
      whereClause += ` AND s.material_id = $${paramIndex}`;
      queryParams.push(material_id);
      paramIndex++;
    }
    if (location_id) {
      whereClause += ` AND s.location_id = $${paramIndex}`;
      queryParams.push(location_id);
      paramIndex++;
    }
    if (status) {
      whereClause += ` AND s.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Get scrap data (using inventory data as scrap tracking for now)
    const scrapQuery = `
      SELECT 
        i.inventory_id as scrap_id,
        i.material_id,
        m.material_code,
        m.name as material_name,
        i.quantity as weight_kg,
        'AVAILABLE' as status,
        i.batch_no as reference,
        i.created_at,
        l.name as location_name,
        null as consumed_by_po
      FROM inventory i
      LEFT JOIN material m ON i.material_id = m.material_id
      LEFT JOIN location l ON i.location_id = l.location_id
      WHERE i.quantity < 10
      ORDER BY i.created_at DESC
      LIMIT 100
    `;

    const scrapResult = await db.query(scrapQuery, queryParams);
    const scrapData = scrapResult.rows;

    // Get scrap summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_scrap_items,
        COUNT(*) as available_items,
        0 as consumed_items,
        SUM(i.quantity) as total_weight_kg,
        AVG(i.quantity) as avg_weight_kg
      FROM inventory i
      WHERE i.quantity < 10
    `;

    const summaryResult = await db.query(summaryQuery, queryParams);
    const summary = summaryResult.rows[0];

    const reportData = {
      title: 'Scrap Management Report',
      generated_at: new Date().toISOString(),
      period: {
        start_date: start_date || 'All Time',
        end_date: end_date || 'Present'
      },
      summary,
      data: scrapData
    };

    // Set appropriate headers based on format
    if (format === 'excel') {
      const excelBuffer = await generateExcelFromReport(reportData, 'scrap');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="scrap_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(excelBuffer);
    } else if (format === 'pdf') {
      const pdfBuffer = await generatePDFFromReport(reportData, 'scrap');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="scrap_report_${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(Buffer.from(pdfBuffer));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="scrap_report_${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        success: true,
        data: reportData,
        format,
        message: `Scrap report generated successfully in ${format.toUpperCase()} format`
      });
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate scrap report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate scrap report',
      details: error.message
    });
  }
};

/**
 * Generate Inventory Report
 */
export const generateInventoryReport = async (req, res) => {
  try {
    const { format = 'json', product_id, material_id, location_id, low_stock_only } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (product_id) {
      whereClause += ` AND i.product_id = $${paramIndex}`;
      queryParams.push(product_id);
      paramIndex++;
    }
    if (material_id) {
      whereClause += ` AND i.material_id = $${paramIndex}`;
      queryParams.push(material_id);
      paramIndex++;
    }
    if (location_id) {
      whereClause += ` AND i.location_id = $${paramIndex}`;
      queryParams.push(location_id);
      paramIndex++;
    }
    if (low_stock_only === 'true') {
      whereClause += ` AND i.quantity <= COALESCE(m.min_stock, 0)`;
    }

    // Get inventory data
    const inventoryQuery = `
      SELECT 
        i.inventory_id,
        i.quantity,
        i.location_id,
        l.name as location_name,
        p.product_code,
        p.part_name,
        p.standard_cost,
        m.material_code,
        m.name as material_name,
        m.min_stock,
        m.max_stock,
        u.code as uom_code,
        u.name as uom_name,
        (i.quantity * COALESCE(p.standard_cost, 0)) as inventory_value
      FROM inventory i
      LEFT JOIN product p ON i.product_id = p.product_id
      LEFT JOIN material m ON i.material_id = m.material_id
      LEFT JOIN location l ON i.location_id = l.location_id
      LEFT JOIN uom u ON COALESCE(p.uom_id, m.uom_id) = u.uom_id
      ${whereClause}
      ORDER BY i.quantity DESC
      LIMIT 100
    `;

    const inventoryResult = await db.query(inventoryQuery, queryParams);
    const inventoryData = inventoryResult.rows;

    // Get inventory summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_items,
        SUM(quantity) as total_quantity,
        SUM(quantity * COALESCE(p.standard_cost, 0)) as total_value,
        COUNT(CASE WHEN i.quantity <= COALESCE(m.min_stock, 0) THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as zero_stock_items
      FROM inventory i
      LEFT JOIN product p ON i.product_id = p.product_id
      LEFT JOIN material m ON i.material_id = m.material_id
      ${whereClause}
    `;

    const summaryResult = await db.query(summaryQuery, queryParams);
    const summary = summaryResult.rows[0];

    const reportData = {
      title: 'Inventory Report',
      generated_at: new Date().toISOString(),
      filters: {
        product_id: product_id || 'All Products',
        material_id: material_id || 'All Materials',
        location_id: location_id || 'All Locations',
        low_stock_only: low_stock_only === 'true' ? 'Yes' : 'No'
      },
      summary,
      data: inventoryData
    };

    // Set appropriate headers based on format
    if (format === 'excel') {
      const excelBuffer = await generateExcelFromReport(reportData, 'inventory');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(excelBuffer);
    } else if (format === 'pdf') {
      const pdfBuffer = await generatePDFFromReport(reportData, 'inventory');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(Buffer.from(pdfBuffer));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="inventory_report_${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        success: true,
        data: reportData,
        format,
        message: `Inventory report generated successfully in ${format.toUpperCase()} format`
      });
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate inventory report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate inventory report',
      details: error.message
    });
  }
};

/**
 * Generate Cost Analysis Report
 */
export const generateCostAnalysisReport = async (req, res) => {
  try {
    const { format = 'json', start_date, end_date, product_id, material_id } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (start_date) {
      whereClause += ` AND it.created_at >= $${paramIndex}`;
      queryParams.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      whereClause += ` AND it.created_at <= $${paramIndex}`;
      queryParams.push(end_date);
      paramIndex++;
    }
    if (product_id) {
      whereClause += ` AND it.product_id = $${paramIndex}`;
      queryParams.push(product_id);
      paramIndex++;
    }
    if (material_id) {
      whereClause += ` AND it.material_id = $${paramIndex}`;
      queryParams.push(material_id);
      paramIndex++;
    }

    // Get cost analysis data (using inventory data for cost analysis)
    const costQuery = `
      SELECT 
        i.inventory_id as txn_id,
        'STOCK_IN' as txn_type,
        i.quantity,
        i.created_at,
        p.product_code,
        p.part_name,
        p.standard_cost,
        m.material_code,
        m.name as material_name,
        l.name as location_name,
        u.code as uom_code,
        (i.quantity * COALESCE(p.standard_cost, 0)) as transaction_value
      FROM inventory i
      LEFT JOIN product p ON i.product_id = p.product_id
      LEFT JOIN material m ON i.material_id = m.material_id
      LEFT JOIN location l ON i.location_id = l.location_id
      LEFT JOIN uom u ON COALESCE(p.uom_id, m.uom_id) = u.uom_id
      ORDER BY i.created_at DESC
      LIMIT 100
    `;

    const costResult = await db.query(costQuery, queryParams);
    const costData = costResult.rows;

    // Get cost summary by transaction type
    const summaryQuery = `
      SELECT 
        'STOCK_IN' as txn_type,
        COUNT(*) as transaction_count,
        SUM(i.quantity) as total_quantity,
        SUM(i.quantity * COALESCE(p.standard_cost, 0)) as total_value,
        AVG(COALESCE(p.standard_cost, 0)) as avg_cost
      FROM inventory i
      LEFT JOIN product p ON i.product_id = p.product_id
      LEFT JOIN material m ON i.material_id = m.material_id
      ORDER BY total_value DESC
    `;

    const summaryResult = await db.query(summaryQuery, queryParams);
    const summary = summaryResult.rows;

    const reportData = {
      title: 'Cost Analysis Report',
      generated_at: new Date().toISOString(),
      period: {
        start_date: start_date || 'All Time',
        end_date: end_date || 'Present'
      },
      summary,
      data: costData
    };

    // Set appropriate headers based on format
    if (format === 'excel') {
      const excelBuffer = await generateExcelFromReport(reportData, 'cost_analysis');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="cost_analysis_report_${new Date().toISOString().split('T')[0]}.xlsx"`);
      return res.send(excelBuffer);
    } else if (format === 'pdf') {
      const pdfBuffer = await generatePDFFromReport(reportData, 'cost-analysis');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cost_analysis_report_${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(Buffer.from(pdfBuffer));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="cost_analysis_report_${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        success: true,
        data: reportData,
        format,
        message: `Cost analysis report generated successfully in ${format.toUpperCase()} format`
      });
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate cost analysis report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate cost analysis report',
      details: error.message
    });
  }
};
