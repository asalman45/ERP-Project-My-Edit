// Sales Order Controller - Handles HTTP requests for sales order operations

import * as salesOrderModel from '../models/salesOrder.model.js';
import { logger } from '../utils/logger.js';

// Create a new sales order
export const createSalesOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }
    
    // Validate items
    for (const item of orderData.items) {
      if (!item.item_name || !item.quantity || !item.unit_price) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have name, quantity, and unit price'
        });
      }
    }
    
    const salesOrder = await salesOrderModel.createSalesOrder(orderData);
    
    logger.info({
      sales_order_id: salesOrder.sales_order_id,
      order_number: salesOrder.order_number,
      customer_id: salesOrder.customer_id
    }, 'Sales order created via API');
    
    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: salesOrder
    });
    
  } catch (error) {
    logger.error({ error: error.message, body: req.body }, 'Failed to create sales order');
    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
      error: error.message
    });
  }
};

// Get all sales orders with optional filters
export const getAllSalesOrders = async (req, res) => {
  try {
    const filters = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      status: req.query.status,
      customer_id: req.query.customer_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      order_by: req.query.order_by || 'created_at',
      order_direction: req.query.order_direction || 'DESC'
    };
    
    const salesOrders = await salesOrderModel.getAllSalesOrders(filters);
    
    res.json({
      success: true,
      data: salesOrders,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        count: salesOrders.length
      }
    });
    
  } catch (error) {
    logger.error({ error: error.message, query: req.query }, 'Failed to get sales orders');
    res.status(500).json({
      success: false,
      message: 'Failed to get sales orders',
      error: error.message
    });
  }
};

// Get sales order by ID
export const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await salesOrderModel.getSalesOrderById(id);
    
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }
    
    res.json({
      success: true,
      data: salesOrder
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 'Failed to get sales order by ID');
    res.status(500).json({
      success: false,
      message: 'Failed to get sales order',
      error: error.message
    });
  }
};

// Get sales order by order number
export const getSalesOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const salesOrder = await salesOrderModel.getSalesOrderByNumber(orderNumber);
    
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }
    
    res.json({
      success: true,
      data: salesOrder
    });
    
  } catch (error) {
    logger.error({ error: error.message, orderNumber: req.params.orderNumber }, 'Failed to get sales order by number');
    res.status(500).json({
      success: false,
      message: 'Failed to get sales order',
      error: error.message
    });
  }
};

// Update sales order status
export const updateSalesOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by, reason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const validStatuses = [
      'DRAFT', 'PENDING', 'APPROVED', 'IN_PRODUCTION',
      'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED',
      'COMPLETED', 'CANCELLED', 'ON_HOLD'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const salesOrder = await salesOrderModel.updateSalesOrderStatus(
      id, 
      status, 
      updated_by || 'system',
      reason
    );
    
    res.json({
      success: true,
      message: 'Sales order status updated successfully',
      data: salesOrder
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id, body: req.body }, 'Failed to update sales order status');
    res.status(500).json({
      success: false,
      message: 'Failed to update sales order status',
      error: error.message
    });
  }
};

// Get sales order statistics
export const getSalesOrderStats = async (req, res) => {
  try {
    const stats = await salesOrderModel.getSalesOrderStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get sales order statistics');
    res.status(500).json({
      success: false,
      message: 'Failed to get sales order statistics',
      error: error.message
    });
  }
};

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await salesOrderModel.getAllCustomers();
    
    res.json({
      success: true,
      data: customers
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get customers');
    res.status(500).json({
      success: false,
      message: 'Failed to get customers',
      error: error.message
    });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    const customerData = req.body;
    
    // Validate required fields
    if (!customerData.company_name) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required'
      });
    }
    
    const customer = await salesOrderModel.createCustomer(customerData);
    
    logger.info({
      customer_id: customer.customer_id,
      company_name: customer.company_name
    }, 'Customer created via API');
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
    
  } catch (error) {
    logger.error({ error: error.message, body: req.body }, 'Failed to create customer');
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// Delete sales order
export const deleteSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const salesOrder = await salesOrderModel.deleteSalesOrder(id);
    
    res.json({
      success: true,
      message: 'Sales order deleted successfully',
      data: salesOrder
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 'Failed to delete sales order');
    res.status(500).json({
      success: false,
      message: 'Failed to delete sales order',
      error: error.message
    });
  }
};

