// src/controllers/crm.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Lead Management
 */
export async function getLeads(req, res) {
    try {
        const leads = await prisma.lead.findMany({
            include: { opportunities: true, _count: { select: { activities: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function createLead(req, res) {
    const { title, company, contact_name, email, phone, source } = req.body;
    try {
        const lead = await prisma.lead.create({
            data: { title, company, contact_name, email, phone, source }
        });
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Opportunity Pipeline
 */
export async function getOpportunities(req, res) {
    try {
        const opportunities = await prisma.opportunity.findMany({
            include: {
                lead: true,
                customer: true,
                _count: { select: { quotations: true } }
            },
            orderBy: { deal_value: 'desc' }
        });
        res.json({ success: true, data: opportunities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function createOpportunity(req, res) {
    const { lead_id, customer_id, title, deal_value, close_date } = req.body;
    try {
        const opp = await prisma.opportunity.create({
            data: { lead_id, customer_id, title, deal_value, close_date, probability: 10, stage: 'DISCOVERY' }
        });
        res.json({ success: true, data: opp });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function updateOpportunityStage(req, res) {
    const { oppId } = req.params;
    const { stage, probability, status } = req.body;
    try {
        const opp = await prisma.opportunity.update({
            where: { opp_id: oppId },
            data: { stage, probability, status }
        });
        res.json({ success: true, data: opp });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Sales Activities (CRM Tasks/Interactions)
 */
export async function logActivity(req, res) {
    const { lead_id, opp_id, customer_id, type, subject, description, created_by } = req.body;
    try {
        const activity = await prisma.cRMActivity.create({
            data: { lead_id, opp_id, customer_id, type, subject, description, created_by }
        });
        res.json({ success: true, data: activity });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getActivities(req, res) {
    const { lead_id, opp_id, customer_id } = req.query;
    try {
        const activities = await prisma.cRMActivity.findMany({
            where: {
                OR: [
                    { lead_id: lead_id || undefined },
                    { opp_id: opp_id || undefined },
                    { customer_id: customer_id || undefined }
                ]
            },
            orderBy: { activity_date: 'desc' }
        });
        res.json({ success: true, data: activities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getLeads,
    createLead,
    getOpportunities,
    createOpportunity,
    updateOpportunityStage,
    logActivity,
    getActivities
};
