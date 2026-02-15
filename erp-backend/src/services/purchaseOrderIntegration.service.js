// src/services/purchaseOrderIntegration.service.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import auditTrailService from './auditTrail.service.js';

const prisma = new PrismaClient();

/**
 * Purchase Order Integration Service
 * Handles three-way matching, GRN, and invoice processing
 */

/**
 * Create Goods Receipt Note (GRN)
 */
export const createGRN = async (grnData) => {
  try {
    const {
      po_id,
      received_items,
      received_by,
      received_date,
      quality_status = 'PENDING',
      notes,
      created_by = 'system'
    } = grnData;

    const grn = await prisma.$transaction(async (tx) => {
      // Create GRN header
      const goodsReceipt = await tx.goodsReceipt.create({
        data: {
          po_id,
          grn_no: `GRN-${Date.now()}`,
          received_by,
          received_date: received_date ? new Date(received_date) : new Date(),
          quality_status,
          notes,
          created_by,
          status: 'RECEIVED'
        }
      });

      // Create GRN items
      const grnItems = [];
      for (const item of received_items) {
        const grnItem = await tx.goodsReceiptItem.create({
          data: {
            grn_id: goodsReceipt.grn_id,
            po_item_id: item.po_item_id,
            material_id: item.material_id,
            product_id: item.product_id,
            quantity_received: item.quantity_received,
            quantity_accepted: item.quantity_accepted || item.quantity_received,
            quantity_rejected: item.quantity_rejected || 0,
            unit_price: item.unit_price,
            quality_status: item.quality_status || 'ACCEPTED',
            remarks: item.remarks
          }
        });

        grnItems.push(grnItem);

        // Log GRN creation
        await auditTrailService.logInventoryTransaction({
          user_id: created_by,
          action: 'GRN_CREATED',
          entity_type: 'goods_receipt',
          entity_id: goodsReceipt.grn_id,
          new_values: {
            grn_no: goodsReceipt.grn_no,
            po_id,
            quantity_received: item.quantity_received,
            quality_status: item.quality_status
          },
          reference_id: goodsReceipt.grn_id
        });
      }

      return { goodsReceipt, grnItems };
    });

    logger.info({
      grn_id: grn.goodsReceipt.grn_id,
      grn_no: grn.goodsReceipt.grn_no,
      po_id,
      items_count: grn.grnItems.length
    }, 'GRN created successfully');

    return grn;
  } catch (error) {
    logger.error({ error: error.message, grnData }, 'Failed to create GRN');
    throw error;
  }
};

/**
 * Perform three-way matching (PO, GRN, Invoice)
 */
