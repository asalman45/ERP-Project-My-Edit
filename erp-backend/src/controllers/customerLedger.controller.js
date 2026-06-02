import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Get Customer Ledger (Statement of Account)
 * GET /api/finance/customer-ledger/:customerId
 */
export async function getCustomerLedger(req, res) {
    const { customerId } = req.params;
    const { start_date, end_date } = req.query;

    try {
        // 1. Get all invoices for this customer
        const invoices = await prisma.customerInvoice.findMany({
            where: {
                customer_id: customerId,
                invoice_date: {
                    ...(start_date && { gte: new Date(start_date) }),
                    ...(end_date && { lte: new Date(end_date) })
                }
            },
            orderBy: { invoice_date: 'asc' }
        });

        // 2. Get all payments for this customer (via invoices)
        // Note: This assumes payments are linked to customer invoices. 
        // If there's a separate customer_payment table, use that.
        // For now, we'll fetch payments linked to the customer's invoices.
        const invoiceIds = invoices.map(inv => inv.invoice_id);
        
        // Let's also check if there are any journal entries directly linked to this customer
        // Standard practice: AR account lines filtered by reference or specific customer mapping if available.
        // For this ERP, we'll focus on Invoices and related Payments.

        const ledgerEntries = [];

        // Add Invoices to ledger (Debit AR)
        invoices.forEach(inv => {
            ledgerEntries.push({
                date: inv.invoice_date,
                type: 'INVOICE',
                reference: inv.invoice_no,
                description: `Sales Invoice #${inv.invoice_no}`,
                debit: inv.total_amount,
                credit: 0
            });
        });

        // In a real system, we'd fetch payments from a customer_payment table.
        // If we don't have one yet, let's look at Journal Entries for the AR account 
        // that have a reference to the customer or invoice.
        
        const AR_ACCOUNT = '7f8d95fa-476b-4fcc-a6de-9b9fdfdf03bb';
        const arLines = await prisma.journalLine.findMany({
            where: {
                account_id: AR_ACCOUNT,
                entry: {
                    entry_date: {
                        ...(start_date && { gte: new Date(start_date) }),
                        ...(end_date && { lte: new Date(end_date) })
                    }
                }
            },
            include: { entry: true }
        });

        // Filter and add AR lines that aren't the primary invoice creation (credits to AR are usually payments)
        arLines.forEach(line => {
            const amount = parseFloat(line.credit);
            if (amount > 0) {
                ledgerEntries.push({
                    date: line.entry.entry_date,
                    type: 'PAYMENT',
                    reference: line.entry.reference,
                    description: line.entry.description,
                    debit: 0,
                    credit: amount
                });
            }
        });

        // Sort by date
        ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let balance = 0;
        const finalLedger = ledgerEntries.map(entry => {
            balance += (parseFloat(entry.debit) - parseFloat(entry.credit));
            return { ...entry, balance };
        });

        res.json({
            success: true,
            data: {
                customer_id: customerId,
                ledger: finalLedger,
                total_debit: ledgerEntries.reduce((sum, e) => sum + parseFloat(e.debit), 0),
                total_credit: ledgerEntries.reduce((sum, e) => sum + parseFloat(e.credit), 0),
                closing_balance: balance
            }
        });

    } catch (error) {
        logger.error({ error: error.message, customerId }, 'Error fetching customer ledger');
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

export default { getCustomerLedger };
