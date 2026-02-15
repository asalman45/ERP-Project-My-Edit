// src/controllers/invoice.controller.js
// Controller for Invoice operations

import db from '../utils/db.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new invoice
 * POST /api/invoices
 */
export async function createInvoice(req, res) {
  try {
    const {
      so_id,
      customer_name,
      total_amount,
      tax_amount,
      invoice_date,
      due_date
    } = req.body;

    if (!customer_name || !total_amount) {
      return res.status(400).json({
        success: false,
        error: 'Customer name and total amount are required'
      });
    }

    logger.info({ customer_name, total_amount }, 'Creating invoice');

    const invoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const insertQuery = `
      INSERT INTO invoice (
        invoice_id, invoice_number, so_id, customer_name, total_amount, tax_amount,
        invoice_date, due_date, status, payment_status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING invoice_id
    `;

    const result = await db.query(insertQuery, [
      invoiceId, invoiceId, so_id, customer_name, total_amount, tax_amount || 0,
      invoice_date ? new Date(invoice_date) : new Date(),
      due_date ? new Date(due_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ]);

    res.json({
      success: true,
      invoiceId: result.rows[0].invoice_id,
      invoice_number: invoiceId,
      message: 'Invoice created successfully'
    });

  } catch (error) {
    logger.error({ error, body: req.body }, 'Error creating invoice');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create invoice'
    });
  }
}

/**
 * Get all invoices
 * GET /api/invoices
 */
export async function getInvoices(req, res) {
  try {
    const query = `
      SELECT 
        invoice_id,
        invoice_number,
        so_id,
        so_number,
        customer_name,
        total_amount,
        tax_amount,
        invoice_date,
        due_date,
        status,
        payment_status
      FROM invoice
      ORDER BY invoice_date DESC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    logger.error({ error }, 'Error fetching invoices');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch invoices'
    });
  }
}

export default {
  createInvoice,
  getInvoices
};
