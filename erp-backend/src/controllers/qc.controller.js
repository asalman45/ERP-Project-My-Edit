// src/controllers/qc.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * QC Standard Management
 */
export async function createQCStandard(req, res) {
    const { product_id, name, min_value, max_value, target_value, unit, description } = req.body;
    try {
        const standard = await prisma.qCStandard.create({
            data: { product_id, name, min_value, max_value, target_value, unit, description }
        });
        res.json({ success: true, data: standard });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getQCStandards(req, res) {
    try {
        const standards = await prisma.qCStandard.findMany({
            include: { product: true },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: standards });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * QC Inspection Management
 */
export async function performInspection(req, res) {
    const { standard_id, reference_id, batch_id, inspector_id, measured_value, notes } = req.body;
    try {
        const standard = await prisma.qCStandard.findUnique({ where: { standard_id } });
        if (!standard) return res.status(404).json({ success: false, error: 'Standard not found' });

        let result = 'PASSED';
        if (measured_value !== undefined) {
            if ((standard.min_value !== null && measured_value < standard.min_value) ||
                (standard.max_value !== null && measured_value > standard.max_value)) {
                result = 'FAILED';
            }
        }

        const inspection = await prisma.qCInspection.create({
            data: { standard_id, reference_id, batch_id, inspector_id, measured_value, result, notes }
        });
        res.json({ success: true, data: inspection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getQCInspections(req, res) {
    try {
        const inspections = await prisma.qCInspection.findMany({
            include: { standard: { include: { product: true } }, rejections: true },
            orderBy: { inspected_at: 'desc' }
        });
        res.json({ success: true, data: inspections });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Rejection Logging
 */
export async function logRejection(req, res) {
    const { inspection_id, reason, quantity, action_taken } = req.body;
    try {
        const rejection = await prisma.qCRejectionLog.create({
            data: { inspection_id, reason, quantity, action_taken }
        });
        res.json({ success: true, data: rejection });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getQCAnalytics(req, res) {
    try {
        const total = await prisma.qCInspection.count();
        const passed = await prisma.qCInspection.count({ where: { result: 'PASSED' } });
        const failed = await prisma.qCInspection.count({ where: { result: 'FAILED' } });
        const rejectionVolume = await prisma.qCRejectionLog.aggregate({ _sum: { quantity: true } });

        res.json({
            success: true,
            data: {
                total,
                passed,
                failed,
                yieldRate: total > 0 ? (passed / total) * 100 : 0,
                rejectionVolume: rejectionVolume._sum.quantity || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    createQCStandard,
    getQCStandards,
    performInspection,
    getQCInspections,
    logRejection,
    getQCAnalytics
};
