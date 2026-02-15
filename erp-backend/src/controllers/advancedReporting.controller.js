// src/controllers/advancedReporting.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Consolidated Profit & Loss Statement
 * GET /api/reports/advanced/p-and-l
 */
export async function getPandLReport(req, res) {
    const { startDate, endDate } = req.query;
    try {
        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        const journalLines = await prisma.journalLine.findMany({
            where: {
                entry: {
                    entry_date: { gte: start, lte: end },
                    status: 'POSTED'
                }
            },
            include: { account: true }
        });

        const report = {
            revenue: [],
            costOfGoodsSold: [],
            operatingExpenses: [],
            otherIncome: [],
            otherExpenses: [],
            summary: {
                totalRevenue: 0,
                totalCOGS: 0,
                grossProfit: 0,
                totalOperatingExpenses: 0,
                operatingIncome: 0,
                totalOtherIncome: 0,
                totalOtherExpenses: 0,
                netIncome: 0
            }
        };

        journalLines.forEach(line => {
            const amount = parseFloat(line.credit) - parseFloat(line.debit); // Revenue is usually credit
            const expenseAmount = parseFloat(line.debit) - parseFloat(line.credit); // Expense is usually debit

            if (line.account.type === 'REVENUE') {
                report.revenue.push({ name: line.account.name, amount });
                report.summary.totalRevenue += amount;
            } else if (line.account.category === 'COST_OF_GOODS_SOLD') {
                report.costOfGoodsSold.push({ name: line.account.name, amount: expenseAmount });
                report.summary.totalCOGS += expenseAmount;
            } else if (line.account.category === 'OPERATING_EXPENSE') {
                report.operatingExpenses.push({ name: line.account.name, amount: expenseAmount });
                report.summary.totalOperatingExpenses += expenseAmount;
            } else if (line.account.category === 'OTHER_INCOME') {
                report.otherIncome.push({ name: line.account.name, amount });
                report.summary.totalOtherIncome += amount;
            } else if (line.account.category === 'OTHER_EXPENSE') {
                report.otherExpenses.push({ name: line.account.name, amount: expenseAmount });
                report.summary.totalOtherExpenses += expenseAmount;
            }
        });

        // Consolidate duplicates by account name
        const consolidate = (arr) => {
            const map = new Map();
            arr.forEach(item => {
                map.set(item.name, (map.get(item.name) || 0) + item.amount);
            });
            return Array.from(map, ([name, amount]) => ({ name, amount }));
        };

        report.revenue = consolidate(report.revenue);
        report.costOfGoodsSold = consolidate(report.costOfGoodsSold);
        report.operatingExpenses = consolidate(report.operatingExpenses);

        report.summary.grossProfit = report.summary.totalRevenue - report.summary.totalCOGS;
        report.summary.operatingIncome = report.summary.grossProfit - report.summary.totalOperatingExpenses;
        report.summary.netIncome = report.summary.operatingIncome + report.summary.totalOtherIncome - report.summary.totalOtherExpenses;

        res.json({ success: true, data: report });
    } catch (error) {
        logger.error({ error: error.message }, 'Failed to generate P&L Report');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Departmental Overheads Report
 * GET /api/reports/advanced/overheads
 */
export async function getDepartmentalOverheads(req, res) {
    const { year } = req.query;
    try {
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        const lines = await prisma.journalLine.findMany({
            where: {
                cost_center_id: { not: null },
                account: { type: 'EXPENSE' },
                entry: {
                    entry_date: {
                        gte: new Date(currentYear, 0, 1),
                        lte: new Date(currentYear, 11, 31)
                    },
                    status: 'POSTED'
                }
            },
            include: { costCenter: true, account: true }
        });

        const departmentMap = new Map();

        lines.forEach(line => {
            const deptName = line.costCenter.name;
            const amount = parseFloat(line.debit) - parseFloat(line.credit);

            if (!departmentMap.has(deptName)) {
                departmentMap.set(deptName, { name: deptName, total: 0, accounts: new Map() });
            }

            const dept = departmentMap.get(deptName);
            dept.total += amount;

            const accName = line.account.name;
            dept.accounts.set(accName, (dept.accounts.get(accName) || 0) + amount);
        });

        const result = Array.from(departmentMap.values()).map(dept => ({
            ...dept,
            accounts: Array.from(dept.accounts, ([name, amount]) => ({ name, amount }))
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getPandLReport,
    getDepartmentalOverheads
};
