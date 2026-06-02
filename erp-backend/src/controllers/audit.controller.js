import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const getAuditLogs = async (req, res) => {
    try {
        const { entityType, entityId, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (entityType) where.entity_type = entityType;
        if (entityId) where.entity_id = entityId;

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: parseInt(limit, 10) || 50,
            skip: parseInt(offset, 10) || 0,
        });

        const total = await prisma.auditLog.count({ where });

        return res.json({
            success: true,
            data: logs,
            meta: {
                total,
                limit: parseInt(limit, 10) || 50,
                offset: parseInt(offset, 10) || 0,
            }
        });
    } catch (error) {
        logger.error({ error }, 'Failed to fetch audit logs');
        return res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
    }
};
