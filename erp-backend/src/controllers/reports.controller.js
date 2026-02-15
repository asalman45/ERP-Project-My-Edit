// src/controllers/reports.controller.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import ExcelJS from 'exceljs';
// import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

/**
 * Reports Controller
 * Handles generation of various business reports in PDF and Excel formats
 */

/**
 * Generate Production Report
 */
export const generateProductionReport = async (req, res) => {
  try {
    const { format = 'pdf', start_date, end_date, product_id, status } = req.query;
    
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
        (wo.quantity * p.standard_cost) as estimated_cost
      FROM work_order wo
      LEFT JOIN product p ON wo.product_id = p.product_id
      ${whereClause}
      ORDER BY wo.created_at DESC
    `;

    const productionResult = await db.query(productionQuery, queryParams);
    const productionData = productionResult.rows;

    // Get production summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
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

    if (format === 'excel') {
      return await generateExcelReport(res, reportData, 'production');
    } else {
      return await generatePDFReport(res, reportData, 'production');
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate production report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate production report'
    });
  }
};

/**
 * Generate Scrap Management Report
 */
export const generateScrapReport = async (req, res) => {
  try {
    const { format = 'pdf', start_date, end_date, material_id, location_id, status } = req.query;
    
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

    // Get scrap data
    const scrapQuery = `
      SELECT 
        s.scrap_id,
        s.material_id,
        m.material_code,
        m.name as material_name,
        s.width_mm,
        s.length_mm,
        s.thickness_mm,
        s.weight_kg,
        s.status,
        s.reference,
        s.created_at,
        l.name as location_name,
        s.consumed_by_po
      FROM scrap s
      LEFT JOIN material m ON s.material_id = m.material_id
      LEFT JOIN location l ON s.location_id = l.location_id
      ${whereClause}
      ORDER BY s.created_at DESC
    `;

    const scrapResult = await db.query(scrapQuery, queryParams);
    const scrapData = scrapResult.rows;

    // Get scrap summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_scrap_items,
        COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_items,
        COUNT(CASE WHEN status = 'CONSUMED' THEN 1 END) as consumed_items,
        SUM(weight_kg) as total_weight_kg,
        AVG(weight_kg) as avg_weight_kg
      FROM scrap s
      ${whereClause}
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

    if (format === 'excel') {
      return await generateExcelReport(res, reportData, 'scrap');
    } else {
      return await generatePDFReport(res, reportData, 'scrap');
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate scrap report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate scrap report'
    });
  }
};

/**
 * Generate Inventory Report
 */
export const generateInventoryReport = async (req, res) => {
  try {
    const { format = 'pdf', product_id, material_id, location_id, low_stock_only } = req.query;
    
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
        i.available_quantity,
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

    if (format === 'excel') {
      return await generateExcelReport(res, reportData, 'inventory');
    } else {
      return await generatePDFReport(res, reportData, 'inventory');
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate inventory report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate inventory report'
    });
  }
};

/**
 * Generate Cost Analysis Report
 */
export const generateCostAnalysisReport = async (req, res) => {
  try {
    const { format = 'pdf', start_date, end_date, product_id, material_id } = req.query;
    
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

    // Get cost analysis data
    const costQuery = `
      SELECT 
        it.txn_id,
        it.txn_type,
        it.quantity,
        it.created_at,
        p.product_code,
        p.part_name,
        p.standard_cost,
        m.material_code,
        m.name as material_name,
        l.name as location_name,
        u.code as uom_code,
        (it.quantity * COALESCE(p.standard_cost, 0)) as transaction_value
      FROM inventory_transaction it
      LEFT JOIN product p ON it.product_id = p.product_id
      LEFT JOIN material m ON it.material_id = m.material_id
      LEFT JOIN location l ON it.location_id = l.location_id
      LEFT JOIN uom u ON COALESCE(p.uom_id, m.uom_id) = u.uom_id
      ${whereClause}
      ORDER BY it.created_at DESC
    `;

    const costResult = await db.query(costQuery, queryParams);
    const costData = costResult.rows;

    // Get cost summary by transaction type
    const summaryQuery = `
      SELECT 
        it.txn_type,
        COUNT(*) as transaction_count,
        SUM(it.quantity) as total_quantity,
        SUM(it.quantity * COALESCE(p.standard_cost, 0)) as total_value,
        AVG(COALESCE(p.standard_cost, 0)) as avg_cost
      FROM inventory_transaction it
      LEFT JOIN product p ON it.product_id = p.product_id
      LEFT JOIN material m ON it.material_id = m.material_id
      ${whereClause}
      GROUP BY it.txn_type
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

    if (format === 'excel') {
      return await generateExcelReport(res, reportData, 'cost_analysis');
    } else {
      return await generatePDFReport(res, reportData, 'cost_analysis');
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate cost analysis report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate cost analysis report'
    });
  }
};

