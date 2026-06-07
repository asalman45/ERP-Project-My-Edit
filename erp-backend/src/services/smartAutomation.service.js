import db from '../utils/db.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * TRIGGER 1 & 2: Automated Backflushing & Smart COGS
 */
export async function executeProductionBackflushAndCogs(woId) {
  logger.info({ woId }, 'Executing Smart Backflush & COGS Calculation for WP');
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get Work Order
    const woResult = await client.query('SELECT * FROM work_order WHERE wo_id = $1', [woId]);
    if (woResult.rows.length === 0) throw new Error('Work order not found');
    const wo = woResult.rows[0];

    // If already fully completed, we shouldn't backflush again, but assumption is this is called exactly once upon completion.

    // 2. Get BOM for backflush & RM Cost
    const bomResult = await client.query('SELECT * FROM bom WHERE product_id = $1', [wo.product_id]);
    const boms = bomResult.rows;

    let totalRmCost = 0;

    for (const bom of boms) {
      const quantityToDeduct = parseFloat(bom.quantity) * parseFloat(wo.quantity);

      // Deduct Inventory (Trigger 1)
      await client.query(`
        INSERT INTO inventory_txn 
        (txn_id, material_id, wo_id, txn_type, quantity, reference, created_by, created_at)
        VALUES ($1, $2, $3, 'ISSUE', $4, $5, 'SmartERP', CURRENT_TIMESTAMP)
      `, [uuidv4(), bom.material_id, wo.wo_id, quantityToDeduct, `Auto-Backflush for WO ${wo.wo_no}`]);

      // Reduce stock in Ledger
      await client.query(`
        INSERT INTO stock_ledger 
        (ledger_id, item_type, material_id, txn_type, quantity, reference, created_by, created_at)
        VALUES ($1, 'MATERIAL', $2, 'ISSUE', $4, $5, 'SmartERP', CURRENT_TIMESTAMP)
      `, [uuidv4(), bom.material_id, quantityToDeduct, `Auto-Backflush for WO ${wo.wo_no}`]);

      // Actual physical inventory deduction
      const invUpdateResult = await client.query(`
        UPDATE inventory 
        SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
        WHERE material_id = $2
        RETURNING quantity
      `, [quantityToDeduct, bom.material_id]);

      if (invUpdateResult.rows.length === 0) {
        throw new Error(`Insufficient Raw Material: No stock found for material ${bom.material_id}`);
      }

      for (const row of invUpdateResult.rows) {
        if (parseFloat(row.quantity) < 0) {
          throw new Error("Insufficient Raw Material");
        }
      }

      // Calculate Cost
      const costResult = await client.query(`SELECT standard_cost FROM standard_cost_ledger WHERE material_id = $1 ORDER BY effective_date DESC LIMIT 1`, [bom.material_id]);
      if (costResult.rows.length > 0) {
        totalRmCost += parseFloat(costResult.rows[0].standard_cost) * quantityToDeduct;
      }
    }

    // 3. Get Routings & Work Center Rates (Trigger 2 - COGS)
    const routingsResult = await client.query('SELECT * FROM routing WHERE product_id = $1', [wo.product_id]);
    let totalLaborOverheadCost = 0;

    for (const routing of routingsResult.rows) {
      // Find Work center rate
      const rateResult = await client.query(`
        SELECT hourly_labor_rate, hourly_overhead_rate 
        FROM work_center_rate 
        WHERE process_name ILIKE $1 
        ORDER BY effective_date DESC LIMIT 1
      `, [`%${routing.operation}%`]);

      if (rateResult.rows.length > 0) {
        const rate = rateResult.rows[0];
        const labor = parseFloat(rate.hourly_labor_rate || 0);
        const overhead = parseFloat(rate.hourly_overhead_rate || 0);

        // duration in routing usually in minutes. Fallback to 30 mins if null.
        const durationHours = routing.duration ? (parseFloat(routing.duration) / 60.0) : 0.5;
        totalLaborOverheadCost += (labor + overhead) * durationHours * parseFloat(wo.quantity);
      }
    }

    const finalCogs = totalRmCost + totalLaborOverheadCost;

    // Capitalize FG Inventory
    await client.query(`
      INSERT INTO inventory_txn 
      (txn_id, product_id, wo_id, txn_type, quantity, unit_cost, reference, created_by, created_at)
      VALUES ($1, $2, $3, 'RECEIVE', $4, $5, $6, 'SmartERP', CURRENT_TIMESTAMP)
    `, [uuidv4(), wo.product_id, wo.wo_id, wo.quantity, (finalCogs / wo.quantity), `Auto-FG-Cap for WO ${wo.wo_no}`]);

    await client.query(`
      INSERT INTO stock_ledger 
      (ledger_id, item_type, product_id, txn_type, quantity, unit_cost, total_cost, reference, created_by, created_at)
      VALUES ($1, 'PRODUCT', $2, 'RECEIVE', $3, $4, $5, $6, 'SmartERP', CURRENT_TIMESTAMP)
    `, [uuidv4(), wo.product_id, wo.quantity, (finalCogs / wo.quantity), finalCogs, `Auto-FG-Cap for WO ${wo.wo_no}`]);

    // Update/create physical finished goods inventory record
    const fgInvResult = await client.query(
      'SELECT inventory_id, quantity FROM inventory WHERE product_id = $1 LIMIT 1',
      [wo.product_id]
    );

    if (fgInvResult.rows.length > 0) {
      const existingInv = fgInvResult.rows[0];
      const newFgQty = parseFloat(existingInv.quantity) + parseFloat(wo.quantity);
      await client.query(
        'UPDATE inventory SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE inventory_id = $2',
        [newFgQty, existingInv.inventory_id]
      );
    } else {
      await client.query(
        `INSERT INTO inventory (inventory_id, product_id, quantity, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'AVAILABLE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [uuidv4(), wo.product_id, wo.quantity]
      );
    }

    await client.query('COMMIT');
    logger.info({ woId, finalCogs }, 'Successfully ran Auto-Backflush and Smart COGS');

    // Fire off Trigger 4 asynchronously
    setTimeout(() => checkMinimumStockAlerts().catch(e => logger.error({ e }, 'Trigger 4 Failed')), 100);

    return {
      success: true,
      cogs: finalCogs,
      rmCost: totalRmCost,
      laborOverhead: totalLaborOverheadCost
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, woId }, 'Failed Smart Backflush/COGS');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * TRIGGER 4: Minimum Stock Alerts (Procurement)
 */
export async function checkMinimumStockAlerts() {
  logger.info('Trigger 4: Checking Minimum Stock Alerts');
  const client = await db.pool.connect();

  try {
    // Check current stock levels vs min_stock for materials starting with EMCM
    const stockResult = await client.query(`
      SELECT m.material_id, m.material_code, m.name, m.min_stock, 
             COALESCE(SUM(CASE WHEN it.txn_type IN ('RECEIVE', 'RETURN', 'ADJUSTMENT_IN') THEN it.quantity ELSE 0 END) 
               - SUM(CASE WHEN it.txn_type IN ('ISSUE', 'ADJUSTMENT_OUT') THEN it.quantity ELSE 0 END), 0) as current_stock
      FROM material m
      LEFT JOIN inventory_txn it ON m.material_id = it.material_id
      WHERE m.material_code LIKE 'EMCM%' AND m.min_stock IS NOT NULL
      GROUP BY m.material_id, m.material_code, m.name, m.min_stock
      HAVING COALESCE(SUM(CASE WHEN it.txn_type IN ('RECEIVE', 'RETURN', 'ADJUSTMENT_IN') THEN it.quantity ELSE 0 END) 
               - SUM(CASE WHEN it.txn_type IN ('ISSUE', 'ADJUSTMENT_OUT') THEN it.quantity ELSE 0 END), 0) < m.min_stock
    `);

    for (const item of stockResult.rows) {
      if (item.current_stock < item.min_stock) {
        // Flag item and cross-reference SupplierMaterial
        const supMap = await client.query(`
          SELECT sm.supplier_id, s.name as supplier_name 
          FROM supplier_material sm 
          JOIN supplier s ON sm.supplier_id = s.supplier_id 
          WHERE sm.material_id = $1 AND sm.is_primary = true LIMIT 1
        `, [item.material_id]);

        if (supMap.rows.length > 0) {
          const supplierId = supMap.rows[0].supplier_id;
          const poQty = (item.min_stock * 2) - item.current_stock; // Simple reorder quantity logic

          await client.query(`
            INSERT INTO purchase_requisition 
            (pr_id, pr_no, requested_by, status, notes, created_at)
            VALUES ($1, $2, 'SmartERP AutoTrigger', 'OPEN', $3, CURRENT_TIMESTAMP)
            RETURNING pr_id
          `, [
            uuidv4(),
            `PR-AUTO-${Date.now()}`,
            `Auto-generated PR because ${item.material_code} fell to ${item.current_stock} (Min: ${item.min_stock}). Suggested Supplier: ${supMap.rows[0].supplier_name}`
          ]);
          logger.info(`Auto PR Generated for ${item.material_code}`);
        }
      }
    }
  } catch (error) {
    logger.error('Error in Minimum Stock Alerts Trigger:', error);
  } finally {
    client.release();
  }
}

/**
 * TRIGGER 3: Financial Auto-Posting
 * A: Supplier Invoice
 */
export async function autoPostSupplierInvoice(invoiceId) {
  logger.info({ invoiceId }, 'Trigger 3A: Financial Auto-Posting for Supplier Invoice');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const invRes = await client.query('SELECT * FROM invoice WHERE invoice_id = $1', [invoiceId]);
    if (invRes.rows.length === 0) return;
    const inv = invRes.rows[0];

    // Find AP and Inventory Accounts
    let apAcc = await client.query(`SELECT account_id FROM financial_account WHERE category = 'ACCOUNTS_PAYABLE' LIMIT 1`);
    if (apAcc.rows.length === 0) apAcc = await client.query(`INSERT INTO financial_account (account_id, code, name, type, category) VALUES ($1, '2000', 'Accounts Payable', 'LIABILITY', 'ACCOUNTS_PAYABLE') RETURNING account_id`, [uuidv4()]);

    let invAcc = await client.query(`SELECT account_id FROM financial_account WHERE category = 'INVENTORY' LIMIT 1`);
    if (invAcc.rows.length === 0) invAcc = await client.query(`INSERT INTO financial_account (account_id, code, name, type, category) VALUES ($1, '1300', 'Raw Materials Inventory', 'ASSET', 'INVENTORY') RETURNING account_id`, [uuidv4()]);

    const apAccountId = apAcc.rows[0].account_id;
    const invAccountId = invAcc.rows[0].account_id;

    const jId = uuidv4();
    const voucherNumber = `JV-PI-${Date.now().toString().slice(-6)}`;
    await client.query(`
      INSERT INTO journal_entry (entry_id, voucher_number, reference, description, status, created_by, created_at)
      VALUES ($1, $2, $3, $4, 'POSTED', 'SmartERP', CURRENT_TIMESTAMP)
    `, [jId, voucherNumber, inv.invoice_no, `Supplier Invoice ${inv.invoice_no}`]);

    // Credit AP
    await client.query(`INSERT INTO journal_line (line_id, entry_id, account_id, credit) VALUES ($1, $2, $3, $4)`, [uuidv4(), jId, apAccountId, inv.total_amount]);
    // Debit Inventory
    await client.query(`INSERT INTO journal_line (line_id, entry_id, account_id, debit) VALUES ($1, $2, $3, $4)`, [uuidv4(), jId, invAccountId, inv.total_amount]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, invoiceId }, 'Auto-Posting Failed');
  } finally {
    client.release();
  }
}

/**
 * TRIGGER 3: Financial Auto-Posting
 * B: Sales Invoice
 */
export async function autoPostSalesInvoice(invoiceId) {
  logger.info({ invoiceId }, 'Trigger 3B: Financial Auto-Posting for Sales Invoice');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const invRes = await client.query('SELECT * FROM customer_invoice WHERE invoice_id = $1', [invoiceId]);
    if (invRes.rows.length === 0) return;
    const inv = invRes.rows[0];

    // AR, Revenue, COGS, FG Inventory
    let arAcc = await client.query(`SELECT account_id FROM financial_account WHERE category = 'ACCOUNTS_RECEIVABLE' LIMIT 1`);
    if (arAcc.rows.length === 0) arAcc = await client.query(`INSERT INTO financial_account (account_id, code, name, type, category) VALUES ($1, '1200', 'Accounts Receivable', 'ASSET', 'ACCOUNTS_RECEIVABLE') RETURNING account_id`, [uuidv4()]);

    let revAcc = await client.query(`SELECT account_id FROM financial_account WHERE type = 'REVENUE' LIMIT 1`);
    if (revAcc.rows.length === 0) revAcc = await client.query(`INSERT INTO financial_account (account_id, code, name, type, category) VALUES ($1, '4000', 'Sales Revenue', 'REVENUE', 'OTHER_INCOME') RETURNING account_id`, [uuidv4()]);

    let taxAcc = await client.query(`SELECT account_id FROM financial_account WHERE name ILIKE '%GST%' OR name ILIKE '%Tax%' LIMIT 1`);
    if (taxAcc.rows.length === 0) taxAcc = await client.query(`INSERT INTO financial_account (account_id, code, name, type, category) VALUES ($1, '2200', 'GST Payable', 'LIABILITY', 'OTHER_EXPENSE') RETURNING account_id`, [uuidv4()]);

    let cogsAcc = await client.query(`SELECT account_id FROM financial_account WHERE category = 'COST_OF_GOODS_SOLD' LIMIT 1`);
    if (cogsAcc.rows.length === 0) cogsAcc = await client.query(`INSERT INTO financial_account (account_id, code, name, type, category) VALUES ($1, '5000', 'Cost of Goods Sold', 'EXPENSE', 'COST_OF_GOODS_SOLD') RETURNING account_id`, [uuidv4()]);

    let fgAcc = await client.query(`SELECT account_id FROM financial_account WHERE category = 'INVENTORY' LIMIT 1`);
    if (fgAcc.rows.length === 0) fgAcc = await client.query(`INSERT INTO financial_account (account_id, code, name, type, category) VALUES ($1, '1300', 'Finished Goods Inventory', 'ASSET', 'INVENTORY') RETURNING account_id`, [uuidv4()]);

    const jId = uuidv4();
    const voucherNumber = `JV-SI-${Date.now().toString().slice(-6)}`;
    await client.query(`
      INSERT INTO journal_entry (entry_id, voucher_number, reference, description, status, created_by, created_at)
      VALUES ($1, $2, $3, $4, 'POSTED', 'SmartERP', CURRENT_TIMESTAMP)
    `, [jId, voucherNumber, inv.invoice_no, `Sales Invoice ${inv.invoice_no}`]);

    // 1. Debit AR (Total Amount)
    await client.query(`INSERT INTO journal_line (line_id, entry_id, account_id, debit) VALUES ($1, $2, $3, $4)`, [uuidv4(), jId, arAcc.rows[0].account_id, inv.total_amount]);
    // 2. Credit Revenue (Subtotal)
    await client.query(`INSERT INTO journal_line (line_id, entry_id, account_id, credit) VALUES ($1, $2, $3, $4)`, [uuidv4(), jId, revAcc.rows[0].account_id, inv.subtotal]);
    // 3. Credit GST (Tax Amount)
    if (inv.tax_amount > 0) {
      await client.query(`INSERT INTO journal_line (line_id, entry_id, account_id, credit) VALUES ($1, $2, $3, $4)`, [uuidv4(), jId, taxAcc.rows[0].account_id, inv.tax_amount]);
    }

    // 4 & 5. Debit COGS & Credit FG Inventory
    const itemsRes = await client.query(`SELECT * FROM customer_invoice_item WHERE invoice_id = $1`, [invoiceId]);
    let totalCogs = 0;

    for (const item of itemsRes.rows) {
      if (item.product_id) {
        const costRes = await client.query(`SELECT standard_cost FROM standard_cost_ledger WHERE product_id = $1 ORDER BY effective_date DESC LIMIT 1`, [item.product_id]);
        if (costRes.rows.length > 0) {
          totalCogs += parseFloat(costRes.rows[0].standard_cost) * parseFloat(item.quantity);
        }
      }
    }

    if (totalCogs > 0) {
      await client.query(`INSERT INTO journal_line (line_id, entry_id, account_id, debit) VALUES ($1, $2, $3, $4)`, [uuidv4(), jId, cogsAcc.rows[0].account_id, totalCogs]);
      await client.query(`INSERT INTO journal_line (line_id, entry_id, account_id, credit) VALUES ($1, $2, $3, $4)`, [uuidv4(), jId, fgAcc.rows[0].account_id, totalCogs]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, invoiceId }, 'Auto-Posting Failed');
  } finally {
    client.release();
  }
}
