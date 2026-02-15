// src/controllers/financialStatements.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Get Profit & Loss Statement
 * GET /api/finance/reporting/p-and-l
 */
export async function getProfitAndLoss(req, res) {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    try {
        // 1. Fetch all accounts related to Revenue and Expense
        const accounts = await prisma.financialAccount.findMany({
            where: {
                type: { in: ['REVENUE', 'EXPENSE'] }
            },
            include: {
                journalLines: {
                    where: {
                        entry: {
                            entry_date: { gte: start, lte: end },
                            status: 'POSTED'
                        }
                    }
                },
                budgets: {
                    where: { fiscal_year: req.query.fiscalYear || '2023-24' }
                }
            }
        });

        // 2. Aggregate data
        const report = {
            revenue: [],
            expense: [],
            totals: {
                revenue: 0,
                expense: 0,
                net_profit: 0
            }
        };

        accounts.forEach(acc => {
            const actual = acc.journalLines.reduce((sum, line) => {
                // For Revenue: Credit - Debit
                // For Expense: Debit - Credit
                const amount = acc.type === 'REVENUE'
                    ? (parseFloat(line.credit) - parseFloat(line.debit))
                    : (parseFloat(line.debit) - parseFloat(line.credit));
                return sum + amount;
            }, 0);

            const budget = acc.budgets[0]?.amount || 0;

            const item = {
                code: acc.code,
                name: acc.name,
                actual,
                budget,
                variance: actual - budget
            };

            if (acc.type === 'REVENUE') {
                report.revenue.push(item);
                report.totals.revenue += actual;
            } else {
                report.expense.push(item);
                report.totals.expense += actual;
            }
        });

        report.totals.net_profit = report.totals.revenue - report.totals.expense;

        res.json({ success: true, data: report });
    } catch (error) {
        logger.error({ error: error.message }, 'Error generating P&L statement');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get Balance Sheet
 * GET /api/finance/reporting/balance-sheet
 */
export async function getBalanceSheet(req, res) {
    const { asOfDate } = req.query;
    const date = asOfDate ? new Date(asOfDate) : new Date();

    try {
        const accounts = await prisma.financialAccount.findMany({
            where: {
                type: { in: ['ASSET', 'LIABILITY', 'EQUITY'] }
            },
            include: {
                journalLines: {
                    where: {
                        entry: {
                            entry_date: { lte: date },
                            status: 'POSTED'
                        }
                    }
                }
            }
        });

        const report = {
            assets: [],
            liabilities: [],
            equity: [],
            totals: {
                assets: 0,
                liabilities: 0,
                equity: 0
            }
        };

        accounts.forEach(acc => {
            const balance = acc.journalLines.reduce((sum, line) => {
                // Asset: Debit - Credit
                // Liability/Equity: Credit - Debit
                let amount = 0;
                if (acc.type === 'ASSET') {
                    amount = parseFloat(line.debit) - parseFloat(line.credit);
                } else {
                    amount = parseFloat(line.credit) - parseFloat(line.debit);
                }
                return sum + amount;
            }, 0);

            const item = { code: acc.code, name: acc.name, balance };

            if (acc.type === 'ASSET') {
                report.assets.push(item);
                report.totals.assets += balance;
            } else if (acc.type === 'LIABILITY') {
                report.liabilities.push(item);
                report.totals.liabilities += balance;
            } else {
                report.equity.push(item);
                report.totals.equity += balance;
            }
        });

        res.json({ success: true, data: report });
    } catch (error) {
        logger.error({ error: error.message }, 'Error generating balance sheet');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getProfitAndLoss,
    getBalanceSheet
};
