#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// EMPCL ERP – JANUARY 2026 GO-LIVE DATA INGESTION
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE:  Seed the production database with the client's final Go-Live data:
//           1. Work Center Rates
//           2. Financial Opening Balances (Opening JV)
//           3. Physical Inventory & Standard Costs
//           4. Carry-over Open Orders (POs / SOs)
//
// SAFETY:   Every step runs inside prisma.$transaction so any failure causes a
//           full rollback. Nothing is committed until the entire step succeeds.
//
// USAGE:    1. Paste the client's JSON data into the placeholder arrays below.
//           2. Run: node scripts/seed_jan2026_golive.js
//
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

// The Go-Live cutover date — all transactions will be dated to this point.
const GOLIVE_DATE = new Date('2026-01-01T00:00:00.000Z');

// ═══════════════════════════════════════════════════════════════════════════════
//  1. DATA PAYLOAD PLACEHOLDERS
//     Paste the client's final data into these arrays once received.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Work Center Rates
 * Each entry links to an existing WorkCenter by its `code` (e.g. "WC-PRESS").
 *
 * Example:
 *   { work_center_code: "WC-PRESS", process_name: "Stamping", labor_rate: 450.00, overhead_rate: 200.00 }
 *
 * Fields:
 *   work_center_code  – Must match an existing WorkCenter.code in the DB
 *   process_name      – The operation/process name for this rate row
 *   labor_rate        – Hourly labor rate in PKR
 *   overhead_rate     – Hourly overhead rate in PKR
 */
const workCenterRates = [
  // ── PASTE CLIENT DATA HERE ──────────────────────────────────────────────
  // { work_center_code: "WC-PRESS",   process_name: "Stamping",     labor_rate: 450.00, overhead_rate: 200.00 },
  // { work_center_code: "WC-WELD",    process_name: "MIG Welding",  labor_rate: 500.00, overhead_rate: 250.00 },
  // { work_center_code: "WC-PAINT",   process_name: "Powder Coat",  labor_rate: 400.00, overhead_rate: 180.00 },
];

/**
 * Financial Opening Balances
 * Each entry represents one line in the Opening Balance Journal Voucher.
 * The sum of all debit_amount values MUST exactly equal the sum of all credit_amount values.
 *
 * Example:
 *   { account_code: "1001", account_name: "Cash in Hand", debit_amount: 500000.00, credit_amount: 0.00 }
 *
 * Fields:
 *   account_code   – Must match an existing FinancialAccount.code in the DB
 *   account_name   – Just for reference/readability (not used for lookup)
 *   debit_amount   – Opening debit balance (Assets, Expenses)
 *   credit_amount  – Opening credit balance (Liabilities, Equity, Revenue)
 */
const financialOpeningBalances = [
  // ── PASTE CLIENT DATA HERE ──────────────────────────────────────────────
  // { account_code: "1001", account_name: "Cash in Hand",        debit_amount: 500000.00, credit_amount: 0.00       },
  // { account_code: "1002", account_name: "Bank – HBL",          debit_amount: 2500000.00, credit_amount: 0.00      },
  // { account_code: "2001", account_name: "Accounts Payable",    debit_amount: 0.00,       credit_amount: 1200000.00 },
  // { account_code: "3001", account_name: "Owner's Equity",      debit_amount: 0.00,       credit_amount: 1800000.00 },
];

/**
 * Inventory Opening Balances
 * Each entry represents the physical stock count as of January 1, 2026.
 * Provide EITHER product_code OR material_code, not both.
 *
 * Example:
 *   { material_code: "RM-MS-1.5", physical_qty: 2500, unit_cost: 180.00, location_code: "LOC-MAIN" }
 *
 * Fields:
 *   product_code   – Matches Product.product_code (for finished goods)
 *   material_code  – Matches Material.material_code (for raw materials)
 *   physical_qty   – Actual physical count on 01-Jan-2026
 *   unit_cost      – Per-unit cost (PKR) — also saved as standard cost
 *   location_code  – Matches Location.code (e.g. "LOC-MAIN", "LOC-FG-STORE")
 */