export const performThreeWayMatch = async (matchingData) => {
  try {
    const {
      po_id,
      grn_id,
      invoice_id,
      matching_items,
      tolerance_percentage = 5,
      created_by = 'system'
    } = matchingData;

    const matchResults = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of matching_items) {
        const { po_item_id, grn_item_id, invoice_item_id } = item;

        // Get PO item details
        const poItem = await tx.purchaseOrderItem.findUnique({
          where: { po_item_id },
          include: { material: true, product: true }
        });

        // Get GRN item details
        const grnItem = await tx.goodsReceiptItem.findUnique({
          where: { grn_item_id }
        });

        // Get Invoice item details
        const invoiceItem = await tx.invoiceItem.findUnique({
          where: { invoice_item_id }
        });

        if (!poItem || !grnItem || !invoiceItem) {
          throw new Error(`Missing data for item matching: ${po_item_id}`);
        }

        // Perform matching calculations
        const poQuantity = poItem.quantity;
        const poUnitPrice = poItem.unit_price;
        const poTotal = poQuantity * poUnitPrice;

        const grnQuantity = grnItem.quantity_accepted;
        const grnUnitPrice = grnItem.unit_price;
        const grnTotal = grnQuantity * grnUnitPrice;

        const invoiceQuantity = invoiceItem.quantity;
        const invoiceUnitPrice = invoiceItem.unit_price;
        const invoiceTotal = invoiceQuantity * invoiceUnitPrice;

        // Calculate variances
        const quantityVariance = Math.abs(grnQuantity - invoiceQuantity);
        const priceVariance = Math.abs(grnUnitPrice - invoiceUnitPrice);
        const totalVariance = Math.abs(grnTotal - invoiceTotal);

        const quantityVariancePercent = (quantityVariance / grnQuantity) * 100;
        const priceVariancePercent = (priceVariance / grnUnitPrice) * 100;
        const totalVariancePercent = (totalVariance / grnTotal) * 100;

        // Determine match status
        let matchStatus = 'MATCHED';
        const exceptions = [];

        if (quantityVariancePercent > tolerance_percentage) {
          matchStatus = 'EXCEPTION';
          exceptions.push(`Quantity variance: ${quantityVariancePercent.toFixed(2)}%`);
        }

        if (priceVariancePercent > tolerance_percentage) {
          matchStatus = 'EXCEPTION';
          exceptions.push(`Price variance: ${priceVariancePercent.toFixed(2)}%`);
        }

        if (totalVariancePercent > tolerance_percentage) {
          matchStatus = 'EXCEPTION';
          exceptions.push(`Total variance: ${totalVariancePercent.toFixed(2)}%`);
        }

        // Create matching record
        const matchingRecord = await tx.threeWayMatch.create({
          data: {
            po_id,
            grn_id,
            invoice_id,
            po_item_id,
            grn_item_id,
            invoice_item_id,
            po_quantity: poQuantity,
            po_unit_price: poUnitPrice,
            po_total: poTotal,
            grn_quantity: grnQuantity,
            grn_unit_price: grnUnitPrice,
            grn_total: grnTotal,
            invoice_quantity: invoiceQuantity,
            invoice_unit_price: invoiceUnitPrice,
            invoice_total: invoiceTotal,
            quantity_variance: quantityVariance,
            price_variance: priceVariance,
            total_variance: totalVariance,
            quantity_variance_percent: quantityVariancePercent,
            price_variance_percent: priceVariancePercent,
            total_variance_percent: totalVariancePercent,
            match_status: matchStatus,
            exceptions: exceptions.join('; '),
            created_by,
            matched_at: new Date()
          }
        });

        results.push({
          matching_id: matchingRecord.matching_id,
          item_name: poItem.material?.name || poItem.product?.part_name,
          item_code: poItem.material?.material_code || poItem.product?.product_code,
          match_status: matchStatus,
          quantity_variance: quantityVariancePercent,
          price_variance: priceVariancePercent,
          total_variance: totalVariancePercent,
          exceptions: exceptions
        });
      }

      return results;
    });

    const matchedCount = matchResults.filter(r => r.match_status === 'MATCHED').length;
    const exceptionCount = matchResults.filter(r => r.match_status === 'EXCEPTION').length;

    logger.info({
      po_id,
      grn_id,
      invoice_id,
      total_items: matchResults.length,
      matched_count: matchedCount,
      exception_count: exceptionCount
    }, 'Three-way matching completed');

    return {
      po_id,
      grn_id,
      invoice_id,
      matching_results: matchResults,
      summary: {
        total_items: matchResults.length,
        matched_count: matchedCount,
        exception_count: exceptionCount,
        match_percentage: (matchedCount / matchResults.length) * 100
      }
    };
  } catch (error) {
    logger.error({ error: error.message, matchingData }, 'Failed to perform three-way matching');
    throw error;
  }
};

/**
 * Process invoice for payment
 */
