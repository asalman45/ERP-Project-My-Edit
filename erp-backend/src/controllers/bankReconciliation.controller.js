// src/controllers/bankReconciliation.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Import bank statement transactions
 * POST /api/finance/bank/import
 */
export async function importBankStatement(req, res) {
    const { account_id, transactions } = req.body;

    if (!account_id || !transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ success: false, error: 'Account ID and transactions array are required' });
    }

    try {
        const createdCount = await prisma.bankTransaction.createMany({
            data: transactions.map(t => ({
                account_id,
                transaction_date: new Date(t.date),
                description: t.description,
                amount: t.amount,
                reference: t.reference,
                recon_status: 'UNRECONCILED'
            }))
        });

        res.json({ success: true, count: createdCount.count, message: `${createdCount.count} transactions imported` });
    } catch (error) {
        logger.error({ error: error.message }, 'Error importing bank statement');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get bank transactions for reconciliation
 * GET /api/finance/bank/transactions/:accountId
 */
export async function getBankTransactions(req, res) {
    const { accountId } = req.params;
    const { status } = req.query;

    try {
        const transactions = await prisma.bankTransaction.findMany({
            where: {
                account_id: accountId,
                ...(status ? { recon_status: status } : {})
            },
            include: {
                journalLine: {
                    include: {
                        entry: true
                    }
                }
            },
            orderBy: { transaction_date: 'desc' }
        });

        res.json({ success: true, data: transactions });
    } catch (error) {
        logger.error({ error: error.message }, 'Error fetching bank transactions');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Reconcile a bank transaction with a journal line
 * POST /api/finance/bank/reconcile
 */
export async function reconcileTransaction(req, res) {
    const { txn_id, journal_line_id } = req.body;

    try {
        const updated = await prisma.bankTransaction.update({
            where: { txn_id },
            data: {
                journal_line_id,
                recon_status: 'RECONCILED'
            }
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        logger.error({ error: error.message }, 'Error reconciling transaction');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Auto-match bank transactions with journal lines
 * POST /api/finance/bank/auto-match
 */
export async function autoMatchTransactions(req, res) {
    const { account_id } = req.body;

    try {
        // 1. Get all unreconciled bank transactions
        const bankTxns = await prisma.bankTransaction.findMany({
            where: { account_id, recon_status: 'UNRECONCILED' }
        });

        // 2. Get all unreconciled journal lines for this account
        // For simplicity, we define unreconciled journal lines as those where 
        // there's NO BankTransaction pointing to them.
        const journalLines = await prisma.journalLine.findMany({
            where: {
                account_id,
                bankTransaction: null,
                entry: { status: 'POSTED' }
            },
            include: { entry: true }
        });

        const matches = [];

        // 3. Simple matching logic: Match by exact amount and within +/- 3 days
        for (const bTxn of bankTxns) {
            const bAmount = parseFloat(bTxn.amount);
            const bDate = new Date(bTxn.transaction_date);

            const match = journalLines.find(jLine => {
                const jAmount = parseFloat(jLine.debit) - parseFloat(jLine.credit);
                const jDate = new Date(jLine.entry.entry_date);
                const daysDiff = Math.abs((jDate - bDate) / (1000 * 60 * 60 * 24));

                return Math.abs(bAmount - jAmount) < 0.01 && daysDiff <= 3;
            });

            if (match) {
                matches.push({
                    bank_txn_id: bTxn.txn_id,
                    journal_line_id: match.line_id,
                    confidence: 'HIGH',
                    reason: 'Amount and Date match'
                });
            }
        }

        res.json({ success: true, data: matches });
    } catch (error) {
        logger.error({ error: error.message }, 'Error during auto-match');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    importBankStatement,
    getBankTransactions,
    reconcileTransaction,
    autoMatchTransactions
};
