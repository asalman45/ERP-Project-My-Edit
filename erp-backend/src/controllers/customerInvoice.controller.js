// src/controllers/customerInvoice.controller.js
// Controller for Customer Invoice (Sales Invoice) operations

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { generateInvoicePDF } from '../services/pdf.service.js';

/**
 * Create a new customer invoice from sales order or dispatch
 * POST /api/customer-invoices
 */
export async function createCustomerInvoice(req, res) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const {
      so_id,
      dispatch_id,
      customer_id,
      invoice_date,
      due_date,
      items = [],
      payment_terms,
      notes
    } = req.body;

    if (!so_id && !dispatch_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Either sales order ID or dispatch ID is required'
      });
    }

    // Get sales order and customer details
    let soData = null;
    let customerData = null;

    if (so_id) {
      const soQuery = `
        SELECT so.so_id, so.so_no, so.customer_id, so.total_amount, so.tax_amount,
               c.name as customer_name, c.address as customer_address,
               c.gst_number, c.contact_person, c.phone, c.email
        FROM sales_order so
        LEFT JOIN customer c ON so.customer_id = c.customer_id
        WHERE so.so_id = $1
      `;
      const soResult = await client.query(soQuery, [so_id]);
      if (soResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Sales order not found'
        });
      }
      soData = soResult.rows[0];
      customerData = {
        customer_id: soData.customer_id || customer_id,
        customer_name: soData.customer_name,
        customer_address: soData.customer_address,
        gst_number: soData.gst_number,
        contact_person: soData.contact_person,
        phone: soData.phone,
        email: soData.email
      };
    } else if (dispatch_id) {
      // Get dispatch details
      const dispatchQuery = `
        SELECT do.so_id, so.so_no, do.customer_id,
               c.name as customer_name, c.address as customer_address,
               c.gst_number, c.contact_person, c.phone, c.email
        FROM dispatch_order do
        LEFT JOIN sales_order so ON do.so_id = so.so_id
        LEFT JOIN customer c ON do.customer_id = c.customer_id
        WHERE do.dispatch_id = $1
      `;
      const dispatchResult = await client.query(dispatchQuery, [dispatch_id]);
      if (dispatchResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Dispatch order not found'
        });
      }
      const dispatch = dispatchResult.rows[0];
      soData = { so_id: dispatch.so_id, so_no: dispatch.so_no };
      customerData = {
        customer_id: dispatch.customer_id || customer_id,
        customer_name: dispatch.customer_name,
        customer_address: dispatch.customer_address,
        gst_number: dispatch.gst_number,
        contact_person: dispatch.contact_person,
        phone: dispatch.phone,
        email: dispatch.email
      };
    }

    if (!customerData || !customerData.customer_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Customer information not found'
      });
    }

    // Calculate totals from items or sales order
    let subtotal = 0;
    let taxAmount = 0;
    let totalAmount = 0;

    if (items.length > 0) {
      items.forEach(item => {
        const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
        subtotal += lineTotal;
      });
      taxAmount = subtotal * 0.18; // 18% GST
      totalAmount = subtotal + taxAmount;
    } else if (soData) {
      // Use sales order totals
      subtotal = (soData.total_amount || 0) - (soData.tax_amount || 0);
      taxAmount = soData.tax_amount || (subtotal * 0.18);
      totalAmount = soData.total_amount || (subtotal + taxAmount);
    }

    // Generate invoice number
    const invoiceNo = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
    const invoiceId = uuidv4();

    // Insert customer invoice (using a simple customer_invoice table or generic invoice table)
    // For now, we'll create a customer invoice record in a simple structure
    const invoiceQuery = `
      INSERT INTO customer_invoice (
        invoice_id, invoice_no, so_id, dispatch_id, customer_id,
        customer_name, customer_address, gst_number,
        subtotal, tax_amount, total_amount,
        invoice_date, due_date, payment_terms, notes,
        status, payment_status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'ACTIVE', 'PENDING', CURRENT_TIMESTAMP
      ) RETURNING invoice_id, invoice_no
    `;

    const invoiceResult = await client.query(invoiceQuery, [
      invoiceId,
      invoiceNo,
      soData?.so_id || null,
      dispatch_id || null,
      customerData.customer_id,
      customerData.customer_name || '',
      customerData.customer_address || '',
      customerData.gst_number || null,
      subtotal,
      taxAmount,
      totalAmount,
      invoice_date ? new Date(invoice_date) : new Date(),
      due_date ? new Date(due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      payment_terms || 'NET_30',
      notes || ''
    ]);

    const invoice = invoiceResult.rows[0];

    // Insert invoice items if provided
    if (items.length > 0) {
      for (const item of items) {
        const itemId = uuidv4();
        await client.query(`
          INSERT INTO customer_invoice_item (
            invoice_item_id, invoice_id, product_id, product_name,
            quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          itemId,
          invoiceId,
          item.product_id || null,
          item.product_name || '',
          item.quantity || 0,
          item.unit_price || 0,
          (item.quantity || 0) * (item.unit_price || 0)
        ]);
      }
    } else if (soData?.so_id) {
      // Auto-populate from sales order items
      const soItemsQuery = `
        SELECT soi.product_id, p.part_name as product_name,
               soi.qty_ordered as quantity, soi.unit_price
        FROM sales_order_item soi
        LEFT JOIN product p ON soi.product_id = p.product_id
        WHERE soi.so_id = $1
      `;
      const soItemsResult = await client.query(soItemsQuery, [soData.so_id]);

      for (const item of soItemsResult.rows) {
        const itemId = uuidv4();
        const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
        await client.query(`
          INSERT INTO customer_invoice_item (
            invoice_item_id, invoice_id, product_id, product_name,
            quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          itemId,
          invoiceId,
          item.product_id,
          item.product_name || '',
          item.quantity,
          item.unit_price || 0,
          lineTotal
        ]);
      }
    }

    await client.query('COMMIT');

    logger.info({
      invoice_id: invoiceId,
      invoice_no: invoiceNo,
      so_id: soData?.so_id,
      customer_id: customerData.customer_id,
      total_amount: totalAmount
    }, 'Customer invoice created successfully');

    res.json({
      success: true,
      data: {
        invoice_id: invoiceId,
        invoice_no: invoiceNo,
        so_id: soData?.so_id,
        customer_id: customerData.customer_id,
        total_amount: totalAmount
      },
      message: 'Invoice created successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error: error.message, stack: error.stack, body: req.body }, 'Error creating customer invoice');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create invoice'
    });
  } finally {
    client.release();
  }
}