export const processInvoice = async (invoiceData) => {
  try {
    const {
      invoice_id,
      payment_terms,
      due_date,
      payment_method,
      approved_by,
      approved_amount,
      created_by = 'system'
    } = invoiceData;

    const processedInvoice = await prisma.$transaction(async (tx) => {
      // Update invoice status
      const invoice = await tx.invoice.update({
        where: { invoice_id },
        data: {
          status: 'APPROVED_FOR_PAYMENT',
          payment_terms,
          due_date: due_date ? new Date(due_date) : null,
          payment_method,
          approved_by,
          approved_amount,
          approved_at: new Date()
        }
      });

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          invoice_id,
          amount: approved_amount,
          payment_method,
          payment_status: 'PENDING',
          due_date: due_date ? new Date(due_date) : null,
          created_by
        }
      });

      // Log invoice processing
      await auditTrailService.logInventoryTransaction({
        user_id: created_by,
        action: 'INVOICE_APPROVED',
        entity_type: 'invoice',
        entity_id: invoice_id,
        new_values: {
          status: 'APPROVED_FOR_PAYMENT',
          approved_amount,
          payment_terms
        },
        reference_id: payment.payment_id
      });

      return { invoice, payment };
    });

    logger.info({
      invoice_id,
      approved_amount,
      payment_id: processedInvoice.payment.payment_id
    }, 'Invoice processed for payment');

    return processedInvoice;
  } catch (error) {
    logger.error({ error: error.message, invoiceData }, 'Failed to process invoice');
    throw error;
  }
};

/**
 * Get purchase order status summary
 */
export const getPurchaseOrderStatus = async (poId) => {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { po_id: poId },
      include: {
        supplier: true,
        po_items: {
          include: {
            material: true,
            product: true
          }
        },
        goodsReceipts: {
          include: {
            goodsReceiptItems: true
          }
        },
        threeWayMatches: true,
        invoices: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Calculate status summary
    const totalItems = purchaseOrder.po_items.length;
    const totalOrderedQuantity = purchaseOrder.po_items.reduce((sum, item) => sum + item.quantity, 0);
    const totalOrderedValue = purchaseOrder.po_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    let totalReceivedQuantity = 0;
    let totalReceivedValue = 0;
    
    if (purchaseOrder.goodsReceipts.length > 0) {
      for (const grn of purchaseOrder.goodsReceipts) {
        for (const item of grn.goodsReceiptItems) {
          totalReceivedQuantity += item.quantity_accepted;
          totalReceivedValue += item.quantity_accepted * item.unit_price;
        }
      }
    }

    const totalInvoicedValue = purchaseOrder.invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPaidAmount = purchaseOrder.invoices.reduce((sum, inv) => 
      sum + inv.payments.reduce((paySum, pay) => paySum + pay.amount, 0), 0
    );

    const receiptPercentage = totalOrderedQuantity > 0 ? (totalReceivedQuantity / totalOrderedQuantity) * 100 : 0;
    const invoicePercentage = totalOrderedValue > 0 ? (totalInvoicedValue / totalOrderedValue) * 100 : 0;
    const paymentPercentage = totalInvoicedValue > 0 ? (totalPaidAmount / totalInvoicedValue) * 100 : 0;

    return {
      po_id: poId,
      po_no: purchaseOrder.po_no,
      supplier_name: purchaseOrder.supplier.supplier_name,
      status: purchaseOrder.status,
      summary: {
        total_items: totalItems,
        total_ordered_quantity: totalOrderedQuantity,
        total_ordered_value: totalOrderedValue,
        total_received_quantity: totalReceivedQuantity,
        total_received_value: totalReceivedValue,
        total_invoiced_value: totalInvoicedValue,
        total_paid_amount: totalPaidAmount,
        receipt_percentage: receiptPercentage,
        invoice_percentage: invoicePercentage,
        payment_percentage: paymentPercentage
      },
      milestones: {
        grns_created: purchaseOrder.goodsReceipts.length,
        matching_completed: purchaseOrder.threeWayMatches.length,
        invoices_received: purchaseOrder.invoices.length,
        payments_made: purchaseOrder.invoices.reduce((sum, inv) => sum + inv.payments.length, 0)
      }
    };
  } catch (error) {
    logger.error({ error: error.message, po_id: poId }, 'Failed to get purchase order status');
    throw error;
  }
};

export default {
  createGRN,
  performThreeWayMatch,
  processInvoice,
  getPurchaseOrderStatus
};