const inventoryOpeningBalances = [
  // ── PASTE CLIENT DATA HERE ──────────────────────────────────────────────
  // { material_code: "RM-MS-1.5",   physical_qty: 2500, unit_cost: 180.00, location_code: "LOC-MAIN"   },
  // { material_code: "RM-SS-304",   physical_qty: 800,  unit_cost: 650.00, location_code: "LOC-MAIN"   },
  // { product_code:  "FG-BRK-001",  physical_qty: 150,  unit_cost: 2200.00, location_code: "LOC-FG"    },
];

/**
 * Open Carry-over Orders (POs / SOs pending from previous system)
 * These are orders that were in progress as of cutover and need to exist in the new system.
 *
 * Example PO:
 *   { type: "PO", order_no: "PO-LEGACY-001", supplier_code: "SUP-001", expected_date: "2026-01-15", status: "OPEN",
 *     items: [{ material_code: "RM-MS-1.5", quantity: 500, unit_price: 180.00 }] }
 *
 * Example SO:
 *   { type: "SO", order_no: "SO-LEGACY-001", customer_code: "CUST-001", expected_date: "2026-01-20", status: "OPEN",
 *     items: [{ product_code: "FG-BRK-001", quantity: 100, unit_price: 3500.00 }] }
 *
 * Fields:
 *   type           – "PO" (Purchase Order) or "SO" (Sales Order)
 *   order_no       – Legacy order number
 *   supplier_code  – For POs: matches Supplier.code
 *   customer_code  – For SOs: matches Customer.code or Customer.customer_code
 *   expected_date  – Expected delivery date (ISO string)
 *   status         – Order status (OPEN, PARTIALLY_RECEIVED, etc.)
 *   items[]        – Line items with material_code/product_code, quantity, unit_price
 */
const openCarryoverOrders = [
  // ── PASTE CLIENT DATA HERE ──────────────────────────────────────────────
  // {
  //   type: "PO", order_no: "PO-LEGACY-001", supplier_code: "SUP-001",
  //   expected_date: "2026-01-15", status: "OPEN",
  //   items: [
  //     { material_code: "RM-MS-1.5", quantity: 500, unit_price: 180.00 },
  //   ]
  // },
  // {
  //   type: "SO", order_no: "SO-LEGACY-001", customer_code: "CUST-001",
  //   expected_date: "2026-01-20", status: "OPEN",
  //   items: [
  //     { product_code: "FG-BRK-001", quantity: 100, unit_price: 3500.00 },
  //   ]
  // },
];


// ═══════════════════════════════════════════════════════════════════════════════
//  STEP 1: INJECT WORK CENTER RATES
// ═══════════════════════════════════════════════════════════════════════════════

