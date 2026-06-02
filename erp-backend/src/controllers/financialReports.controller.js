import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Get Profit & Loss Statement
 * GET /api/finance/reporting/p-and-l
 */
export async function getPnL(req, res) {
    const { start_date, end_date } = req.query;

    try {
        const where = { status: 'POSTED' };
        if (start_date) where.entry_date = { ...where.entry_date, gte: new Date(start_date) };
        if (end_date) where.entry_date = { ...where.entry_date, lte: new Date(end_date) };

        // Fetch all revenue and expense accounts
        const accounts = await prisma.financialAccount.findMany({
            where: {
                type: { in: ['REVENUE', 'EXPENSE'] },
                active: true
            },
            include: {
                journalLines: {
                    where: {
                        entry: where
                    }
                },
                budgets: true
            }
        });

        const revenue = [];
        const expense = [];
        let totalRevenue = 0;
        let totalExpense = 0;

        accounts.forEach(acc => {
            const actual = acc.journalLines.reduce((sum, je) => {
                return sum + (acc.type === 'REVENUE' ? (Number(je.credit) - Number(je.debit)) : (Number(je.debit) - Number(je.credit)));
            }, 0);

            const budget = acc.budgets.reduce((sum, be) => sum + Number(be.amount), 0);

            const entry = {
                code: acc.code,
                name: acc.name,
                actual: actual,
                budget: budget,
                variance: actual - budget
            };

            if (acc.type === 'REVENUE') {
                revenue.push(entry);
                totalRevenue += actual;
            } else {
                expense.push(entry);
                totalExpense += actual;
            }
        });

        res.json({
            success: true,
            data: {
                revenue,
                expense,
                totals: {
                    revenue: totalRevenue,
                    expense: totalExpense,
                    net_profit: totalRevenue - totalExpense
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching P&L:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/**
 * Get Balance Sheet
 * GET /api/finance/reporting/balance-sheet
 */
export async function getBalanceSheet(req, res) {
    const { date } = req.query;

    try {
        const asOfDate = date ? new Date(date) : new Date();

        const accounts = await prisma.financialAccount.findMany({
            where: {
                type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
                active: true
            },
            include: {
                journalLines: {
                    where: {
                        entry: {
                            entry_date: { lte: asOfDate },
                            status: 'POSTED'
                        }
                    }
                }
            }
        });

        const assets = [];
        const liabilities = [];
        const equity = [];
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        accounts.forEach(acc => {
            const balance = acc.journalLines.reduce((sum, je) => {
                if (acc.type === 'ASSET') return sum + (Number(je.debit) - Number(je.credit));
                return sum + (Number(je.credit) - Number(je.debit));
            }, 0);

            const entry = {
                code: acc.code,
                name: acc.name,
                balance: balance
            };

            if (acc.type === 'ASSET') {
                assets.push(entry);
                totalAssets += balance;
            } else if (acc.type === 'LIABILITY') {
                liabilities.push(entry);
                totalLiabilities += balance;
            } else {
                equity.push(entry);
                totalEquity += balance;
            }
        });

        // Add Retained Earnings
        const revExpEntries = await prisma.journalLine.findMany({
            where: {
                entry: { 
                    entry_date: { lte: asOfDate },
                    status: 'POSTED'
                },
                account: { type: { in: ['REVENUE', 'EXPENSE'] } }
            },
            include: { account: true }
        });

        const retainedEarnings = revExpEntries.reduce((sum, je) => {
            return sum + (je.account.type === 'REVENUE' ? (Number(je.credit) - Number(je.debit)) : (Number(je.debit) - Number(je.credit)));
        }, 0);

        equity.push({ code: '3900', name: 'Retained Earnings', balance: retainedEarnings });
        totalEquity += retainedEarnings;

        res.json({
            success: true,
            data: {
                assets,
                liabilities,
                equity,
                totals: {
                    assets: totalAssets,
                    liabilities: totalLiabilities,
                    equity: totalEquity
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching Balance Sheet:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/**
 * Get AP Aging Report
 */
export async function getAPAging(req, res) {
    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                type: 'PURCHASE',
                balance: { gt: 0 }
            },
            include: { supplier: true }
        });

        const now = new Date();
        const buckets = {
            current: 0,
            days30: 0,
            days60: 0,
            days90: 0,
            over90: 0
        };

        const details = invoices.map(inv => {
            const dueDate = new Date(inv.due_date);
            const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
            const balance = Number(inv.balance);

            if (diffDays <= 0) buckets.current += balance;
            else if (diffDays <= 30) buckets.days30 += balance;
            else if (diffDays <= 60) buckets.days60 += balance;
            else if (diffDays <= 90) buckets.days90 += balance;
            else buckets.over90 += balance;

            return {
                invoice_no: inv.invoice_no,
                supplier: inv.supplier?.name || 'Unknown',
                due_date: inv.due_date,
                days_overdue: Math.max(0, diffDays),
                balance: balance
            };
        });

        res.json({
            success: true,
            data: { buckets, details }
        });
    } catch (error) {
        logger.error('Error fetching AP Aging:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

/**
 * Get Expense Summary Report
 */
export async function getExpenseSummary(req, res) {
    const { start_date, end_date } = req.query;

    try {
        const where = { status: 'POSTED' };
        if (start_date) where.entry_date = { ...where.entry_date, gte: new Date(start_date) };
        if (end_date) where.entry_date = { ...where.entry_date, lte: new Date(end_date) };

        const expenseLines = await prisma.journalLine.findMany({
            where: {
                entry: where,
                account: { type: 'EXPENSE' }
            },
            include: { account: true, entry: true }
        });

        const summary = {};
        expenseLines.forEach(line => {
            const accName = line.account.name;
            const amount = Number(line.debit) - Number(line.credit);
            if (!summary[accName]) summary[accName] = 0;
            summary[accName] += amount;
        });

        const data = Object.keys(summary).map(key => ({
            category: key,
            amount: summary[key]
        }));

        res.json({ success: true, data });
    } catch (error) {
        logger.error('Error fetching Expense Summary:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
