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
            },
            include: {
                supplier: {
                    select: {
                        supplier_id: true,
                        code: true,
                        name: true,
                        ntn: true,
                        strn: true,
                        bank_name: true,
                        bank_branch: true,
                        bank_account: true,
                        bank_iban: true,
                        bank_account_title: true,
                        email: true,
                        phone: true,
                    }
                },
                payments: true,
            },
            orderBy: { invoice_date: 'desc' },
        });

        const agingReport = invoices.map(inv => {
            const paidAmount = inv.payments
                .filter(p => p.payment_status === 'PAID')
                .reduce((sum, p) => sum + p.amount + (p.wht_amount ?? 0), 0);
            const balance = Math.max(0, inv.total_amount - paidAmount);
            const daysOverdue = inv.due_date
                ? Math.max(0, Math.floor((new Date() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24)))
                : 0;

            return {
                ...inv,
                paid_amount: paidAmount,
                balance,
                days_overdue: daysOverdue,
            };
        }).filter(inv => inv.balance > 0);

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
 * Record a vendor payment directly against an invoice (create + post in one step)
 * POST /api/finance/vendor-payments/record
 * Body: { invoice_id, amount?, reference, paid_date, payment_method, bank_account_id, wht_rate?, wht_amount? }
 */
export async function recordPayment(req, res) {
    const {
        payment_id,    // legacy: if provided look up existing scheduled payment
        invoice_id,    // preferred: direct invoice payment
        reference,
        paid_date,
        bank_account_id,
        payment_method,
        wht_rate,
        wht_amount,
    } = req.body;

    try {
        // ── Resolve the invoice ──────────────────────────────────────────────
        let invId = invoice_id;

        // Legacy path: payment_id was provided (old scheduled payment)
        if (!invId && payment_id) {
            const existing = await prisma.payment.findUnique({
                where: { payment_id },
                select: { invoice_id: true }
            });
            if (!existing) return res.status(404).json({ success: false, error: 'Scheduled payment not found' });
            invId = existing.invoice_id;

            // Update the pre-scheduled payment record
            await prisma.payment.update({
                where: { payment_id },
                data: {
                    payment_status: 'PAID',
                    paid_date: paid_date ? new Date(paid_date) : new Date(),
                    reference,
                    wht_rate: wht_rate ? parseFloat(wht_rate) : null,
                    wht_amount: wht_amount ? parseFloat(wht_amount) : null,
                }
            });
        }

        if (!invId) return res.status(400).json({ success: false, error: 'invoice_id is required' });

        const invoice = await prisma.invoice.findUnique({
            where: { invoice_id: invId },
            include: { supplier: true, payments: { where: { payment_status: 'PAID' } } }
        });

        if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

        // Calculate balance
        const alreadyPaid = invoice.payments.reduce((s, p) => s + p.amount + (p.wht_amount ?? 0), 0);
        const balance      = Math.max(0, invoice.total_amount - alreadyPaid);
        const whtAmt       = wht_amount ? parseFloat(wht_amount) : 0;
        const cashAmount   = req.body.amount
            ? parseFloat(req.body.amount)
            : Math.max(0, balance - whtAmt);
        const totalSettled = cashAmount + whtAmt;

        const paidDate = paid_date ? new Date(paid_date) : new Date();

        // ── Resolve financial accounts ───────────────────────────────────────
        // Try to find accounts by code, then fall back to any matching category
        const findAcc = async (code, category) => {
            let acc = await prisma.financialAccount.findUnique({ where: { code } });
            if (!acc) {
                acc = await prisma.financialAccount.findFirst({
                    where: { category, active: true },
                    orderBy: { code: 'asc' }
                });
            }
            return acc;
        };

        const apAcc      = await findAcc('2100', 'ACCOUNTS_PAYABLE');
        const bankAcc    = await findAcc('1020', 'BANK');
        const whtPayAcc  = await findAcc('2200', 'ACCOUNTS_PAYABLE');

        if (!apAcc || !bankAcc) {
            return res.status(500).json({ success: false, error: 'Required financial accounts (AP / Bank) not found. Please set up Chart of Accounts first.' });
        }

        const BANK = bank_account_id || bankAcc.account_id;

        // ── Create new Payment record (direct payment) ──────────────────────
        let newPayment;
        if (!payment_id) {
            newPayment = await prisma.payment.create({
                data: {
                    invoice_id: invId,
                    amount: cashAmount,
                    payment_method: payment_method || 'ONLINE',
                    payment_status: 'PAID',
                    paid_date: paidDate,
                    reference,
                    wht_rate: wht_rate ? parseFloat(wht_rate) : null,
                    wht_amount: whtAmt > 0 ? whtAmt : null,
                    created_by: 'ERP_USER',
                }
            });
        }

        // ── Post Journal Entry ───────────────────────────────────────────────
        // DR Accounts Payable   (full settled amount)
        // CR Bank               (cash actually transferred)
        // CR WHT Payable        (tax withheld, if any)
        const jLines = [
            {
                account_id: apAcc.account_id,
                debit: totalSettled,
                credit: 0,
                description: `Settle AP: ${invoice.invoice_no} – ${invoice.supplier?.name ?? ''}`,
                cash_flow_type: 'OPERATING',
            },
            {
                account_id: BANK,
                debit: 0,
                credit: cashAmount,
                description: `${payment_method || 'Online'} payment ref: ${reference ?? ''}`,
                cash_flow_type: 'OPERATING',
            },
        ];

        if (whtAmt > 0 && whtPayAcc) {
            jLines.push({
                account_id: whtPayAcc.account_id,
                debit: 0,
                credit: whtAmt,
                description: `WHT @ ${wht_rate ?? ''}% on ${invoice.invoice_no}`,
                cash_flow_type: 'OPERATING',
            });
        }

        await prisma.journalEntry.create({
            data: {
                entry_date: paidDate,
                reference: reference ?? invoice.invoice_no,
                description: `Vendor Payment: ${invoice.supplier?.name ?? ''} (${invoice.invoice_no})`,
                status: 'POSTED',
                currency_code: 'PKR',
                lines: { create: jLines },
            }
        });

        // ── Mark invoice PAID if fully settled ───────────────────────────────
        const totalNowPaid = alreadyPaid + totalSettled;
        if (totalNowPaid >= invoice.total_amount - 1) { // 1 PKR tolerance
            await prisma.invoice.update({
                where: { invoice_id: invId },
                data: { status: 'PAID' }
            });
        }

        logger.info({ invoice_no: invoice.invoice_no, cashAmount, whtAmt }, 'Vendor payment recorded');

        res.json({
            success: true,
            data: newPayment ?? { payment_id, payment_status: 'PAID' },
            message: `Payment of PKR ${cashAmount.toLocaleString()} recorded. ${whtAmt > 0 ? `WHT PKR ${whtAmt.toLocaleString()} withheld.` : ''}`
        });

    } catch (error) {
        logger.error({ error: error.message }, 'Error recording vendor payment');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getPendingPayments,
    schedulePayment,
    recordPayment
};
