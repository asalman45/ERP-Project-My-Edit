// src/controllers/returns.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * ==========================================
 * RETURNS MANAGEMENT (RMA & Purchase Returns)
 * ==========================================
 */

/**
 * Create Customer Return (RMA)
 * Handles items returned by customers.
 * Adjusts inventory back into stock (or quarantine) and lowers Accounts Receivable.
 */
export async function createSalesReturn(req, res) {
  const { so_id, items, reason, return_to_status = 'QUARANTINE' } = req.body;
  // items: [{ product_id, quantity, unit_price }]

  if (!so_id || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Sales Order ID and items are required.' });
  }

  try {
    const rmaResult = await prisma.$transaction(async (tx) => {
      let totalRmaValue = 0;

      // 1. Process Inventory Returns
      for (const item of items) {
        totalRmaValue += (Number(item.quantity) * Number(item.unit_price));

        // Find existing inventory record or create one for the return status
        let inventory = await tx.inventory.findFirst({
          where: { product_id: item.product_id, status: return_to_status }
        });

        if (inventory) {
          await tx.inventory.update({
            where: { inventory_id: inventory.inventory_id },
            data: { quantity: { increment: item.quantity } }
          });
        } else {
          inventory = await tx.inventory.create({
            data: {
              product_id: item.product_id,
              quantity: item.quantity,
              status: return_to_status,
              location_id: null // Assuming a default returns location if needed
            }
          });
        }

        // Log the return transaction
        await tx.inventoryTransaction.create({
          data: {
            inventory_id: inventory.inventory_id,
            txn_type: 'RETURN',
            quantity: item.quantity,
            reference: `RMA for SO: ${so_id}`,
            created_by: 'System'
          }
        });
      }

      // 2. Adjust Financial Ledger (Credit Note simulation)
      // Debit Sales Returns (Contra Revenue), Credit Accounts Receivable
      const arAccount = await tx.financialAccount.findFirst({ where: { category: 'ACCOUNTS_RECEIVABLE' } });
      const salesReturnAccount = await tx.financialAccount.findFirst({ where: { name: { contains: 'Sales Return', mode: 'insensitive' } } });

      if (arAccount && salesReturnAccount) {
        await tx.journalEntry.create({
          data: {
            entry_date: new Date(),
            reference: `RMA-${so_id.substring(0, 8)}`,
            description: `Customer Return RMA: ${reason}`,
            lines: {
              create: [
                { account_id: salesReturnAccount.account_id, debit: totalRmaValue, credit: 0, description: 'Sales Return Debit' },
                { account_id: arAccount.account_id, debit: 0, credit: totalRmaValue, description: 'AR Credit (Reduction)' }
              ]
            }
          }
        });
      }

      return { totalRmaValue, items_processed: items.length };
    });

    res.json({ success: true, message: 'Sales return processed successfully', data: rmaResult });

  } catch (error) {
    logger.error({ error: error.message }, 'Error processing Sales Return');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Create Purchase Return (Debit Note)
 * Handles items returned to suppliers.
 * Removes from inventory and adjusts Accounts Payable.
 */
export async function createPurchaseReturn(req, res) {
  const { po_id, items, reason } = req.body;
  // items: [{ material_id, quantity, unit_price }]

  if (!po_id || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Purchase Order ID and items are required.' });
  }

  try {
    const returnResult = await prisma.$transaction(async (tx) => {
      let totalReturnValue = 0;

      // 1. Process Inventory Removal
      for (const item of items) {
        totalReturnValue += (Number(item.quantity) * Number(item.unit_price));

        const inventory = await tx.inventory.findFirst({
          where: { material_id: item.material_id, quantity: { gte: item.quantity } }
        });

        if (!inventory) {
          throw new Error(`Insufficient inventory to return for material ID: ${item.material_id}`);
        }

        await tx.inventory.update({
          where: { inventory_id: inventory.inventory_id },
          data: { quantity: { decrement: item.quantity } }
        });

        // Log transaction
        await tx.inventoryTransaction.create({
          data: {
            inventory_id: inventory.inventory_id,
            txn_type: 'RETURN',
            quantity: -item.quantity,
            reference: `RTM for PO: ${po_id}`,
            created_by: 'System'
          }
        });
      }

      // 2. Adjust Financial Ledger (Debit Note simulation)
      // Debit Accounts Payable (Reduction), Credit Inventory
      const apAccount = await tx.financialAccount.findFirst({ where: { category: 'ACCOUNTS_PAYABLE' } });
      const inventoryAccount = await tx.financialAccount.findFirst({ where: { category: 'INVENTORY' } });

      if (apAccount && inventoryAccount) {
        await tx.journalEntry.create({
          data: {
            entry_date: new Date(),
            reference: `DN-${po_id.substring(0, 8)}`,
            description: `Purchase Return Debit Note: ${reason}`,
            lines: {
              create: [
                { account_id: apAccount.account_id, debit: totalReturnValue, credit: 0, description: 'AP Debit (Reduction)' },
                { account_id: inventoryAccount.account_id, debit: 0, credit: totalReturnValue, description: 'Inventory Credit (Reduction)' }
              ]
            }
          }
        });
      }

      return { totalReturnValue, items_processed: items.length };
    });

    res.json({ success: true, message: 'Purchase return processed successfully', data: returnResult });

  } catch (error) {
    logger.error({ error: error.message }, 'Error processing Purchase Return');
    res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
