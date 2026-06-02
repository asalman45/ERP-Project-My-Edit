// src/controllers/supplierLedger.controller.js
// Supplier Ledger: per-supplier statement with invoices, payments, running balance, and WHT summary
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * GET /api/suppliers/ledger/:supplierId
 * Returns a full supplier statement: master info + transactions with running balance
 */
export async function getSupplierLedger(req, res) {
    try {
        const { supplierId } = req.params;
        const { from, to } = req.query;

        const supplier = await prisma.supplier.findUnique({
            where: { supplier_id: supplierId },
        });

        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        const dateFilter = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            dateFilter.lte = toDate;
        }

        // Fetch all invoices for this supplier
        const invoices = await prisma.invoice.findMany({
            where: {
                supplier_id: supplierId,
                ...(Object.keys(dateFilter).length ? { invoice_date: dateFilter } : {}),
            },
            include: { payments: true },
            orderBy: { invoice_date: 'asc' },
        });

        // Build ledger lines
        let balance = 0;
        const lines = [];

        for (const inv of invoices) {
            // Invoice = credit (we owe the supplier)
            balance += inv.total_amount;
            lines.push({
                date: inv.invoice_date,
                type: 'INVOICE',
                reference: inv.invoice_no,
                particulars: inv.particulars ?? 'Supplier Invoice',
                base_amount: inv.base_amount ?? inv.subtotal,
                tax_type: inv.tax_type,
                tax_rate: inv.tax_rate,
                tax_amount: inv.tax_amount,
                discount_amount: inv.discount_amount,
                debit: 0,
                credit: inv.total_amount,
                balance,
                invoice_id: inv.invoice_id,
                status: inv.status,
            });

            // Payments = debit (we paid the supplier)
            for (const pmt of inv.payments.sort((a, b) => new Date(a.paid_date) - new Date(b.paid_date))) {
                if (pmt.payment_status !== 'PAID') continue;
                const total_deducted = (pmt.wht_amount ?? 0) + pmt.amount;
                balance -= total_deducted;
                lines.push({
                    date: pmt.paid_date,
                    type: 'PAYMENT',
                    reference: pmt.reference ?? pmt.payment_id,
                    particulars: `Payment via ${pmt.payment_method ?? 'Bank'}`,
                    debit: total_deducted,
                    credit: 0,
                    balance,
                    wht_amount: pmt.wht_amount,
                    wht_rate: pmt.wht_rate,
                    amount_paid: pmt.amount,
                    payment_id: pmt.payment_id,
                });
            }
        }

        // Sort by date
        lines.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Rebuild running balance after sort
        let runningBalance = 0;
        for (const line of lines) {
            runningBalance += (line.credit ?? 0) - (line.debit ?? 0);
            line.balance = runningBalance;
        }

        // Summary
        const totalInvoiced = lines.filter(l => l.type === 'INVOICE').reduce((s, l) => s + l.credit, 0);
        const totalPaid = lines.filter(l => l.type === 'PAYMENT').reduce((s, l) => s + (l.amount_paid ?? 0), 0);
        const totalWHT = lines.filter(l => l.type === 'PAYMENT').reduce((s, l) => s + (l.wht_amount ?? 0), 0);
        const totalGST = invoices.reduce((s, i) => s + (i.tax_amount ?? 0), 0);

        res.json({
            success: true,
            data: {
                supplier,
                lines,
                summary: {
                    total_invoiced: totalInvoiced,
                    total_paid: totalPaid,
                    total_wht: totalWHT,
                    total_gst: totalGST,
                    closing_balance: runningBalance,
                    invoice_count: invoices.length,
                    payment_count: lines.filter(l => l.type === 'PAYMENT').length,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching supplier ledger:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/suppliers/ledger
 * Returns a summary of all suppliers with total payable, WHT, and invoice counts
 */
export async function getAllSupplierSummaries(req, res) {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: {
                invoices: {
                    include: { payments: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        const summaries = suppliers.map(s => {
            const totalInvoiced = s.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
            const totalPaid = s.invoices.flatMap(inv => inv.payments)
                .filter(p => p.payment_status === 'PAID')
                .reduce((sum, p) => sum + p.amount, 0);
            const totalWHT = s.invoices.flatMap(inv => inv.payments)
                .filter(p => p.payment_status === 'PAID')
                .reduce((sum, p) => sum + (p.wht_amount ?? 0), 0);
            const totalGST = s.invoices.reduce((sum, inv) => sum + (inv.tax_amount ?? 0), 0);
            const outstanding = totalInvoiced - totalPaid - totalWHT;

            return {
                supplier_id: s.supplier_id,
                code: s.code,
                name: s.name,
                ntn: s.ntn,
                strn: s.strn,
                bank_name: s.bank_name,
                bank_account: s.bank_account,
                bank_iban: s.bank_iban,
                bank_account_title: s.bank_account_title,
                bank_account_type: s.bank_account_type,
                bank_branch: s.bank_branch,
                email: s.email,
                phone: s.phone,
                address: s.address,
                invoice_count: s.invoices.length,
                total_invoiced: totalInvoiced,
                total_paid: totalPaid,
                total_wht: totalWHT,
                total_gst: totalGST,
                outstanding,
            };
        });

        res.json({ success: true, data: summaries });
    } catch (error) {
        console.error('Error fetching supplier summaries:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/suppliers/wht-summary
 * Returns WHT deducted per supplier for tax filing
 */
export async function getWHTSummary(req, res) {
    try {
        const { from, to } = req.query;

        const dateFilter = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) {
            const toDate = new Date(to);
            toDate.setHours(23, 59, 59, 999);
            dateFilter.lte = toDate;
        }

        const payments = await prisma.payment.findMany({
            where: {
                payment_status: 'PAID',
                wht_amount: { gt: 0 },
                ...(Object.keys(dateFilter).length ? { paid_date: dateFilter } : {}),
            },
            include: {
                invoice: {
                    include: { supplier: true },
                },
            },
            orderBy: { paid_date: 'asc' },
        });

        // Group by supplier
        const bySupplier = {};
        let grandTotalWHT = 0;

        for (const pmt of payments) {
            const sup = pmt.invoice?.supplier;
            if (!sup) continue;
            const sid = sup.supplier_id;
            if (!bySupplier[sid]) {
                bySupplier[sid] = {
                    supplier_id: sid,
                    supplier_name: sup.name,
                    ntn: sup.ntn ?? 'N/A',
                    payments: [],
                    total_base: 0,
                    total_wht: 0,
                };
            }
            bySupplier[sid].payments.push({
                date: pmt.paid_date,
                reference: pmt.reference,
                amount: pmt.amount,
                wht_rate: pmt.wht_rate,
                wht_amount: pmt.wht_amount,
                invoice_no: pmt.invoice?.invoice_no,
            });
            bySupplier[sid].total_base += pmt.amount;
            bySupplier[sid].total_wht += (pmt.wht_amount ?? 0);
            grandTotalWHT += (pmt.wht_amount ?? 0);
        }

        res.json({
            success: true,
            data: {
                by_supplier: Object.values(bySupplier),
                grand_total_wht: grandTotalWHT,
                payment_count: payments.length,
            },
        });
    } catch (error) {
        console.error('Error fetching WHT summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default { getSupplierLedger, getAllSupplierSummaries, getWHTSummary };