// Convert sales order to production work orders
export const convertToWorkOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { created_by = 'system' } = req.body;
    
    // Call the model function to convert sales order to work orders
    const result = await salesOrderModel.convertSalesOrderToWorkOrders(id, created_by);
    
    logger.info({
      sales_order_id: id,
      work_orders_created: result.work_orders.length,
      created_by
    }, 'Sales order converted to work orders');
    
    res.json({
      success: true,
      message: 'Sales order converted to work orders successfully',
      data: result
    });
    
  } catch (error) {
    logger.error({ error: error.message, id: req.params.id }, 'Failed to convert sales order to work orders');
    
    const statusCode = error.message.includes('not found') ? 404 
                     : error.message.includes('must be approved') ? 400 
                     : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to convert sales order to work orders',
      error: error.message
    });
  }
};

// Get unique OEMs from product table
export const getOEMsFromProducts = async (req, res) => {
  try {
    const oems = await salesOrderModel.getOEMsFromProducts();
    
    res.json({
      success: true,
      data: oems,
      count: oems.length
    });
    
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get OEMs from products');
    res.status(500).json({
      success: false,
      message: 'Failed to get OEMs from products',
      error: error.message
    });
  }
};

// Get product codes by OEM ID
export const getProductCodesByOEM = async (req, res) => {
  try {
    const { oemId } = req.params;
    
    if (!oemId) {
      return res.status(400).json({
        success: false,
        message: 'OEM ID is required'
      });
    }
    
    const products = await salesOrderModel.getProductCodesByOEM(oemId);
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
    
  } catch (error) {
    logger.error({ error: error.message, oemId: req.params.oemId }, 'Failed to get product codes by OEM');
    res.status(500).json({
      success: false,
      message: 'Failed to get product codes by OEM',
      error: error.message
    });
  }
};

