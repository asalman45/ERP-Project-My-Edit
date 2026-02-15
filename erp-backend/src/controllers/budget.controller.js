// src/controllers/budget.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Set or Update Budget for an account
 * POST /api/finance/budgets
 */
export async function setBudget(req, res) {
    const { account_id, fiscal_year, amount, notes } = req.body;
    try {
        const budget = await prisma.budget.upsert({
            where: {
                account_id_fiscal_year: {
                    account_id,
                    fiscal_year
                }
            },
            update: { amount, notes },
            create: { account_id, fiscal_year, amount, notes }
        });
        res.json({ success: true, data: budget });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Check for Budget Variances and create alerts
 * POST /api/finance/budgets/check-variances
 */
export async function checkBudgetVariances(req, res) {
    const { fiscal_year } = req.body;
    try {
        const budgets = await prisma.budget.findMany({
            where: { fiscal_year },
            include: {
                account: {
                    include: {
                        journalLines: {
                            include: { entry: true }
                        }
                    }
                }
            }
        });

        const alerts = [];
        for (const b of budgets) {
            const actual = b.account.journalLines.reduce((sum, line) => {
                // Only posted entries within the fiscal year timeframe (simplified check here)
                if (line.entry.status === 'POSTED') {
                    return sum + (parseFloat(line.debit) - parseFloat(line.credit));
                }
                return sum;
            }, 0);

            const threshold = parseFloat(b.amount);
            if (actual > threshold) {
                const message = `Budget exceeded for ${b.account.name}. Budget: ₹${threshold}, Actual: ₹${actual}`;

                // Create Notification
                const notification = await prisma.notification.create({
                    data: {
                        type: 'BUDGET_EXCEEDED',
                        title: 'Budget Alert',
                        message,
                        severity: 'WARNING'
                    }
                });

                alerts.push({ account: b.account.name, actual, budget: threshold, notification });
            }
        }

        res.json({ success: true, alerts_created: alerts.length, data: alerts });
    } catch (error) {
        logger.error({ error: error.message }, 'Error checking budget variances');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get all notifications
 * GET /api/finance/notifications
 */
export async function getNotifications(req, res) {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    setBudget,
    checkBudgetVariances,
    getNotifications
};