/**
 * Generate Excel Report
 */
async function generateExcelReport(res, reportData, reportType) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportData.title);

    // Add header
    worksheet.addRow([reportData.title]);
    worksheet.addRow(['Generated at:', reportData.generated_at]);
    
    if (reportData.period) {
      worksheet.addRow(['Period:', `${reportData.period.start_date} to ${reportData.period.end_date}`]);
    }
    
    if (reportData.filters) {
      worksheet.addRow(['Filters:']);
      Object.entries(reportData.filters).forEach(([key, value]) => {
        worksheet.addRow([`${key}:`, value]);
      });
    }

    worksheet.addRow([]); // Empty row

    // Add summary section
    if (reportData.summary) {
      worksheet.addRow(['SUMMARY']);
      if (Array.isArray(reportData.summary)) {
        // For cost analysis with array of summaries
        worksheet.addRow(['Transaction Type', 'Count', 'Total Quantity', 'Total Value', 'Avg Cost']);
        reportData.summary.forEach(item => {
          worksheet.addRow([
            item.txn_type,
            item.transaction_count,
            item.total_quantity,
            item.total_value,
            item.avg_cost
          ]);
        });
      } else {
        // For single summary object
        Object.entries(reportData.summary).forEach(([key, value]) => {
          worksheet.addRow([key, value]);
        });
      }
      worksheet.addRow([]); // Empty row
    }

    // Add data section
    if (reportData.data && reportData.data.length > 0) {
      worksheet.addRow(['DATA']);
      const headers = Object.keys(reportData.data[0]);
      worksheet.addRow(headers);
      
      reportData.data.forEach(row => {
        const values = headers.map(header => row[header]);
        worksheet.addRow(values);
      });
    }

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(1).alignment = { horizontal: 'center' };
    
    // Set column widths
    worksheet.columns.forEach((column, index) => {
      column.width = 15;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate Excel report');
    throw error;
  }
}

/**
 * Generate PDF Report (Simplified version without puppeteer)
 */
async function generatePDFReport(res, reportData, reportType) {
  try {
    // For now, return JSON data instead of PDF
    // In production, you would use a PDF generation library
    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json({
      success: true,
      message: 'Report generated successfully',
      data: reportData,
      note: 'PDF generation requires additional setup. This is a JSON export.'
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Failed to generate PDF report');
    throw error;
  }
}

/**
 * Generate HTML content for PDF
 */
function generateHTMLReport(reportData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportData.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #333; }
        .meta { font-size: 12px; color: #666; margin-top: 10px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 2px solid #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary-table { margin-bottom: 20px; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${reportData.title}</div>
        <div class="meta">Generated on: ${new Date(reportData.generated_at).toLocaleString()}</div>
        ${reportData.period ? `<div class="meta">Period: ${reportData.period.start_date} to ${reportData.period.end_date}</div>` : ''}
      </div>

      ${reportData.filters ? `
        <div class="section">
          <div class="section-title">Filters</div>
          <table class="summary-table">
            ${Object.entries(reportData.filters).map(([key, value]) => `
              <tr><td><strong>${key.replace(/_/g, ' ').toUpperCase()}</strong></td><td>${value}</td></tr>
            `).join('')}
          </table>
        </div>
      ` : ''}

      ${reportData.summary ? `
        <div class="section">
          <div class="section-title">Summary</div>
          <table class="summary-table">
            ${Array.isArray(reportData.summary) ? 
              `<tr><th>Transaction Type</th><th>Count</th><th>Total Quantity</th><th>Total Value</th><th>Avg Cost</th></tr>
               ${reportData.summary.map(item => `
                 <tr>
                   <td>${item.txn_type}</td>
                   <td>${item.transaction_count}</td>
                   <td>${item.total_quantity}</td>
                   <td>${item.total_value ? '$' + item.total_value.toFixed(2) : 'N/A'}</td>
                   <td>${item.avg_cost ? '$' + item.avg_cost.toFixed(2) : 'N/A'}</td>
                 </tr>
               `).join('')}` :
              Object.entries(reportData.summary).map(([key, value]) => `
                <tr><td><strong>${key.replace(/_/g, ' ').toUpperCase()}</strong></td><td>${value}</td></tr>
              `).join('')
            }
          </table>
        </div>
      ` : ''}

      ${reportData.data && reportData.data.length > 0 ? `
        <div class="section">
          <div class="section-title">Data Details</div>
          <table>
            <thead>
              <tr>
                ${Object.keys(reportData.data[0]).map(key => `<th>${key.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${reportData.data.map(row => `
                <tr>
                  ${Object.values(row).map(value => `<td>${value || 'N/A'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generated by EmpclERP System</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}