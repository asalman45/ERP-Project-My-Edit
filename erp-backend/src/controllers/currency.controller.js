// src/controllers/currency.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Get all supported currencies
 * GET /api/finance/currencies
 */
export async function getCurrencies(req, res) {
    try {
        const currencies = await prisma.currency.findMany({
            orderBy: { code: 'asc' }
        });
        res.json({ success: true, data: currencies });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Update exchange rate for a currency
 * POST /api/finance/currencies/update-rate
 */
export async function updateExchangeRate(req, res) {
    const { code, exchange_rate } = req.body;
    try {
        const currency = await prisma.currency.update({
            where: { code },
            data: { exchange_rate: parseFloat(exchange_rate) }
        });
        res.json({ success: true, data: currency });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Initialize base currencies (Post-migration)
 * POST /api/finance/currencies/init
 */
export async function initCurrencies(req, res) {
    try {
        const data = [
            { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchange_rate: 1.0, is_base: true },
            { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 83.25, is_base: false },
            { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate: 90.10, is_base: false },
            { code: 'GBP', name: 'British Pound', symbol: '£', exchange_rate: 105.40, is_base: false }
        ];

        for (const curr of data) {
            await prisma.currency.upsert({
                where: { code: curr.code },
                update: curr,
                create: curr
            });
        }

        res.json({ success: true, message: 'Currencies initialized' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getCurrencies,
    updateExchangeRate,
    initCurrencies
};
