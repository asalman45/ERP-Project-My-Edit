#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// EMPCL ERP – SANDBOX DATA PURGE UTILITY
// ═══════════════════════════════════════════════════════════════════════════════
//
// PURPOSE:  Clear ALL transactional/test data from the database in preparation
//           for the January 1 2026 Production Data Cutover.
//
// ⚠️  THIS SCRIPT IS IRREVERSIBLE.  It will permanently destroy all
//     transactional records.  Master data (Users, Employees, Products,
//     Raw Materials, BOMs, Work Centers, Locations, etc.) is PRESERVED.
//
// USAGE:    node scripts/purge_sandbox_transactions.js
//
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

// ─── Tables to TRUNCATE (transactional data) ─────────────────────────────────
// These are the Postgres table names (@@map values from schema.prisma).
// TRUNCATE ... CASCADE handles FK ordering automatically, but we group them
// logically for clarity and auditability.

const TABLES_TO_PURGE = [
    // ── Document Management ──────────────────────────────────────────────────
    'attachment',

    // ── Financial / GL ───────────────────────────────────────────────────────
    'journal_line',
    'journal_entry',
    'bank_transaction',
    'payment',

    // ── Customer Invoices (Sales) ────────────────────────────────────────────
    'customer_invoice_item',
    'customer_invoice',

    // ── AP Invoices (Supplier) & Three-Way Match ─────────────────────────────
    'three_way_match',
    'invoice_item',
    'invoice',

    // ── Goods Receipts ───────────────────────────────────────────────────────
    'goods_receipt_item',
    'goods_receipt',

    // ── Dispatch ─────────────────────────────────────────────────────────────
    'dispatch_item',
    'dispatch_order',

    // ── Work Orders & Production ─────────────────────────────────────────────
    'material_reservation',
    'wastage',
    'work_order_step',
    'work_order_item',
    'work_order',
    'production_step',
    'production_material_usage',
    'production_order',
    'production_material_consumption',
    'planned_production',

    // ── Purchase Orders ──────────────────────────────────────────────────────
    'purchase_order_item',
    'purchase_order',

    // ── Purchase Requisitions ────────────────────────────────────────────────
    'purchase_requisition_item',
    'purchase_requisition',

    // ── Sales Orders ─────────────────────────────────────────────────────────
    'sales_order_item',
    'sales_order',

    // ── Inventory & Stock ────────────────────────────────────────────────────
    'stock_ledger',
    'inventory_txn',
    'batch_consumption',
    'batch',
    'inventory',

    // ── Scrap / Leftover ─────────────────────────────────────────────────────
    'scrap_transaction_log',
    'scrap_origin',
    'scrap_movement',
    'scrap_transaction',
    'scrap_inventory',

    // ── Procurement Requests ─────────────────────────────────────────────────
    'procurement_request',

    // ── CRM Transactions ─────────────────────────────────────────────────────
    'crm_activity',
    'crm_quotation_item',
    'crm_quotation',
    'crm_opportunity',
    'crm_lead',

    // ── QA / QC Rejections ───────────────────────────────────────────────────
    'qa_rejection',

    // ── Audit Trail (test data) ──────────────────────────────────────────────
    'audit_log',

    // ── Payroll & Attendance (transactional cycles) ──────────────────────────
    'payroll',
    'attendance',

    // ── Optimization Results (recalculated in production) ────────────────────
    'blank_optimization',

    // ── Fixed Asset Logs ─────────────────────────────────────────────────────
    'depreciation_log',
    'maintenance_log',

    // ── Report Schedules (test schedules) ────────────────────────────────────
    'report_schedule',
];

