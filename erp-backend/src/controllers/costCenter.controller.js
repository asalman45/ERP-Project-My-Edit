// src/controllers/costCenter.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Get all cost centers with their spending summary
 * GET /api/finance/cost-centers
 */
export async function getCostCenters(req, res) {
    try {
        const centers = await prisma.costCenter.findMany({
            include: {
                journalLines: {
                    include: { account: true }
                }
            }
        });

        const summary = centers.map(c => {
            const totalExpense = c.journalLines
                .filter(l => l.account.type === 'EXPENSE')
                .reduce((sum, l) => sum + (parseFloat(l.debit) - parseFloat(l.credit)), 0);

            return {
                center_id: c.center_id,
                code: c.code,
                name: c.name,
                total_expense: totalExpense,
                transaction_count: c.journalLines.length
            };
        });

        res.json({ success: true, data: summary });
    } catch (error) {
        logger.error({ error: error.message }, 'Error fetching cost centers');
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}

/**
 * Create a new cost center
 * POST /api/finance/cost-centers
 */
export async function createCostCenter(req, res) {
    const { code, name, description } = req.body;
    try {
        const center = await prisma.costCenter.create({
            data: { code, name, description }
        });
        res.json({ success: true, data: center });
    } catch (error) {
        logger.error({ error: error.message }, 'Error creating cost center');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getCostCenters,
    createCostCenter
};