/**
 * Get all customer invoices
 * GET /api/customer-invoices
 */
export async function getCustomerInvoices(req, res) {
  try {
    const { status, payment_status, customer_id } = req.query;

    let query = `
      SELECT 
        ci.invoice_id,
        ci.invoice_no,
        ci.so_id,
        ci.dispatch_id,
        ci.customer_id,
        ci.customer_name,
        ci.subtotal,
        ci.tax_amount,
        ci.total_amount,
        ci.invoice_date,
        ci.due_date,
        ci.payment_terms,
        ci.status,
        ci.payment_status,
        ci.created_at,
        so.so_no as so_number
      FROM customer_invoice ci
      LEFT JOIN sales_order so ON ci.so_id = so.so_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND ci.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (payment_status) {
      query += ` AND ci.payment_status = $${paramCount}`;
      params.push(payment_status);
      paramCount++;
    }

    if (customer_id) {
      query += ` AND ci.customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }

    query += ` ORDER BY ci.invoice_date DESC, ci.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching customer invoices');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch invoices'
    });
  }
}

/**
 * Update invoice payment status
 * PUT /api/customer-invoices/:invoiceId/payment
 */
export async function updatePaymentStatus(req, res) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { invoiceId } = req.params;
    const { payment_status, payment_amount, payment_date, payment_method, notes } = req.body;

    if (!payment_status) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Payment status is required'
      });
    }

    const validStatuses = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!validStatuses.includes(payment_status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateQuery = `
      UPDATE customer_invoice 
      SET payment_status = $1,
          payment_date = CASE WHEN $1 = 'PAID' THEN COALESCE($2, CURRENT_TIMESTAMP) ELSE payment_date END,
          payment_method = COALESCE($3, payment_method),
          notes = COALESCE($4, notes),
          status = CASE WHEN $1 = 'PAID' THEN 'COMPLETED' ELSE status END
      WHERE invoice_id = $5
      RETURNING invoice_id, invoice_no, payment_status, total_amount
    `;

    const result = await client.query(updateQuery, [
      payment_status,
      payment_date ? new Date(payment_date) : null,
      payment_method,
      notes,
      invoiceId
    ]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    await client.query('COMMIT');

    logger.info({
      invoice_id: invoiceId,
      payment_status,
      payment_amount
    }, 'Invoice payment status updated');

    res.json({
      success: true,
      data: result.rows[0],
      message: `Payment status updated to ${payment_status}`
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Error updating payment status');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update payment status'
    });
  } finally {
    client.release();
  }
}

/**
 * Get a single customer invoice with its items
 * GET /api/customer-invoices/:invoiceId
 */
export async function getCustomerInvoiceById(req, res) {
  try {
    const { invoiceId } = req.params;

    const invoiceQuery = `
      SELECT ci.*, so.so_no as so_number
      FROM customer_invoice ci
      LEFT JOIN sales_order so ON ci.so_id = so.so_id
      WHERE ci.invoice_id = $1
    `;
    const invoiceResult = await db.query(invoiceQuery, [invoiceId]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const itemsQuery = `
      SELECT * FROM customer_invoice_item
      WHERE invoice_id = $1
      ORDER BY invoice_item_id ASC
    `;
    const itemsResult = await db.query(itemsQuery, [invoiceId]);

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    res.json({ success: true, data: invoice });
  } catch (error) {
    logger.error({ error }, 'Error fetching invoice by ID');
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Generate and download invoice PDF
 * GET /api/customer-invoices/:invoiceId/pdf
 */
export async function downloadInvoicePDF(req, res) {
  try {
    const { invoiceId } = req.params;

    // Fetch invoice details
    const invoiceQuery = `
      SELECT ci.*, so.so_no as so_number
      FROM customer_invoice ci
      LEFT JOIN sales_order so ON ci.so_id = so.so_id
      WHERE ci.invoice_id = $1
    `;
    const invoiceResult = await db.query(invoiceQuery, [invoiceId]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const itemsQuery = `
      SELECT * FROM customer_invoice_item
      WHERE invoice_id = $1
      ORDER BY invoice_item_id ASC
    `;
    const itemsResult = await db.query(itemsQuery, [invoiceId]);

    const invoiceData = invoiceResult.rows[0];
    invoiceData.items = itemsResult.rows;

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoiceData.invoice_no}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error({ error: error.message }, 'Error in downloadInvoicePDF controller');
    res.status(500).json({ success: false, error: 'Failed to generate PDF invoice' });
  }
}


export default {
  createCustomerInvoice,
  getCustomerInvoices,
  updatePaymentStatus,
  getCustomerInvoiceById,
  downloadInvoicePDF
};