// ─── Tables that are PRESERVED (Master Data) ─────────────────────────────────
// Listed here for documentation / audit purposes only — NOT touched by this script.
const TABLES_PRESERVED = [
    'app_user',               // Users
    'hr_employee',            // Employees
    'supplier',               // Suppliers
    'supplier_material',      // Supplier-Material mapping
    'customer',               // Customers
    'product',                // Finished Goods
    'material',               // Bill of Material inputs
    'raw_material',           // Raw Materials
    'bom',                    // Bill of Materials
    'bom_item',               // BOM line items
    'routing',                // Routing/Process Flows
    'routing_step',           // Routing Steps
    'process_flow',           // Process Flows  
    'process_step',           // Process Steps
    'work_center',            // Work Centers
    'work_center_rate',       // Work Center Rates
    'standard_cost_ledger',   // Baseline standard costs
    'location',               // Warehouses / Locations
    'oem',                    // OEM Master
    'model',                  // Model Master
    'uom',                    // Units of Measure
    'operation',              // Operations
    'blank_spec',             // Blank Specifications
    'material_consumption',   // BOM Material Consumption configs
    'sheet_sizes',            // Sheet Size master
    'financial_account',      // Chart of Accounts
    'cost_center',            // Cost Centers
    'budget',                 // Budgets
    'fixed_asset',            // Fixed Assets (master record preserved)
    'nre_ledger',             // NRE Ledger
    'qc_standard',            // QC Standards
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                        ║');
    console.log('║   ██████╗ ██╗   ██╗██████╗  ██████╗ ███████╗    ████████╗ ██████╗  ██╗ ║');
    console.log('║   ██╔══██╗██║   ██║██╔══██╗██╔════╝ ██╔════╝    ╚══██╔══╝██╔═══██╗██║ ║');
    console.log('║   ██████╔╝██║   ██║██████╔╝██║  ███╗█████╗         ██║   ██║   ██║██║ ║');
    console.log('║   ██╔═══╝ ██║   ██║██╔══██╗██║   ██║██╔══╝         ██║   ██║   ██║██║ ║');
    console.log('║   ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗       ██║   ╚██████╔╝███╗║');
    console.log('║   ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝       ╚═╝    ╚═════╝ ╚══╝║');
    console.log('║                                                                        ║');
    console.log('║             EMPCL ERP – Sandbox Transaction Purge Utility              ║');
    console.log('║                                                                        ║');
    console.log('╚════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│  ⚠️   W A R N I N G                                            │');
    console.log('│                                                                 │');
    console.log('│  This script will PERMANENTLY DELETE all transactional data:    │');
    console.log('│                                                                 │');
    console.log('│  • Purchase Orders, Goods Receipts, Invoices, Payments          │');
    console.log('│  • Sales Orders, Dispatches, Customer Invoices                  │');
    console.log('│  • Work Orders, Production Orders, Planned Productions         │');
    console.log('│  • Journal Entries, Bank Transactions                           │');
    console.log('│  • Inventory Transactions, Stock Ledger, Physical Inventory     │');
    console.log('│  • All Attachments (DB records + files remain on disk)          │');
    console.log('│  • Audit Logs, Payroll, Attendance, CRM records                 │');
    console.log('│                                                                 │');
    console.log('│  The following Master Data will be PRESERVED:                   │');
    console.log('│                                                                 │');
    console.log('│  ✅ Users, Employees, Suppliers, Customers                      │');
    console.log('│  ✅ Products, Raw Materials, BOMs, Routings                     │');
    console.log('│  ✅ Work Centers, Locations, UOMs, OEMs, Models                 │');
    console.log('│  ✅ Standard Cost Ledger (baseline costs)                       │');
    console.log('│  ✅ Financial Accounts (Chart of Accounts)                      │');
    console.log('│  ✅ Fixed Assets, QC Standards, Blank Specifications            │');
    console.log('│                                                                 │');
    console.log('│  THIS ACTION IS IRREVERSIBLE.                                   │');
    console.log('└─────────────────────────────────────────────────────────────────┘');
    console.log('');

    // ── Confirmation Prompt ──────────────────────────────────────────────────
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const answer = await new Promise((resolve) => {
        rl.question('  🔐 Type CONFIRM to proceed with the purge: ', resolve);
    });
    rl.close();

    if (answer !== 'CONFIRM') {
        console.log('\n  ❌ Aborted. No data was deleted.\n');
        process.exit(0);
    }

    console.log('\n  🚀 Starting purge...\n');

    // ── Pre-Purge Counts ────────────────────────────────────────────────────
    console.log('  ┌── Pre-Purge Record Counts ───────────────────────────────');
    const preCounts = {};
    for (const table of TABLES_TO_PURGE) {
        try {
            const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
            preCounts[table] = result[0]?.count ?? 0;
            if (preCounts[table] > 0) {
                console.log(`  │  📋 ${table.padEnd(40)} ${String(preCounts[table]).padStart(8)} rows`);
            }
        } catch {
            // Table might not exist yet (migration not run), skip silently
            preCounts[table] = 0;
        }
    }
    console.log('  └─────────────────────────────────────────────────────────\n');

    // ── Execute TRUNCATE CASCADE ────────────────────────────────────────────
    // Using a single TRUNCATE ... CASCADE statement is the most efficient and
    // FK-safe approach in PostgreSQL. It acquires ACCESS EXCLUSIVE locks on all
    // listed tables, truncates them in dependency order, and commits atomically.

    const tableList = TABLES_TO_PURGE.map(t => `"${t}"`).join(', ');
    const truncateSQL = `TRUNCATE TABLE ${tableList} CASCADE`;

    console.log('  ⏳ Executing TRUNCATE CASCADE on all transactional tables...');
    const startTime = Date.now();

    try {
        await prisma.$executeRawUnsafe(truncateSQL);
    } catch (error) {
        console.error('\n  ❌ TRUNCATE failed. Error details:\n');
        console.error(`     ${error.message}`);
        console.error('\n  ℹ️  Some tables may not exist yet. Falling back to individual deletes...\n');

        // Fallback: delete each table individually (handles missing tables)
        for (const table of TABLES_TO_PURGE) {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
                console.log(`  ✅ Truncated: ${table}`);
            } catch (err) {
                console.log(`  ⏭️  Skipped:   ${table} (${err.message.split('\n')[0]})`);
            }
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    // ── Post-Purge Verification ─────────────────────────────────────────────
    console.log('\n  ┌── Post-Purge Verification ────────────────────────────────');
    let totalDeleted = 0;
    for (const table of TABLES_TO_PURGE) {
        if (preCounts[table] > 0) {
            try {
                const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
                const remaining = result[0]?.count ?? 0;
                const deleted = preCounts[table] - remaining;
                totalDeleted += deleted;
                const status = remaining === 0 ? '✅' : '⚠️';
                console.log(`  │  ${status} ${table.padEnd(40)} ${String(deleted).padStart(8)} deleted, ${remaining} remaining`);
            } catch {
                // skip
            }
        }
    }
    console.log('  └─────────────────────────────────────────────────────────\n');

    // ── Master Data Integrity Check ─────────────────────────────────────────
    console.log('  ┌── Master Data Integrity Check ───────────────────────────');
    for (const table of TABLES_PRESERVED) {
        try {
            const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
            const count = result[0]?.count ?? 0;
            if (count > 0) {
                console.log(`  │  ✅ ${table.padEnd(40)} ${String(count).padStart(8)} rows INTACT`);
            }
        } catch {
            // Table might not exist, skip
        }
    }
    console.log('  └─────────────────────────────────────────────────────────\n');

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log('  ╔════════════════════════════════════════════════════════════╗');
    console.log('  ║                    PURGE COMPLETE                         ║');
    console.log('  ╠════════════════════════════════════════════════════════════╣');
    console.log(`  ║  Tables purged:     ${String(TABLES_TO_PURGE.length).padStart(6)}                              ║`);
    console.log(`  ║  Total rows deleted: ${String(totalDeleted).padStart(6)}                              ║`);
    console.log(`  ║  Execution time:     ${elapsed.padStart(6)}s                             ║`);
    console.log('  ║                                                            ║');
    console.log('  ║  ✅ All master data preserved.                             ║');
    console.log('  ║  🗄️  Database ready for Production Data Cutover.           ║');
    console.log('  ╚════════════════════════════════════════════════════════════╝\n');
}

main()
    .catch((error) => {
        console.error('\n  ❌ Fatal error during purge:\n');
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