// Export Sales Orders (PDF/CSV)
export const exportSalesOrders = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const filters = {
      limit: 10000, // Large limit for export
      offset: 0,
      status: req.query.status,
      customer_id: req.query.customer_id,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      search: req.query.search,
      order_by: 'created_at',
      order_direction: 'DESC'
    };
    
    const salesOrders = await salesOrderModel.getAllSalesOrders(filters);
    
    // Helper function to format date for Excel (DD/MM/YYYY)
    const formatDateForExcel = (dateString) => {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch (e) {
        return '';
      }
    };

    // Transform data for export
    const exportData = salesOrders.map(order => ({
      so_no: order.order_number || order.so_no || '',
      customer_name: order.customer_name || '',
      customer_code: order.customer_code || '',
      order_date: formatDateForExcel(order.order_date),
      required_date: formatDateForExcel(order.required_date),
      delivery_date: formatDateForExcel(order.delivery_date),
      status: order.status || '',
      priority: order.priority || '',
      total_amount: parseFloat(order.total_amount || 0),
      subtotal: parseFloat(order.subtotal || 0),
      tax_amount: parseFloat(order.tax_amount || 0),
      reference_number: order.reference_number || '',
      created_at: formatDateForExcel(order.created_at)
    }));

    if (format === 'pdf') {
      let browser;
      try {
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Sales Orders Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .company-header { text-align: center; margin-bottom: 20px; }
                .company-header h1 { color: #333; margin: 0; }
                .company-header p { color: #666; margin: 4px 0; }
                .meta { text-align: center; margin: 12px 0 18px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .footer { margin-top: 20px; text-align: center; color: #666; font-size: 11px; }
                .amount { text-align: right; }
              </style>
            </head>
            <body>
              <div class="company-header">
                <h1>Enterprising Manufacturing Co Pvt. Ltd.</h1>
                <p>Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900</p>
                <p>Tel: (+9221) 3507 5579 | (+92300) 9279500</p>
                <p>NTN No: 7268945-5 | Sales Tax No: 3277-87612-9785</p>
              </div>
              <div class="meta">
                <h2>Sales Orders Report</h2>
                <p>Generated on: ${new Date().toLocaleDateString()} &nbsp; | &nbsp; Total Records: ${exportData.length}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>SO No</th>
                    <th>Customer</th>
                    <th>Order Date</th>
                    <th>Required Date</th>
                    <th>Delivery Date</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Total Amount</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  ${exportData.map(item => `
                    <tr>
                      <td>${item.so_no || ''}</td>
                      <td>${item.customer_name || ''}</td>
                      <td>${item.order_date || ''}</td>
                      <td>${item.required_date || ''}</td>
                      <td>${item.delivery_date || ''}</td>
                      <td>${item.status || ''}</td>
                      <td>${item.priority || ''}</td>
                      <td class="amount">Rs ${item.total_amount.toLocaleString()}</td>
                      <td>${item.reference_number || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="footer">
                This report was generated automatically by the ERP system.
              </div>
            </body>
          </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="sales-orders-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.end(pdfBuffer);
      } catch (pdfError) {
        logger.error({ error: pdfError }, 'Failed to generate sales orders PDF');
        if (browser) await browser.close();
        return res.status(500).json({
          error: 'Failed to generate PDF',
          message: 'PDF generation failed. Please try again or use CSV export instead.',
        });
      }
    } else if (format === 'csv') {
      const headers = ['SO No', 'Customer Name', 'Order Date', 'Required Date', 'Delivery Date', 'Status', 'Priority', 'Subtotal', 'Tax Amount', 'Total Amount', 'Reference Number', 'Created At'];
      const csvRows = exportData.map(item =>
        [
          item.so_no,
          item.customer_name,
          item.order_date,
          item.required_date,
          item.delivery_date,
          item.status,
          item.priority,
          item.subtotal,
          item.tax_amount,
          item.total_amount,
          item.reference_number,
          item.created_at
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
      );

      // Add company header information (centered by adding empty cells)
      const numColumns = headers.length;
      const emptyCells = Array(numColumns).fill('').map(c => `"${c}"`).join(',');
      // Center text by adding empty cells before (approximately half the columns)
      const centerPadding = Math.floor(numColumns / 2) - 1;
      const leftPadding = Array(centerPadding).fill('').map(c => `"${c}"`).join(',');
      const rightPadding = Array(numColumns - centerPadding - 1).fill('').map(c => `"${c}"`).join(',');
      
      // Company info with spacing for emphasis (using multiple spaces)
      const companyHeader = `${leftPadding},"ENTERPRISING MANUFACTURING CO PVT. LTD.",${rightPadding}`;
      const companyInfo = `${leftPadding},"Factory: Plot #9, Sector 26, Korangi Industrial Area, Karachi - Pakistan - 74900",${rightPadding}`;
      const companyContact = `${leftPadding},"Tel: (+9221) 3507 5579 | (+92300) 9279500",${rightPadding}`;
      const companyTax = `${leftPadding},"NTN No: 7268945-5 | Sales Tax No: 3277-87612-9785",${rightPadding}`;
      const reportTitle = `${leftPadding},"SALES ORDERS REPORT",${rightPadding}`;
      const reportMeta = `${leftPadding},"Generated on: ${new Date().toLocaleDateString('en-GB')} | Total Records: ${exportData.length}",${rightPadding}`;
      
      const csvContent = companyHeader + '\n' +
                        companyInfo + '\n' +
                        companyContact + '\n' +
                        companyTax + '\n' +
                        emptyCells + '\n' +
                        reportTitle + '\n' +
                        reportMeta + '\n' +
                        emptyCells + '\n' +
                        headers.join(',') + '\n' +
                        csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-orders-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    return res.status(200).json({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to export sales orders');
    return res.status(500).json({
      success: false,
      error: 'Failed to export sales orders',
      message: error.message
    });
  }
};