async function seedWorkCenterRates(tx) {
  if (workCenterRates.length === 0) {
    console.log('  ⏭️  Step 1: No work center rates provided — skipping.');
    return 0;
  }

  console.log(`  🔧 Step 1: Upserting ${workCenterRates.length} work center rate(s)...`);
  let upserted = 0;

  for (const rate of workCenterRates) {
    // Look up the WorkCenter by its code
    const wc = await tx.workCenter.findUnique({ where: { code: rate.work_center_code } });
    if (!wc) {
      throw new Error(`Work Center with code "${rate.work_center_code}" not found. Aborting.`);
    }

    await tx.workCenterRate.upsert({
      where: {
        work_center_id_process_name: {
          work_center_id: wc.work_center_id,
          process_name: rate.process_name,
        },
      },
      update: {
        hourly_labor_rate: rate.labor_rate,
        hourly_overhead_rate: rate.overhead_rate,
        effective_date: GOLIVE_DATE,
      },
      create: {
        work_center_id: wc.work_center_id,
        process_name: rate.process_name,
        hourly_labor_rate: rate.labor_rate,
        hourly_overhead_rate: rate.overhead_rate,
        effective_date: GOLIVE_DATE,
      },
    });

    upserted++;
    console.log(`     ✅ ${rate.work_center_code} → ${rate.process_name}  (₨${rate.labor_rate} labor, ₨${rate.overhead_rate} overhead)`);
  }

  console.log(`  ✅ Step 1 complete: ${upserted} rate(s) upserted.\n`);
  return upserted;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  STEP 2: POST FINANCIAL OPENING BALANCES
// ═══════════════════════════════════════════════════════════════════════════════

async function seedFinancialOpeningBalances(tx) {
  if (financialOpeningBalances.length === 0) {
    console.log('  ⏭️  Step 2: No financial opening balances provided — skipping.');
    return null;
  }

  console.log(`  💰 Step 2: Creating Opening Balance JV with ${financialOpeningBalances.length} line(s)...`);

  // ── Balance Validation ──────────────────────────────────────────────────
  const totalDebits = financialOpeningBalances.reduce((sum, b) => sum + (b.debit_amount || 0), 0);
  const totalCredits = financialOpeningBalances.reduce((sum, b) => sum + (b.credit_amount || 0), 0);

  // Use tolerance of 0.01 for floating point comparisons
  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    throw new Error(
      `BALANCE CHECK FAILED! Total Debits (₨${totalDebits.toFixed(2)}) ≠ Total Credits (₨${totalCredits.toFixed(2)}). ` +
      `Difference: ₨${Math.abs(totalDebits - totalCredits).toFixed(2)}. ` +
      `Please correct the financialOpeningBalances array and re-run.`
    );
  }

  console.log(`     📊 Total Debits:  ₨${totalDebits.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`);
  console.log(`     📊 Total Credits: ₨${totalCredits.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`);
  console.log(`     ✅ Balance check passed.`);

  // ── Resolve Account IDs ─────────────────────────────────────────────────
  const journalLines = [];

  for (const balance of financialOpeningBalances) {
    const account = await tx.financialAccount.findUnique({
      where: { code: balance.account_code },
    });

    if (!account) {
      throw new Error(
        `Financial Account code "${balance.account_code}" (${balance.account_name || 'unnamed'}) not found in Chart of Accounts. ` +
        `Please create the account first or correct the code.`
      );
    }

    // Only create a JournalLine if there's a non-zero amount
    if ((balance.debit_amount || 0) > 0 || (balance.credit_amount || 0) > 0) {
      journalLines.push({
        account_id: account.account_id,
        debit: balance.debit_amount || 0,
        credit: balance.credit_amount || 0,
        description: `Opening Balance – ${account.name}`,
      });
    }
  }

  // ── Create the Opening JV ───────────────────────────────────────────────
  const openingJV = await tx.journalEntry.create({
    data: {
      voucher_number: 'JV-OPENING-2026',
      entry_date: GOLIVE_DATE,
      reference: 'Go-Live Opening Balances',
      description: 'Opening balance entries as of 01-Jan-2026 — Production Data Cutover',
      status: 'POSTED',
      created_by: 'system',
      currency_code: 'PKR',
      exchange_rate: 1.0,
      lines: {
        create: journalLines,
      },
    },
    include: { lines: true },
  });

  console.log(`     📝 Journal Voucher: ${openingJV.voucher_number}`);
  console.log(`     📝 Journal Lines:   ${openingJV.lines.length}`);
  console.log(`  ✅ Step 2 complete: Opening Balance JV posted.\n`);
  return openingJV;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  STEP 3: INJECT PHYSICAL INVENTORY & STANDARD COSTS
// ═══════════════════════════════════════════════════════════════════════════════

async function seedInventoryOpeningBalances(tx) {
  if (inventoryOpeningBalances.length === 0) {
    console.log('  ⏭️  Step 3: No inventory opening balances provided — skipping.');
    return 0;
  }

  console.log(`  📦 Step 3: Injecting ${inventoryOpeningBalances.length} inventory opening balance(s)...`);
  let processed = 0;

  for (const inv of inventoryOpeningBalances) {
    // ── Resolve item (Product or Material) ──────────────────────────────
    let product_id = null;
    let material_id = null;
    let item_label = '';

    if (inv.product_code) {
      const product = await tx.product.findUnique({ where: { product_code: inv.product_code } });
      if (!product) throw new Error(`Product code "${inv.product_code}" not found.`);
      product_id = product.product_id;
      item_label = `Product: ${inv.product_code}`;
    } else if (inv.material_code) {
      const material = await tx.material.findUnique({ where: { material_code: inv.material_code } });
      if (!material) throw new Error(`Material code "${inv.material_code}" not found.`);
      material_id = material.material_id;
      item_label = `Material: ${inv.material_code}`;
    } else {
      throw new Error(`Row must have either product_code or material_code. Found: ${JSON.stringify(inv)}`);
    }

    // ── Resolve Location ────────────────────────────────────────────────
    let location_id = null;
    if (inv.location_code) {
      const loc = await tx.location.findUnique({ where: { code: inv.location_code } });
      if (!loc) throw new Error(`Location code "${inv.location_code}" not found.`);
      location_id = loc.location_id;
    }

    // ── 3a. Create Inventory Row (Physical Stock) ───────────────────────
    const inventoryRow = await tx.inventory.create({
      data: {
        product_id,
        material_id,
        quantity: inv.physical_qty,
        location_id,
        status: 'AVAILABLE',
      },
    });

    // ── 3b. Create InventoryTxn (Opening Balance Receipt) ───────────────
    await tx.inventoryTxn.create({
      data: {
        inventory_id: inventoryRow.inventory_id,
        product_id,
        material_id,
        txn_type: 'RECEIVE',
        quantity: inv.physical_qty,
        unit_cost: inv.unit_cost || null,
        location_id,
        reference: 'OPENING-BALANCE-JAN-2026',
        created_by: 'system',
        created_at: GOLIVE_DATE,
      },
    });

    // ── 3c. Create StandardCostLedger Entry ─────────────────────────────
    if (inv.unit_cost && inv.unit_cost > 0) {
      await tx.standardCostLedger.create({
        data: {
          product_id,
          material_id,
          effective_date: GOLIVE_DATE,
          standard_cost: inv.unit_cost,
          moving_average_cost: inv.unit_cost,
        },
      });
    }

    processed++;
    console.log(`     ✅ ${item_label.padEnd(30)} Qty: ${String(inv.physical_qty).padStart(8)}  Cost: ₨${(inv.unit_cost || 0).toFixed(2)}`);
  }

  console.log(`  ✅ Step 3 complete: ${processed} inventory row(s) created.\n`);
  return processed;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  STEP 4: INJECT CARRY-OVER OPEN ORDERS (POs / SOs)
// ═══════════════════════════════════════════════════════════════════════════════

async function seedCarryoverOrders(tx) {
  if (openCarryoverOrders.length === 0) {
    console.log('  ⏭️  Step 4: No carry-over orders provided — skipping.');
    return 0;
  }

  console.log(`  📋 Step 4: Injecting ${openCarryoverOrders.length} carry-over order(s)...`);
  let created = 0;

  for (const order of openCarryoverOrders) {
    if (order.type === 'PO') {
      // ── Purchase Order ──────────────────────────────────────────────
      const supplier = await tx.supplier.findFirst({
        where: { OR: [{ code: order.supplier_code }, { name: order.supplier_code }] },
      });
      if (!supplier) throw new Error(`Supplier "${order.supplier_code}" not found for PO ${order.order_no}.`);

      // Build PO items
      const poItems = [];
      for (const item of (order.items || [])) {
        let mat_id = null;
        let prod_id = null;

        if (item.material_code) {
          const mat = await tx.material.findUnique({ where: { material_code: item.material_code } });
          if (!mat) throw new Error(`Material "${item.material_code}" not found in PO ${order.order_no}.`);
          mat_id = mat.material_id;
        } else if (item.product_code) {
          const prod = await tx.product.findUnique({ where: { product_code: item.product_code } });
          if (!prod) throw new Error(`Product "${item.product_code}" not found in PO ${order.order_no}.`);
          prod_id = prod.product_id;
        }

        poItems.push({
          product_id: prod_id,
          material_id: mat_id,
          quantity: item.quantity,
          unit_price: item.unit_price || null,
          received_qty: 0,
        });
      }

      await tx.purchaseOrder.create({
        data: {
          po_no: order.order_no,
          supplier_id: supplier.supplier_id,
          order_date: GOLIVE_DATE,
          expected_date: order.expected_date ? new Date(order.expected_date) : null,
          status: order.status || 'OPEN',
          created_by: 'system',
          items: { create: poItems },
        },
      });

      console.log(`     ✅ PO ${order.order_no} → ${supplier.name || order.supplier_code}  (${poItems.length} item(s))`);

    } else if (order.type === 'SO') {
      // ── Sales Order ─────────────────────────────────────────────────
      const customer = await tx.customer.findFirst({
        where: {
          OR: [
            { code: order.customer_code },
            { customer_code: order.customer_code },
            { name: order.customer_code },
          ],
        },
      });
      if (!customer) throw new Error(`Customer "${order.customer_code}" not found for SO ${order.order_no}.`);

      // Build SO items
      const soItems = [];
      for (const item of (order.items || [])) {
        let prod_id = null;

        if (item.product_code) {
          const prod = await tx.product.findUnique({ where: { product_code: item.product_code } });
          if (!prod) throw new Error(`Product "${item.product_code}" not found in SO ${order.order_no}.`);
          prod_id = prod.product_id;
        }

        soItems.push({
          product_id: prod_id,
          item_name: item.product_code || 'Legacy Item',
          quantity: item.quantity,
          qty_ordered: item.quantity,
          unit_price: item.unit_price || null,
          line_total: item.quantity * (item.unit_price || 0),
        });
      }

      // Calculate SO total
      const soTotal = soItems.reduce((sum, i) => sum + (i.line_total || 0), 0);

      await tx.salesOrder.create({
        data: {
          so_no: order.order_no,
          customer_id: customer.customer_id,
          order_date: GOLIVE_DATE,
          expected_date: order.expected_date ? new Date(order.expected_date) : null,
          status: order.status || 'OPEN',
          total_amount: soTotal,
          created_by: 'system',
          items: { create: soItems },
        },
      });

      console.log(`     ✅ SO ${order.order_no} → ${customer.name || customer.company_name || order.customer_code}  (${soItems.length} item(s))`);

    } else {
      throw new Error(`Unknown order type "${order.type}" for order ${order.order_no}. Must be "PO" or "SO".`);
    }

    created++;
  }

  console.log(`  ✅ Step 4 complete: ${created} carry-over order(s) created.\n`);
  return created;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                        ║');
  console.log('║      EMPCL ERP – January 2026 Go-Live Data Ingestion Script            ║');
  console.log('║                                                                        ║');
  console.log('╠════════════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                        ║');
  console.log('║  This script will seed the production database with:                   ║');
  console.log('║                                                                        ║');
  console.log(`║  Step 1: Work Center Rates .............. ${String(workCenterRates.length).padStart(4)} row(s)               ║`);
  console.log(`║  Step 2: Financial Opening Balances ..... ${String(financialOpeningBalances.length).padStart(4)} row(s)               ║`);
  console.log(`║  Step 3: Physical Inventory Counts ...... ${String(inventoryOpeningBalances.length).padStart(4)} row(s)               ║`);
  console.log(`║  Step 4: Carry-over Orders (PO/SO) ..... ${String(openCarryoverOrders.length).padStart(4)} row(s)               ║`);
  console.log('║                                                                        ║');
  console.log('║  ⚠️  All steps run in a Prisma Transaction.                             ║');
  console.log('║  If ANY step fails, the ENTIRE ingestion rolls back.                   ║');
  console.log('║                                                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Check if there's any data to seed
  const totalRows = workCenterRates.length + financialOpeningBalances.length
    + inventoryOpeningBalances.length + openCarryoverOrders.length;

  if (totalRows === 0) {
    console.log('  ⚠️  All data arrays are empty. Please paste the client\'s Go-Live data');
    console.log('     into the placeholder arrays at the top of this script, then re-run.');
    console.log('');
    process.exit(0);
  }

  // ── Confirmation Prompt ──────────────────────────────────────────────────
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => {
    rl.question('  🔐 Type GOLIVE to proceed with data ingestion: ', resolve);
  });
  rl.close();

  if (answer !== 'GOLIVE') {
    console.log('\n  ❌ Aborted. No data was seeded.\n');
    process.exit(0);
  }

  console.log('\n  🚀 Starting Go-Live data ingestion...\n');
  const startTime = Date.now();

  // ── Execute ALL steps inside a single Prisma Interactive Transaction ────
  // Timeout: 120 seconds (large datasets may need time)
  try {
    const results = await prisma.$transaction(async (tx) => {
      const r1 = await seedWorkCenterRates(tx);
      const r2 = await seedFinancialOpeningBalances(tx);
      const r3 = await seedInventoryOpeningBalances(tx);
      const r4 = await seedCarryoverOrders(tx);

      return { rates: r1, jv: r2, inventory: r3, orders: r4 };
    }, {
      maxWait: 10000,   // Wait up to 10s for a connection
      timeout: 120000,  // 120s execution timeout
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    // ── Summary ───────────────────────────────────────────────────────
    console.log('');
    console.log('  ╔════════════════════════════════════════════════════════════╗');
    console.log('  ║              GO-LIVE INGESTION COMPLETE ✅                ║');
    console.log('  ╠════════════════════════════════════════════════════════════╣');
    console.log(`  ║  Work Center Rates upserted:    ${String(results.rates).padStart(6)}                  ║`);
    console.log(`  ║  Opening JV:                    ${results.jv ? results.jv.voucher_number : 'N/A    '}             ║`);
    console.log(`  ║  Inventory rows created:        ${String(results.inventory).padStart(6)}                  ║`);
    console.log(`  ║  Carry-over orders created:     ${String(results.orders).padStart(6)}                  ║`);
    console.log(`  ║  Execution time:                ${elapsed.padStart(6)}s                 ║`);
    console.log('  ║                                                            ║');
    console.log('  ║  🗄️  Database is now at Day 1 — ready for PRODUCTION.      ║');
    console.log('  ╚════════════════════════════════════════════════════════════╝');
    console.log('');

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.error('');
    console.error('  ╔════════════════════════════════════════════════════════════╗');
    console.error('  ║              ❌ INGESTION FAILED — ROLLED BACK            ║');
    console.error('  ╠════════════════════════════════════════════════════════════╣');
    console.error(`  ║  Time elapsed:  ${elapsed}s                                  ║`);
    console.error('  ╚════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('  Error details:');
    console.error(`  ${error.message}`);
    console.error('');
    console.error('  ℹ️  The entire transaction has been rolled back.');
    console.error('  ℹ️  No data was committed to the database.');
    console.error('  ℹ️  Fix the issue above, then re-run the script.');
    console.error('');
    process.exit(1);
  }
}


main()
  .catch((error) => {
    console.error('\n  ❌ Fatal error:\n');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
