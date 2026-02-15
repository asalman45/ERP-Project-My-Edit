// src/controllers/monthlyInventorySalesReport.controller.js
import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { generatePDFFromMonthlyReport } from '../utils/pdf-generator.js';
import { generateExcelFromMonthlyReport } from '../utils/excel-generator.js';

/**
 * Monthly Inventory & Sales Report Controller
 * Handles generation of comprehensive monthly inventory and sales reports
 */

/**
 * Generate Monthly Inventory & Sales Report
 */
export const generateMonthlyInventorySalesReport = async (req, res) => {
  try {
    const { 
      month, 
      year, 
      model_id, 
      location_id, 
      format = 'json',
      opening_stock_data // Manual opening stock data
    } = req.body;

    logger.info({ month, year, model_id, location_id, format }, 'Generating monthly inventory sales report');

    // Validate required parameters
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Month and year are required parameters'
      });
    }

    // Calculate date range for the month
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const startDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-01`;
    const endDate = new Date(yearNum, monthNum, 0).toISOString().split('T')[0]; // Last day of month

    // Build where clause for filtering
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (model_id) {
      whereClause += ` AND p.model_id = $${paramIndex}`;
      queryParams.push(model_id);
      paramIndex++;
    }

    // Get all products with their details
    const productsQuery = `
      SELECT 
        p.product_id,
        p.product_code,
        p.part_name,
        p.standard_cost,
        m.model_name,
        o.oem_name,
        u.code as uom_code,
        u.name as uom_name
      FROM product p
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN oem o ON p.oem_id = o.oem_id
      LEFT JOIN uom u ON p.uom_id = u.uom_id
      ${whereClause}
      ORDER BY p.product_code
    `;

    const productsResult = await db.query(productsQuery, queryParams);
    const products = productsResult.rows;

    // If no products found, return empty report
    if (products.length === 0) {
      logger.info('No products found for the given criteria');
      return res.json({
        success: true,
        data: {
          title: `${monthNum.toString().padStart(2, '0')} ${yearNum}`,
          company_name: 'Ghandhara Industries Ltd.',
          month: monthNum,
          year: yearNum,
          start_date: startDate,
          end_date: endDate,
          generated_at: new Date().toISOString(),
          sale_dates: [],
          products: []
        },
        message: 'No products found for the given criteria'
      });
    }

    // Get production data for the month (using RECEIVE transactions from work orders)
    const productionQuery = `
      SELECT 
        it.product_id,
        SUM(it.quantity) as produced_quantity
      FROM inventory_txn it
      WHERE it.txn_type = 'RECEIVE'
        AND it.wo_id IS NOT NULL
        AND it.created_at >= $1
        AND it.created_at <= $2
        AND it.product_id IS NOT NULL
      GROUP BY it.product_id
    `;

    const productionResult = await db.query(productionQuery, [startDate, endDate]);
    const productionData = {};
    productionResult.rows.forEach(row => {
      productionData[row.product_id] = row.produced_quantity;
    });

    // Get sales data grouped by date for the month (using ISSUE transactions)
    const salesQuery = `
      SELECT 
        it.product_id,
        DATE(it.created_at) as sale_date,
        SUM(it.quantity) as daily_sales
      FROM inventory_txn it
      WHERE it.txn_type = 'ISSUE'
        AND it.created_at >= $1
        AND it.created_at <= $2
        AND it.product_id IS NOT NULL
      GROUP BY it.product_id, DATE(it.created_at)
      ORDER BY it.product_id, sale_date
    `;

    const salesResult = await db.query(salesQuery, [startDate, endDate]);
    const salesData = {};
    salesResult.rows.forEach(row => {
      if (!salesData[row.product_id]) {
        salesData[row.product_id] = {};
      }
      salesData[row.product_id][row.sale_date] = row.daily_sales;
    });

    // Get all unique sale dates for the month
    const uniqueSaleDates = [...new Set(salesResult.rows.map(row => row.sale_date))].sort();

    // Build report data
    const reportData = {
      title: `${monthNum.toString().padStart(2, '0')} ${yearNum}`,
      company_name: 'Ghandhara Industries Ltd.',
      month: monthNum,
      year: yearNum,
      start_date: startDate,
      end_date: endDate,
      generated_at: new Date().toISOString(),
      sale_dates: uniqueSaleDates,
      products: products.map(product => {
        const productId = product.product_id;
        const openingStock = opening_stock_data && opening_stock_data[productId] 
          ? opening_stock_data[productId] 
          : 0;
        const producedQuantity = productionData[productId] || 0;
        const totalInventory = openingStock + producedQuantity;
        
        // Calculate daily sales
        const dailySales = {};
        let totalSales = 0;
        uniqueSaleDates.forEach(date => {
          const sales = salesData[productId] && salesData[productId][date] ? salesData[productId][date] : 0;
          dailySales[date] = sales;
          totalSales += sales;
        });

        const closingStock = totalInventory - totalSales;

        return {
          product_id: productId,
          model_name: product.model_name,
          product_code: product.product_code,
          part_name: product.part_name,
          opening_stock: openingStock,
          produced_quantity: producedQuantity,
          total_inventory: totalInventory,
          daily_sales: dailySales,
          total_sales: totalSales,
          closing_stock: closingStock,
          uom_code: product.uom_code
        };
      })
    };

    logger.info({ 
      total_products: reportData.products.length,
      sale_dates: reportData.sale_dates.length 
    }, 'Monthly inventory sales report data prepared');

    // Return data in requested format
    if (format === 'pdf') {
      try {
        const pdfBuffer = await generatePDFFromMonthlyReport(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="monthly_inventory_sales_report_${month}_${year}.pdf"`);
        return res.send(pdfBuffer);
      } catch (pdfError) {
        logger.error({ error: pdfError.message }, 'PDF generation failed, returning JSON instead');
        return res.json({
          success: true,
          data: reportData,
          message: 'Monthly inventory sales report generated successfully (PDF generation failed, returned as JSON)'
        });
      }
    } else if (format === 'excel') {
      try {
        const excelBuffer = await generateExcelFromMonthlyReport(reportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="monthly_inventory_sales_report_${month}_${year}.xlsx"`);
        return res.send(excelBuffer);
      } catch (excelError) {
        logger.error({ error: excelError.message }, 'Excel generation failed, returning JSON instead');
        return res.json({
          success: true,
          data: reportData,
          message: 'Monthly inventory sales report generated successfully (Excel generation failed, returned as JSON)'
        });
      }
    } else {
      return res.json({
        success: true,
        data: reportData,
        message: 'Monthly inventory sales report generated successfully'
      });
    }

  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to generate monthly inventory sales report');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate monthly inventory sales report',
      details: error.message
    });
  }
};

/**
 * Get available models for filtering
 */
export const getAvailableModels = async (req, res) => {
  try {
    const modelsQuery = `
      SELECT 
        m.model_id,
        m.model_name,
        m.model_year,
        o.oem_name
      FROM model m
      LEFT JOIN oem o ON m.oem_id = o.oem_id
      ORDER BY o.oem_name, m.model_name
    `;

    const result = await db.query(modelsQuery);
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get available models');
    return res.status(500).json({
      success: false,
      error: 'Failed to get available models'
    });
  }
};

/**
 * Get products for a specific model
 */
export const getProductsByModel = async (req, res) => {
  try {
    const { model_id } = req.params;
    
    const productsQuery = `
      SELECT 
        p.product_id,
        p.product_code,
        p.part_name,
        p.standard_cost,
        m.model_name,
        o.oem_name,
        u.code as uom_code
      FROM product p
      LEFT JOIN model m ON p.model_id = m.model_id
      LEFT JOIN oem o ON p.oem_id = o.oem_id
      LEFT JOIN uom u ON p.uom_id = u.uom_id
      WHERE p.model_id = $1
      ORDER BY p.product_code
    `;

    const result = await db.query(productsQuery, [model_id]);
    
    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get products by model');
    return res.status(500).json({
      success: false,
      error: 'Failed to get products by model'
    });
  }
};
