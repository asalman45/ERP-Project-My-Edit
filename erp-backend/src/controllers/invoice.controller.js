// src/controllers/invoice.controller.js
// Controller for Supplier Invoice operations (AP Invoices)
// Uses Prisma ORM — consistent with the rest of the application.

import { PrismaClient } from '@prisma/client';
import { autoPostSupplierInvoice } from '../services/smartAutomation.service.js';
const prisma = new PrismaClient();

/**
 * Create a new supplier invoice
 * POST /api/invoices
 */
export async function createInvoice(req, res) {
  try {
    const {
      invoice_no,
      supplier_id,
      po_id,
      invoice_date,
      due_date,
      total_amount,
      type,
      status,
      notes,
    } = req.body;

    if (!invoice_no || !total_amount) {
      return res.status(400).json({
        success: false,
        error: 'invoice_no and total_amount are required',
      });
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoice_no,
        supplier_id: supplier_id || null,
        po_id: po_id || null,
        invoice_date: invoice_date ? new Date(invoice_date) : new Date(),
        due_date: due_date ? new Date(due_date) : null,
        total_amount: parseFloat(total_amount),
        type: type || 'SUPPLIER',
        status: status || 'PENDING',
        notes: notes || null,
      },
      include: { supplier: true },
    });

    // TRIGGER 3A: Auto-Post Supplier Invoice (AP & Inventory/Expense to GL)
    try {
      await autoPostSupplierInvoice(invoice.invoice_id);
    } catch (finErr) {
      console.error('Auto-Posting Supplier Invoice failed:', finErr);
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get all invoices (supports optional ?type=SUPPLIER or ?status=PAID)
 * GET /api/invoices
 */
export async function getInvoices(req, res) {
  try {
    const { type, status, supplier_id } = req.query;

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (supplier_id) where.supplier_id = supplier_id;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { supplier: true },
      orderBy: { invoice_date: 'desc' },
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get single invoice by ID
 * GET /api/invoices/:id
 */
export async function getInvoiceById(req, res) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoice_id: req.params.id },
      include: { supplier: true, purchaseOrder: true },
    });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Update invoice status (e.g., mark as PAID)
 * PATCH /api/invoices/:id
 */
export async function updateInvoice(req, res) {
  try {
    const invoice = await prisma.invoice.update({
      where: { invoice_id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

export default { createInvoice, getInvoices, getInvoiceById, updateInvoice };
