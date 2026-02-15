// src/controllers/fixedAsset.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Register a new fixed asset
 * POST /api/finance/fixed-assets
 */
export async function registerAsset(req, res) {
    const {
        asset_code, name, category, purchase_date, purchase_cost,
        salvage_value, useful_life_years, account_id
    } = req.body;

    try {
        const asset = await prisma.fixedAsset.create({
            data: {
                asset_code,
                name,
                category,
                purchase_date: new Date(purchase_date),
                purchase_cost,
                salvage_value: salvage_value || 0,
                useful_life_years,
                current_value: purchase_cost,
                account_id
            }
        });

        res.json({ success: true, data: asset });
    } catch (error) {
        logger.error({ error: error.message }, 'Error registering fixed asset');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Automate depreciation calculation for a period
 * POST /api/finance/fixed-assets/depreciate
 */
export async function runDepreciation(req, res) {
    const { endDate } = req.body; // e.g., month end
    const end = endDate ? new Date(endDate) : new Date();

    try {
        const assets = await prisma.fixedAsset.findMany({
            where: { status: 'ACTIVE' }
        });

        const logs = [];

        for (const asset of assets) {
            // Simple Straight Line: (Cost - Salvage) / (Life * 12 months)
            const monthlyDepreciation = (parseFloat(asset.purchase_cost) - parseFloat(asset.salvage_value)) / (asset.useful_life_years * 12);

            // Prevent over-depreciating below salvage value
            const remainingValue = parseFloat(asset.current_value) - parseFloat(asset.salvage_value);
            const depreciationAmount = Math.min(monthlyDepreciation, remainingValue);

            if (depreciationAmount > 0) {
                // 1. Log depreciation
                await prisma.depreciationLog.create({
                    data: {
                        asset_id: asset.asset_id,
                        depreciation_date: end,
                        amount: depreciationAmount,
                        description: `Monthly depreciation for ${end.toLocaleString('default', { month: 'long', year: 'numeric' })}`
                    }
                });

                // 2. Update asset current value
                await prisma.fixedAsset.update({
                    where: { asset_id: asset.asset_id },
                    data: {
                        current_value: parseFloat(asset.current_value) - depreciationAmount
                    }
                });

                // 3. TODO: Auto-generate Journal Entry
                // Debit: Depreciation Expense
                // Credit: Accumulated Depreciation (or Asset account directly)

                logs.push({ asset_name: asset.name, amount: depreciationAmount });
            }
        }

        res.json({ success: true, processed: logs.length, summary: logs });
    } catch (error) {
        logger.error({ error: error.message }, 'Error running depreciation');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    registerAsset,
    runDepreciation
};
