// src/controllers/quotation.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Quotation Management
 */
export async function createQuotation(req, res) {
    const { opp_id, customer_id, items, valid_until, terms } = req.body;
    try {
        // 1. Calculate total
        const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

        // 2. Generate Quote Number
        const count = await prisma.quotation.count();
        const quote_no = `QTN-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        // 3. Create Quotation and Items
        const quotation = await prisma.quotation.create({
            data: {
                quote_no,
                opp_id,
                customer_id,
                total_amount,
                valid_until: new Date(valid_until),
                terms,
                items: {
                    create: items.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        total_price: item.quantity * item.unit_price
                    }))
                }
            },
            include: { items: { include: { product: true } } }
        });

        res.json({ success: true, data: quotation });
    } catch (error) {
        logger.error({ error: error.message }, 'Error creating quotation');
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getQuotations(req, res) {
    try {
        const quotations = await prisma.quotation.findMany({
            include: { customer: true, opportunity: true, items: true },
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: quotations });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function updateQuotationStatus(req, res) {
    const { quoteId } = req.params;
    const { status } = req.body;
    try {
        const quote = await prisma.quotation.update({
            where: { quote_id: quoteId },
            data: { status }
        });

        // If accepted, maybe auto-convert to Sales Order?
        // TODO: Implementation for SO conversion

        res.json({ success: true, data: quote });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Convert Quotation to Sales Order
 * POST /api/crm/quotations/convert/:quoteId
 */
export async function convertToSalesOrder(req, res) {
    const { quoteId } = req.params;
    try {
        const quote = await prisma.quotation.findUnique({
            where: { quote_id: quoteId },
            include: { items: true }
        });

        if (!quote) return res.status(404).json({ success: false, error: 'Quotation not found' });
        if (quote.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, error: 'Only ACCEPTED quotations can be converted' });
        }

        // 1. Generate SO Number
        const soCount = await prisma.salesOrder.count();
        const so_no = `SO-${new Date().getFullYear()}-${(soCount + 1).toString().padStart(4, '0')}`;

        // 2. Create Sales Order
        const salesOrder = await prisma.salesOrder.create({
            data: {
                so_no,
                customer_id: quote.customer_id,
                quote_id: quote.quote_id,
                status: 'OPEN',
                items: {
                    create: quote.items.map(item => ({
                        product_id: item.product_id,
                        qty_ordered: item.quantity,
                        qty_shipped: 0
                    }))
                }
            }
        });

        // 3. Mark quote as CLOSED
        await prisma.quotation.update({
            where: { quote_id: quoteId },
            data: { status: 'PROCESSED' }
        });

        // 4. Log to Audit Trail
        await prisma.auditLog.create({
            data: {
                user_id: req.user?.id || 'system',
                action: 'CONVERT_QUOTE_TO_SO',
                entity_type: 'salesOrder',
                entity_id: salesOrder.so_id,
                reference_id: quote.quote_id,
                new_values: JSON.stringify({ so_no: salesOrder.so_no, quote_no: quote.quote_no }),
                timestamp: new Date()
            }
        });

        res.json({ success: true, data: salesOrder });
    } catch (error) {
        logger.error({ error: error.message }, 'Conversion failed');
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    createQuotation,
    getQuotations,
    updateQuotationStatus,
    convertToSalesOrder
};
