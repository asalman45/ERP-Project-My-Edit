// src/controllers/inventoryOperations.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * ==========================================
 * INVENTORY & OPERATIONS ENHANCEMENTS
 * ==========================================
 */

/**
 * Start Physical Inventory (Cycle Counting)
 * Prepares a snapshot of current inventory for manual counting.
 */
export async function startPhysicalInventory(req, res) {
  try {
    // For a real system, you might freeze inventory or create a "Count Header"
    // Here we'll return a snapshot of all available inventory formatted for counting
    const inventory = await prisma.inventory.findMany({
      include: {
        product: true,
        material: true,
        location: true
      },
      orderBy: [
        { product_id: 'asc' },
        { material_id: 'asc' }
      ]
    });

    const snapshot = inventory.map(inv => ({
      inventory_id: inv.inventory_id,
      item_name: inv.product?.name || inv.material?.name || 'Unknown Item',
      item_type: inv.product ? 'Product' : 'Material',
      location: inv.location?.name || 'Main Warehouse',
      system_quantity: inv.quantity,
      status: inv.status,
      counted_quantity: null // To be filled by user
    }));

    res.json({ success: true, message: 'Physical inventory snapshot generated.', data: snapshot });
  } catch (error) {
    logger.error({ error: error.message }, 'Error starting physical inventory');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Submit Physical Inventory Counts
 * Takes user-submitted counts and generates adjustment transactions and journal entries.
 */
export async function submitCounts(req, res) {
  const { counts, notes } = req.body;
  // counts: [{ inventory_id, counted_quantity }]

  if (!counts || !Array.isArray(counts)) {
    return res.status(400).json({ success: false, error: 'Counts array is required.' });
  }

  try {
    const adjustmentResult = await prisma.$transaction(async (tx) => {
      let totalGainValue = 0;
      let totalLossValue = 0;
      let adjustmentsMade = 0;

      for (const count of counts) {
        if (count.counted_quantity === null || count.counted_quantity === undefined) continue;

        const systemInv = await tx.inventory.findUnique({
          where: { inventory_id: count.inventory_id },
          include: { 
            product: true, 
            material: true 
          }
        });

        if (!systemInv) continue;

        const difference = Number(count.counted_quantity) - Number(systemInv.quantity);
        
        if (difference !== 0) {
          adjustmentsMade++;
          // Estimate value of discrepancy. Assume standard cost or fallback to 0.
          const unitCost = systemInv.product?.price || systemInv.material?.cost_per_unit || 0;
          const discrepancyValue = Math.abs(difference) * Number(unitCost);

          if (difference > 0) {
            totalGainValue += discrepancyValue;
          } else {
            totalLossValue += discrepancyValue;
          }

          // Update inventory
          await tx.inventory.update({
            where: { inventory_id: count.inventory_id },
            data: { quantity: Number(count.counted_quantity) }
          });

          // Log transaction
          await tx.inventoryTransaction.create({
            data: {
              inventory_id: count.inventory_id,
              txn_type: 'ADJUSTMENT',
              quantity: difference,
              reference: `Cycle Count Adjustment: ${notes || 'N/A'}`,
              created_by: 'System'
            }
          });
        }
      }

      // If there are financial implications, generate Journal Entry
      if (totalGainValue > 0 || totalLossValue > 0) {
        const inventoryAccount = await tx.financialAccount.findFirst({ where: { category: 'INVENTORY' } });
        const adjustmentAccount = await tx.financialAccount.findFirst({ where: { name: { contains: 'Inventory Adjustment', mode: 'insensitive' } } });
        
        if (inventoryAccount && adjustmentAccount) {
          const lines = [];
          
          if (totalGainValue > 0) {
            // Gain: Debit Inventory, Credit Adjustment
            lines.push({ account_id: inventoryAccount.account_id, debit: totalGainValue, credit: 0, description: 'Inventory Count Gain' });
            lines.push({ account_id: adjustmentAccount.account_id, debit: 0, credit: totalGainValue, description: 'Inventory Count Gain' });
          }
          
          if (totalLossValue > 0) {
            // Loss: Debit Adjustment, Credit Inventory
            lines.push({ account_id: adjustmentAccount.account_id, debit: totalLossValue, credit: 0, description: 'Inventory Count Loss' });
            lines.push({ account_id: inventoryAccount.account_id, debit: 0, credit: totalLossValue, description: 'Inventory Count Loss' });
          }

          await tx.journalEntry.create({
            data: {
              entry_date: new Date(),
              reference: `CC-${new Date().getTime().toString().slice(-6)}`,
              description: `Cycle Count Inventory Adjustments: ${notes || ''}`,
              lines: { create: lines }
            }
          });
        }
      }

      return { adjustmentsMade, totalGainValue, totalLossValue };
    });

    res.json({ success: true, message: 'Counts submitted and adjustments processed.', data: adjustmentResult });

  } catch (error) {
    logger.error({ error: error.message }, 'Error submitting counts');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Log Machine Downtime
 * Tracks production equipment unavailablity for Maintenance / OEE calculation.
 */
export async function logMachineDowntime(req, res) {
  const { asset_id, start_time, end_time, reason_code, description } = req.body;

  if (!asset_id || !start_time || !reason_code) {
    return res.status(400).json({ success: false, error: 'Asset ID, start time, and reason code are required.' });
  }

  try {
    // Check if MaintenanceLog table exists in schema for this. If not, we will simulate or use it.
    // Let's use the newly created MaintenanceLog in the schema.
    const serviceDate = start_time ? new Date(start_time) : new Date();
    
    let downtimeHours = 0;
    if (end_time) {
       downtimeHours = (new Date(end_time) - new Date(start_time)) / (1000 * 60 * 60);
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        asset_id,
        service_date: serviceDate,
        service_type: 'BREAKDOWN',
        description: `[${reason_code}] ${description || 'Machine Downtime'}`,
        performed_by: 'Operator/System',
        downtime_hours: downtimeHours,
        status: end_time ? 'COMPLETED' : 'PENDING'
      }
    });

    res.json({ success: true, message: 'Machine downtime logged.', data: log });
  } catch (error) {
    logger.error({ error: error.message }, 'Error logging machine downtime');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
