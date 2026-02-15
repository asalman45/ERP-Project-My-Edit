// src/controllers/vendorPayment.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Get pending vendor payments (Accounts Payable Aging)
 * GET /api/finance/vendor-payments/pending
 */
export async function getPendingPayments(req, res) {
    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                status: { in: ['RECEIVED', 'APPROVED_FOR_PAYMENT'] },
                payments: {
                    none: { payment_status: 'PAID' } // Simple check: no full payment yet
                }
            },
            include: {
                supplier: true,
                payments: true
            },
            orderBy: { due_date: 'asc' }
        });

        const agingReport = invoices.map(inv => {
            const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
            const balance = inv.total_amount - paidAmount;
            const daysOverdue = Math.max(0, Math.floor((new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24)));

            return {
                invoice_id: inv.invoice_id,
                invoice_no: inv.invoice_no,
                supplier_name: inv.supplier.name,
                due_date: inv.due_date,
                total_amount: inv.total_amount,
                paid_amount: paidAmount,
                balance,
                days_overdue: daysOverdue,
                status: inv.status
            };
        });

        res.json({ success: true, data: agingReport });
    } catch (error) {
        logger.error({ error: error.message }, 'Error fetching pending vendor payments');
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

/**
 * Schedule a payment for a vendor invoice
 * POST /api/finance/vendor-payments/schedule
 */
export async function schedulePayment(req, res) {
    const { invoice_id, amount, due_date, payment_method } = req.body;

    try {
        const payment = await prisma.payment.create({
            data: {
                invoice_id,
                amount,
                due_date: new Date(due_date),
                payment_method,
                payment_status: 'PENDING',
                created_by: 'SYSTEM' // Replace with actual user ID if available
            }
        });

        res.json({ success: true, data: payment });
    } catch (error) {
        logger.error({ error: error.message }, 'Error scheduling payment');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Record payment completion
 * POST /api/finance/vendor-payments/record
 */
export async function recordPayment(req, res) {
    const { payment_id, reference, paid_date } = req.body;

    try {
        const updatedPayment = await prisma.payment.update({
            where: { payment_id },
            data: {
                payment_status: 'PAID',
                paid_date: paid_date ? new Date(paid_date) : new Date(),
                reference
            },
            include: {
                invoice: true
            }
        });

        // Check if invoice is fully paid
        const totalPaid = await prisma.payment.aggregate({
            where: { invoice_id: updatedPayment.invoice_id, payment_status: 'PAID' },
            _sum: { amount: true }
        });

        if ((totalPaid._sum.amount || 0) >= updatedPayment.invoice.total_amount) {
            await prisma.invoice.update({
                where: { invoice_id: updatedPayment.invoice_id },
                data: { status: 'PAID' }
            });
        }

        res.json({ success: true, data: updatedPayment });
    } catch (error) {
        logger.error({ error: error.message }, 'Error recording payment completion');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getPendingPayments,
    schedulePayment,
    recordPayment
};
