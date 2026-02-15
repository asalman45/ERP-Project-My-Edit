// src/controllers/collectionAutomation.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import db from '../utils/db.js';

const prisma = new PrismaClient();

/**
 * Get overdue invoices for collection
 * GET /api/finance/collections/overdue
 */
export async function getOverdueInvoices(req, res) {
    try {
        const query = `
      SELECT ci.*, 
             COALESCE(ce.effort_count, 0) as effort_count,
             ce.last_contact_date
      FROM customer_invoice ci
      LEFT JOIN (
        SELECT invoice_id, COUNT(*) as effort_count, MAX(contact_date) as last_contact_date
        FROM collection_effort
        GROUP BY invoice_id
      ) ce ON ci.invoice_id = ce.invoice_id
      WHERE ci.due_date < CURRENT_TIMESTAMP 
      AND ci.payment_status IN ('PENDING', 'PARTIAL')
      AND ci.status != 'CANCELLED'
      ORDER BY ci.due_date ASC
    `;
        const result = await db.query(query);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        logger.error({ error: error.message }, 'Error fetching overdue invoices for collections');
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

/**
 * Send automated reminder (Simulation)
 * POST /api/finance/collections/send-reminder
 */
export async function sendReminder(req, res) {
    const { invoice_id, contact_method = 'EMAIL' } = req.body;

    try {
        // 1. Fetch invoice and customer details
        const invoiceQuery = `SELECT ci.*, c.email, c.name as customer_name FROM customer_invoice ci JOIN customer c ON ci.customer_id = c.customer_id WHERE ci.invoice_id = $1`;
        const invoiceResult = await db.query(invoiceQuery, [invoice_id]);

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        const invoice = invoiceResult.rows[0];

        // 2. Simulate email sending
        logger.info({
            to: invoice.email,
            subject: `Payment Reminder: Invoice ${invoice.invoice_no}`,
            body: `Dear ${invoice.customer_name}, this is a reminder regarding your overdue payment of ₹${invoice.total_amount}.`
        }, 'Simulating automated collection reminder');

        // 3. Log the effort in DB
        const effort = await prisma.collectionEffort.create({
            data: {
                invoice_id,
                contact_method,
                notes: `Automated ${contact_method} reminder sent to ${invoice.email}`,
                status: 'OPEN'
            }
        });

        res.json({
            success: true,
            message: `Reminder sent to ${invoice.customer_name}`,
            effort
        });
    } catch (error) {
        logger.error({ error: error.message }, 'Error sending collection reminder');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get history of collection efforts for an invoice
 * GET /api/finance/collections/history/:invoiceId
 */
export async function getCollectionHistory(req, res) {
    const { invoiceId } = req.params;
    try {
        const history = await prisma.collectionEffort.findMany({
            where: { invoice_id: invoiceId },
            orderBy: { contact_date: 'desc' }
        });
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getOverdueInvoices,
    sendReminder,
    getCollectionHistory
};
