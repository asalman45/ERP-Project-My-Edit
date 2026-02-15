// src/controllers/taxReporting.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import db from '../utils/db.js';

const prisma = new PrismaClient();

/**
 * Get GST Summary (Collected vs Paid)
 * GET /api/finance/tax/gst-summary
 */
export async function getGSTSummary(req, res) {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    try {
        // 1. Output GST (Collected from Customers)
        // Using raw SQL for customer_invoice as it's not in Prisma schema yet or is manual
        const outputGstQuery = `
      SELECT SUM(tax_amount) as total_output_gst
      FROM customer_invoice
      WHERE invoice_date BETWEEN $1 AND $2 AND status != 'CANCELLED'
    `;
        const outputGstResult = await db.query(outputGstQuery, [start, end]);
        const outputGst = parseFloat(outputGstResult.rows[0].total_output_gst || 0);

        // 2. Input GST (Paid to Vendors)
        const inputGstResult = await prisma.invoice.aggregate({
            where: {
                invoice_date: { gte: start, lte: end },
                status: { not: 'CANCELLED' }
            },
            _sum: { tax_amount: true }
        });
        const inputGst = inputGstResult._sum.tax_amount || 0;

        res.json({
            success: true,
            data: {
                period: { start, end },
                output_gst: outputGst,
                input_gst: inputGst,
                net_gst_payable: outputGst - inputGst
            }
        });
    } catch (error) {
        logger.error({ error: error.message }, 'Error calculating GST summary');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get Sales GST Report (GSTR-1 style)
 * GET /api/finance/tax/sales-gst
 */
export async function getSalesGSTReport(req, res) {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    try {
        const query = `
      SELECT invoice_no, customer_name, gst_number, subtotal, tax_amount, total_amount, invoice_date
      FROM customer_invoice
      WHERE invoice_date BETWEEN $1 AND $2 AND status != 'CANCELLED'
      ORDER BY invoice_date ASC
    `;
        const result = await db.query(query, [start, end]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        logger.error({ error: error.message }, 'Error fetching sales GST report');
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

/**
 * Get Purchase GST Report (GSTR-2 style)
 * GET /api/finance/tax/purchase-gst
 */
export async function getPurchaseGSTReport(req, res) {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                invoice_date: { gte: start, lte: end },
                status: { not: 'CANCELLED' }
            },
            include: {
                supplier: true
            },
            orderBy: { invoice_date: 'asc' }
        });

        const report = invoices.map(inv => ({
            invoice_no: inv.invoice_no,
            supplier_name: inv.supplier.name,
            supplier_gst: inv.supplier.code, // Assuming code is used for GST or add gst field
            subtotal: inv.subtotal,
            tax_amount: inv.tax_amount,
            total_amount: inv.total_amount,
            invoice_date: inv.invoice_date
        }));

        res.json({ success: true, data: report });
    } catch (error) {
        logger.error({ error: error.message }, 'Error fetching purchase GST report');
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

export default {
    getGSTSummary,
    getSalesGSTReport,
    getPurchaseGSTReport
};
