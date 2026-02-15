// src/controllers/cashFlowForecast.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import db from '../utils/db.js';

const prisma = new PrismaClient();

/**
 * Get 12-week Cash Flow Forecast
 * GET /api/finance/reporting/cash-forecast
 */
export async function getCashForecast(req, res) {
    try {
        // 1. Get Current Liquidity (Bank + Cash Balances)
        const liquidityResult = await db.query(`
      SELECT SUM(credit - debit) as balance
      FROM journal_line jl
      JOIN financial_account fa ON jl.account_id = fa.account_id
      WHERE fa.category IN ('BANK', 'CASH')
    `);
        let currentBalance = parseFloat(liquidityResult.rows[0].balance || 0);

        // 2. Get Expected Inflows (Accounts Receivable) grouped by week
        const inflowsResult = await db.query(`
      SELECT 
        DATE_TRUNC('week', due_date) as week,
        SUM(total_amount) as amount
      FROM customer_invoice
      WHERE payment_status IN ('PENDING', 'PARTIAL')
      AND status != 'CANCELLED'
      AND due_date >= CURRENT_DATE
      GROUP BY 1
      ORDER BY 1
    `);

        // 3. Get Expected Outflows (Accounts Payable) grouped by week
        const outflowsResult = await prisma.invoice.groupBy({
            by: ['due_date'],
            where: {
                status: { in: ['RECEIVED', 'APPROVED_FOR_PAYMENT'] },
                due_date: { gte: new Date() }
            },
            _sum: { total_amount: true }
        });

        // 4. Merge and Project
        const weeks = [];
        let runningBalance = currentBalance;

        for (let i = 0; i < 12; i++) {
            const weekDate = new Date();
            weekDate.setDate(weekDate.getDate() + (i * 7));
            const weekStr = weekDate.toISOString().split('T')[0];

            // Find inflows/outflows for this week
            const inflow = inflowsResult.rows.find(r =>
                new Date(r.week).getTime() >= weekDate.getTime() &&
                new Date(r.week).getTime() < weekDate.getTime() + (7 * 24 * 60 * 60 * 1000)
            )?.amount || 0;

            const outflow = outflowsResult
                .filter(r => r.due_date >= weekDate && r.due_date < new Date(weekDate.getTime() + (7 * 24 * 60 * 60 * 1000)))
                .reduce((sum, r) => sum + (r._sum.total_amount || 0), 0);

            runningBalance = runningBalance + parseFloat(inflow) - parseFloat(outflow);

            weeks.push({
                week: weekStr,
                inflow: parseFloat(inflow),
                outflow: parseFloat(outflow),
                projected_balance: runningBalance
            });
        }

        res.json({
            success: true,
            data: {
                current_liquidity: currentBalance,
                forecast: weeks
            }
        });
    } catch (error) {
        logger.error({ error: error.message }, 'Error generating cash forecast');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default { getCashForecast };
