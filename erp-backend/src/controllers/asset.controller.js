// src/controllers/asset.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Asset Management
 */
export async function getAssets(req, res) {
    try {
        const assets = await prisma.fixedAsset.findMany({
            include: { account: true, schedules: true, maintenanceLogs: true },
            orderBy: { asset_code: 'asc' }
        });
        res.json({ success: true, data: assets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Maintenance Scheduling
 */
export async function createMaintenanceSchedule(req, res) {
    const { asset_id, task_name, frequency_days, next_due_at, priority, instructions } = req.body;
    try {
        const schedule = await prisma.maintenanceSchedule.create({
            data: { asset_id, task_name, frequency_days, next_due_at: new Date(next_due_at), priority, instructions }
        });
        res.json({ success: true, data: schedule });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Log Maintenance Activity
 */
export async function logMaintenance(req, res) {
    const { asset_id, service_date, service_type, description, performed_by, cost, downtime_hours, schedule_id, account_id } = req.body;
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Log
            const log = await tx.maintenanceLog.create({
                data: { asset_id, service_date: new Date(service_date), service_type, description, performed_by, cost, downtime_hours }
            });

            // 2. If it was a scheduled task, update the schedule
            if (schedule_id) {
                const schedule = await tx.maintenanceSchedule.findUnique({ where: { schedule_id } });
                if (schedule) {
                    const nextDate = new Date();
                    nextDate.setDate(nextDate.getDate() + schedule.frequency_days);
                    await tx.maintenanceSchedule.update({
                        where: { schedule_id },
                        data: { last_done_at: new Date(), next_due_at: nextDate }
                    });
                }
            }

            // 3. Post expense to Ledger if cost > 0
            if (parseFloat(cost) > 0) {
                // Resolve target accounts dynamically
                const expenseAcc = await tx.financialAccount.findFirst({ where: { code: 'EXP-MAINT' } });
                const paymentAcc = await tx.financialAccount.findUnique({ where: { account_id } }) ||
                    await tx.financialAccount.findFirst({ where: { category: 'CASH' } });

                if (expenseAcc && paymentAcc) {
                    await tx.journalEntry.create({
                        data: {
                            reference: `MAINT-${log.log_id}`,
                            description: `Maintenance Cost - ${description}`,
                            lines: {
                                create: [
                                    { account_id: expenseAcc.account_id, debit: cost, credit: 0 },
                                    { account_id: paymentAcc.account_id, debit: 0, credit: cost }
                                ]
                            }
                        }
                    });
                } else {
                    logger.warn('Maintenance financial posting skipped: Target accounts not found');
                }
            }

            return log;
        });

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error({ error: error.message }, 'Failed to log maintenance');
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getUpcomingMaintenance(req, res) {
    try {
        const schedules = await prisma.maintenanceSchedule.findMany({
            where: { next_due_at: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }, // Next 7 days
            include: { asset: true },
            orderBy: { next_due_at: 'asc' }
        });
        res.json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getAssets,
    createMaintenanceSchedule,
    logMaintenance,
    getUpcomingMaintenance
};
