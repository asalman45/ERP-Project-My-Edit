// scripts/seed_supplier_data.js
// Ingests 8 real suppliers with their historical AP invoices and payments.
// Also posts corresponding Journal Entries to the Finance module.
// Run with: node scripts/seed_supplier_data.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper: find or create a financial account ──────────────────────────────
async function ensureAccount(code, name, type, category) {
    let acc = await prisma.financialAccount.findUnique({ where: { code } });
    if (!acc) {
        acc = await prisma.financialAccount.create({
            data: { code, name, type, category, active: true }
        });
        console.log(`  ✔ Created account: ${code} – ${name}`);
    }
    return acc;
}

// ─── Helper: upsert supplier ─────────────────────────────────────────────────
async function upsertSupplier(data) {
    const existing = await prisma.supplier.findFirst({ where: { code: data.code } });
    if (existing) {
        return prisma.supplier.update({ where: { supplier_id: existing.supplier_id }, data });
    }
    return prisma.supplier.create({ data });
}

// ─── Helper: create invoice + payment + journal entries ──────────────────────
async function createTransaction({
    supplier_id,
    invoices: invoiceList,
    payments: paymentList,
    accounts,
}) {
    let invoiceMap = {}; // invoice_no → invoice_id

    for (const inv of invoiceList) {
        // Skip if invoice already exists
        const existing = await prisma.invoice.findUnique({ where: { invoice_no: inv.invoice_no } });
        if (existing) {
            invoiceMap[inv.invoice_no] = existing.invoice_id;
            console.log(`  ⟳ Invoice already exists: ${inv.invoice_no}`);
            continue;
        }

        const base = inv.base_amount ?? inv.total_amount;
        const taxAmt = inv.tax_amount ?? 0;
        const discount = inv.discount_amount ?? 0;

        const invoice = await prisma.invoice.create({
            data: {
                invoice_no: inv.invoice_no,
                supplier_id,
                invoice_date: new Date(inv.date),
                total_amount: inv.total_amount,
                subtotal: base,
                tax_amount: taxAmt,
                base_amount: base,
                tax_type: inv.tax_type ?? 'GST',
                tax_rate: inv.tax_rate ?? null,
                discount_amount: discount,
                particulars: inv.particulars ?? null,
                status: 'APPROVED_FOR_PAYMENT',
                type: 'SUPPLIER',
                created_by: 'data-import',
            }
        });

        invoiceMap[inv.invoice_no] = invoice.invoice_id;

        // Post Journal Entry for this invoice
        // DR: Purchases/Expense Account
        // DR: Input Tax (GST/PST)
        // CR: Accounts Payable
        const lines = [];

        if (base > 0) {
            lines.push({
                account_id: accounts.expense,
                debit: base,
                credit: 0,
                description: `${inv.particulars ?? inv.invoice_no} – Base Amount`,
                cash_flow_type: 'OPERATING',
            });
        }
        if (taxAmt > 0) {
            lines.push({
                account_id: accounts.inputTax,
                debit: taxAmt,
                credit: 0,
                description: `${inv.tax_type ?? 'GST'} @ ${inv.tax_rate ?? ''}% on ${inv.invoice_no}`,
                cash_flow_type: 'OPERATING',
            });
        }
        lines.push({
            account_id: accounts.ap,
            debit: 0,
            credit: inv.total_amount - discount,
            description: `AP – ${inv.invoice_no}`,
            cash_flow_type: 'OPERATING',
        });

        await prisma.journalEntry.create({
            data: {
                entry_date: new Date(inv.date),
                reference: inv.invoice_no,
                description: `Supplier Invoice: ${inv.invoice_no}`,
                status: 'POSTED',
                currency_code: 'PKR',
                lines: { create: lines },
            }
        });

        console.log(`  ✔ Invoice created: ${inv.invoice_no}  Total=${inv.total_amount}`);
    }

    // ── Payments ────────────────────────────────────────────────────────────────
    // Map payments to invoices in sequence (FIFO by date)
    const sortedInvoices = invoiceList.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const sortedPayments = paymentList.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    for (const pmt of sortedPayments) {
        // Find the first unpaid invoice for this supplier
        // We simply link to first still-pending invoice or standalone
        const invoice_no = pmt.invoice_no ?? sortedInvoices[0]?.invoice_no;
        const invoice_id = invoice_no ? invoiceMap[invoice_no] : Object.values(invoiceMap)[0];

        if (!invoice_id) {
            console.warn(`  ⚠ No invoice found for payment ${pmt.reference} – skipping`);
            continue;
        }

        const wht = pmt.wht_amount ?? 0;

        // Check if payment with same reference already exists
        const existPmt = await prisma.payment.findFirst({ where: { reference: pmt.reference, invoice_id } });
        if (existPmt) {
            console.log(`  ⟳ Payment already exists: ${pmt.reference}`);
            continue;
        }

        await prisma.payment.create({
            data: {
                invoice_id,
                amount: pmt.amount,
                payment_method: pmt.method ?? 'ONLINE',
                payment_status: 'PAID',
                paid_date: new Date(pmt.date),
                reference: pmt.reference,
                wht_rate: pmt.wht_rate ?? null,
                wht_amount: wht > 0 ? wht : null,
                created_by: 'data-import',
            }
        });

        // Post Journal Entry for payment
        // DR: Accounts Payable (full invoice amount)
        // CR: Bank (cash paid)
        // CR: WHT Payable (amount withheld)
        const pmtLines = [
            {
                account_id: accounts.ap,
                debit: pmt.amount + wht,
                credit: 0,
                description: `Settle AP: ${pmt.reference}`,
                cash_flow_type: 'OPERATING',
            },
            {
                account_id: accounts.bank,
                debit: 0,
                credit: pmt.amount,
                description: `Online Payment: ${pmt.reference}`,
                cash_flow_type: 'OPERATING',
            },
        ];

        if (wht > 0) {
            pmtLines.push({
                account_id: accounts.whtPayable,
                debit: 0,
                credit: wht,
                description: `WHT @ ${pmt.wht_rate ?? ''}% – ${pmt.reference}`,
                cash_flow_type: 'OPERATING',
            });
        }

        await prisma.journalEntry.create({
            data: {
                entry_date: new Date(pmt.date),
                reference: pmt.reference,
                description: `Vendor Payment: ${pmt.reference}`,
                status: 'POSTED',
                currency_code: 'PKR',
                lines: { create: pmtLines },
            }
        });

        console.log(`  ✔ Payment recorded: ${pmt.reference}  Amount=${pmt.amount}${wht > 0 ? `  WHT=${wht}` : ''}`);
    }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('   EmpclERP – Supplier Data Ingestion (8 Suppliers)');
    console.log('════════════════════════════════════════════════════════\n');

    // ── Ensure required Financial Accounts exist ────────────────────────────
    console.log('► Setting up financial accounts...');
    const apAcc = await ensureAccount('2100', 'Accounts Payable', 'LIABILITY', 'ACCOUNTS_PAYABLE');
    const inputTax = await ensureAccount('1630', 'Input Tax – GST/PST', 'ASSET', 'ACCOUNTS_RECEIVABLE');
    const whtPayable = await ensureAccount('2200', 'WHT Payable', 'LIABILITY', 'ACCOUNTS_PAYABLE');
    const bankAcc = await ensureAccount('1020', 'Bank – Main Operating', 'ASSET', 'BANK');
    const purchAcc = await ensureAccount('5100', 'Purchases / COGS', 'EXPENSE', 'COST_OF_GOODS_SOLD');
    const svcAcc = await ensureAccount('6200', 'Other Expenses', 'EXPENSE', 'OPERATING_EXPENSE');

    const ACCOUNTS = {
        ap: apAcc.account_id,
        inputTax: inputTax.account_id,
        whtPayable: whtPayable.account_id,
        bank: bankAcc.account_id,
        expense: purchAcc.account_id,
        service: svcAcc.account_id,
    };

    console.log('');

    // ════════════════════════════════════════════════════════════════════════════
    // 1. MANAGEMENT ASSOCIATION OF PAKISTAN
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [1/8] Management Association of Pakistan...');
    const map1 = await upsertSupplier({
        code: 'SUP-MAP-001',
        name: 'Management Association of Pakistan',
        email: 'accountant@mappk.org',
        ntn: '0823393-4',
        bank_name: 'MCB Bank Limited',
        bank_branch: 'GTB Branch Karachi (0069)',
        bank_account: '0006903010000302',
        bank_iban: 'PK62MUCB0006903010000302',
        bank_account_title: 'Management Association of Pakistan',
        bank_account_type: 'Saving',
    });

    await createTransaction({
        supplier_id: map1.supplier_id,
        accounts: { ...ACCOUNTS, expense: svcAcc.account_id },
        invoices: [
            { invoice_no: 'KI00229-4/2025-ENTRANCE', date: '2025-02-06', base_amount: 5000, tax_amount: 0, total_amount: 5000, tax_type: 'NONE', particulars: 'Entrance Fee 2025' },
            { invoice_no: 'KI00229-4/2025-ANNUAL', date: '2025-02-06', base_amount: 5000, tax_amount: 0, total_amount: 5000, tax_type: 'NONE', particulars: 'Annual Subscription 2025' },
            { invoice_no: 'KI00229-15/2026', date: '2025-12-22', base_amount: 2500, tax_amount: 0, total_amount: 2500, tax_type: 'NONE', particulars: 'Half-Year Subscription 2026' },
        ],
        payments: [
            { date: '2025-02-04', reference: 'CMS/248-022025', amount: 10000, method: 'ONLINE', invoice_no: 'KI00229-4/2025-ENTRANCE' },
            { date: '2026-01-10', reference: 'CMS/XXX-012026', amount: 2500, method: 'ONLINE', invoice_no: 'KI00229-15/2026' },
        ],
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 2. OS CORPORATION
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [2/8] OS Corporation...');
    const map2 = await upsertSupplier({
        code: 'SUP-OSC-001',
        name: 'OS Corporation',
        address: 'Shed No 03 Plot No E-9 Site Karachi',
        ntn: '2486601-6',
        strn: '17-50-7212-001-73',
    });

    await createTransaction({
        supplier_id: map2.supplier_id,
        accounts: ACCOUNTS,
        invoices: [
            { invoice_no: 'SI-00009449', date: '2019-03-04', base_amount: 79624, tax_amount: 13536, total_amount: 93160, tax_type: 'GST', tax_rate: 17 },
            { invoice_no: 'SI-00009467', date: '2019-04-11', base_amount: 284234, tax_amount: 48320, total_amount: 332554, tax_type: 'GST', tax_rate: 17 },
            { invoice_no: 'SI-00009492', date: '2019-04-12', base_amount: 113467, tax_amount: 19289, total_amount: 132757, tax_type: 'GST', tax_rate: 17 },
            { invoice_no: 'SI-00009800', date: '2019-04-26', base_amount: 362232, tax_amount: 61579, total_amount: 423811, tax_type: 'GST', tax_rate: 17 },
            { invoice_no: 'SI-00011121', date: '2019-06-01', base_amount: 605271, tax_amount: 102896, total_amount: 708167, tax_type: 'GST', tax_rate: 17 },
            { invoice_no: 'SI-00011030', date: '2019-06-05', base_amount: 431400, tax_amount: 73338, total_amount: 504738, tax_type: 'GST', tax_rate: 17 },
        ],
        payments: [
            { date: '2019-06-28', reference: 'MBL-A-24197745', amount: 332554, method: 'BANK_TRANSFER', invoice_no: 'SI-00009467' },
            { date: '2019-06-29', reference: 'MBL-A-25014876', amount: 225917, method: 'BANK_TRANSFER', invoice_no: 'SI-00009492' },
            { date: '2020-04-30', reference: 'MBL-A-33183224', amount: 423811, method: 'BANK_TRANSFER', invoice_no: 'SI-00009800' },
        ],
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 3. PHOENIX ARMOUR (PVT.) LIMITED
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [3/8] Phoenix Armour (Pvt.) Limited...');
    const map3 = await upsertSupplier({
        code: 'SUP-PHX-001',
        name: 'Phoenix Armour (Pvt.) Limited',
        address: 'P & O Plaza I.I. Chundrigar Road Karachi-74000',
        phone: '111-288-288',
        email: 'info@pheonix.com.pk',
        ntn: '0709943-6',
        strn: '12-00-8512-004-28',
        bank_name: 'Meezan Bank',
        bank_branch: 'P & O Plaza Branch',
        bank_account: '0171-0102215789',
    });

    // This supplier has a regular quarterly recurring pattern – list all invoices + payments
    const phoenixData = [
        { invoice_no: 'AKHI-1869-24', date: '2024-11-01', payment_date: '2024-11-26', payment_ref: 'CMS/143-112024' },
        { invoice_no: 'AKHI-6182-25', date: '2025-02-01', payment_date: '2025-02-04', payment_ref: 'CMS/246-022025' },
        { invoice_no: 'AKHI-11331-25', date: '2025-05-01', payment_date: '2025-05-06', payment_ref: 'CMS/331-052025' },
        { invoice_no: 'AKHI-16552-25', date: '2025-08-01', payment_date: '2025-08-28', payment_ref: 'CMS/085-082025' },
        { invoice_no: 'AKHI-1047-25', date: '2025-11-01', payment_date: '2025-11-24', payment_ref: 'CMS/284-112025' },
    ];

    await createTransaction({
        supplier_id: map3.supplier_id,
        accounts: ACCOUNTS,
        invoices: phoenixData.map(d => ({
            invoice_no: d.invoice_no,
            date: d.date,
            base_amount: 13806,
            tax_amount: 2692,
            total_amount: 16498,
            tax_type: 'GST',
            tax_rate: 19.5,
            particulars: 'Security Services',
        })),
        payments: phoenixData.map(d => ({
            date: d.payment_date,
            reference: d.payment_ref,
            amount: 16498,
            method: 'ONLINE',
            invoice_no: d.invoice_no,
        })),
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 4. PAKISTAN OXYGEN LIMITED
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [4/8] Pakistan Oxygen Limited...');
    const map4 = await upsertSupplier({
        code: 'SUP-POL-001',
        name: 'Pakistan Oxygen Limited',
        address: 'West Wharf, Dockyard Road P.O Box # 4845, Karachi 74000',
        ntn: '0709930-4',
        strn: '02-06-2804-002-28',
        bank_name: 'Meezan Bank Ltd.',
        bank_account: '9902-0101472486',
    });

    await createTransaction({
        supplier_id: map4.supplier_id,
        accounts: ACCOUNTS,
        invoices: [
            { invoice_no: 'POL-372039319', date: '2024-10-12', base_amount: 160900, tax_amount: 28962, total_amount: 189862, tax_type: 'GST', tax_rate: 18, particulars: 'Mig Wire / Electrodes' },
            { invoice_no: 'POL-372056914', date: '2024-12-09', base_amount: 160900, tax_amount: 28962, total_amount: 189862, tax_type: 'GST', tax_rate: 18, particulars: 'Mig Wire / Electrodes' },
            { invoice_no: 'POL-372102438', date: '2025-05-15', base_amount: 276000, tax_amount: 49680, total_amount: 325680, tax_type: 'GST', tax_rate: 18, particulars: 'Industrial Gas Supplies' },
            { invoice_no: 'POL-372115722', date: '2025-06-30', base_amount: 135000, tax_amount: 24300, total_amount: 159300, tax_type: 'GST', tax_rate: 18, particulars: 'Industrial Gas Supplies' },
            { invoice_no: 'POL-372120776', date: '2025-07-18', base_amount: 67500, tax_amount: 12150, total_amount: 79650, tax_type: 'GST', tax_rate: 18, particulars: 'Industrial Gas Supplies' },
            { invoice_no: 'POL-372124996', date: '2025-07-31', base_amount: 6750, tax_amount: 1215, total_amount: 7965, tax_type: 'GST', tax_rate: 18, particulars: 'Industrial Gas Supplies' },
            { invoice_no: 'POL-372124997', date: '2025-07-31', base_amount: 94500, tax_amount: 17010, total_amount: 111510, tax_type: 'GST', tax_rate: 18, particulars: 'Industrial Gas Supplies' },
            { invoice_no: 'POL-372156119', date: '2025-11-14', base_amount: 135000, tax_amount: 24300, total_amount: 159300, tax_type: 'GST', tax_rate: 18, particulars: 'Industrial Gas Supplies' },
            { invoice_no: 'POL-372163959', date: '2025-12-12', base_amount: 255000, tax_amount: 45900, total_amount: 300900, tax_type: 'GST', tax_rate: 18, particulars: 'Industrial Gas Supplies' },
        ],
        payments: [
            { date: '2024-10-21', reference: 'BAHL-EMCPL-10576045', amount: 189862, method: 'BANK_TRANSFER', invoice_no: 'POL-372039319' },
            { date: '2024-12-16', reference: 'CMS/175-122024', amount: 189862, method: 'ONLINE', invoice_no: 'POL-372056914' },
            { date: '2025-06-11', reference: 'CMS/374-062025', amount: 325680, method: 'ONLINE', invoice_no: 'POL-372102438' },
            { date: '2025-07-28', reference: 'CMS/033-072025', amount: 159300, method: 'ONLINE', invoice_no: 'POL-372115722' },
            { date: '2025-08-08', reference: 'CMS/65-082025', amount: 199125, method: 'ONLINE', invoice_no: 'POL-372120776' },
            { date: '2025-12-11', reference: 'CMS/326-122025', amount: 159300, method: 'ONLINE', invoice_no: 'POL-372156119' },
            { date: '2026-01-10', reference: 'CMS/389-012026', amount: 300900, method: 'ONLINE', invoice_no: 'POL-372163959' },
        ],
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 5. PEOPLES STEEL MILLS LTD.
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [5/8] Peoples Steel Mills Ltd...');
    const map5 = await upsertSupplier({
        code: 'SUP-PSM-001',
        name: 'Peoples Steel Mills Ltd.',
        ntn: '0711630-6',
        bank_name: 'Allied Bank (PSML Branch)',
        bank_account: '0010-0000-5949-0092',
    });

    await createTransaction({
        supplier_id: map5.supplier_id,
        accounts: ACCOUNTS,
        invoices: [
            { invoice_no: 'PSM-62763', date: '2024-06-07', base_amount: 390000, tax_amount: 70200, total_amount: 460200, tax_type: 'GST', tax_rate: 18, particulars: 'Steel Dia 25/28 1000kg' },
            { invoice_no: 'PSM-63272', date: '2024-09-04', base_amount: 161460, tax_amount: 29063, total_amount: 190523, tax_type: 'GST', tax_rate: 18, particulars: 'Steel Supply' },
            { invoice_no: 'PSM-63975', date: '2024-12-24', base_amount: 414180, tax_amount: 74552, total_amount: 488732, tax_type: 'GST', tax_rate: 18, particulars: 'Steel Supply' },
            { invoice_no: 'PSM-64690', date: '2025-04-17', base_amount: 561600, tax_amount: 101088, total_amount: 662688, tax_type: 'GST', tax_rate: 18, particulars: 'Steel Supply' },
            { invoice_no: 'PSM-65722', date: '2025-09-23', base_amount: 226125, tax_amount: 40703, total_amount: 266828, tax_type: 'GST', tax_rate: 18, particulars: 'Steel Supply' },
            { invoice_no: 'PSM-65978', date: '2025-10-16', base_amount: 196875, tax_amount: 35438, total_amount: 232313, tax_type: 'GST', tax_rate: 18, particulars: 'Steel Supply' },
        ],
        payments: [
            { date: '2024-06-04', reference: '10528979-BAHL-EMCPL', amount: 460200, method: 'BANK_TRANSFER', invoice_no: 'PSM-62763' },
            { date: '2024-12-23', reference: 'CMS/183-122024', amount: 421200, method: 'ONLINE', invoice_no: 'PSM-63272' },
            { date: '2024-12-24', reference: 'CMS/184-122024', amount: 75816, method: 'ONLINE', invoice_no: 'PSM-63975' },
            { date: '2025-04-12', reference: 'CMS/307-042025', amount: 660000, method: 'ONLINE', invoice_no: 'PSM-64690' },
            { date: '2025-09-15', reference: 'CMS/145-092025', amount: 265500, method: 'ONLINE', invoice_no: 'PSM-65722' },
            { date: '2025-10-13', reference: 'CMS/220-102025', amount: 236287, method: 'ONLINE', invoice_no: 'PSM-65978' },
        ],
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 6. SHABBIR TILES & CERAMICS LTD
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [6/8] Shabbir Tiles & Ceramics Ltd...');
    const map6 = await upsertSupplier({
        code: 'SUP-STC-001',
        name: 'Shabbir Tiles & Ceramics Ltd',
        address: 'Stile Emporium & Design Studio, C-8-C, 26th Street, DHA Ph 5, Karachi',
        ntn: '34-01-0712052-4',
        strn: '02-04-6907-00-37',
    });

    await createTransaction({
        supplier_id: map6.supplier_id,
        accounts: ACCOUNTS,
        invoices: [
            { invoice_no: 'STC-SAP4631', date: '2024-07-26', base_amount: 26481.35, tax_amount: 4766.64, discount_amount: 5296.27, total_amount: 25952, tax_type: 'GST', tax_rate: 18, particulars: 'Tiles – SAP 4631' },
            { invoice_no: 'STC-SAP4632', date: '2024-07-26', base_amount: 1989.15, tax_amount: 358.05, discount_amount: 71.61, total_amount: 2276, tax_type: 'GST', tax_rate: 18, particulars: 'Tiles – SAP 4632' },
            { invoice_no: 'STC-39127', date: '2025-04-26', base_amount: 13815, tax_amount: 2486, total_amount: 16302, tax_type: 'GST', tax_rate: 18, particulars: 'Tiles / Grout' },
        ],
        payments: [
            { date: '2024-07-24', reference: 'IBFT-Stan-483199', amount: 27434, method: 'IBFT', invoice_no: 'STC-SAP4631', wht_rate: 5, wht_amount: 1444 },
            { date: '2025-04-25', reference: 'CMS/316-042025', amount: 15488, method: 'ONLINE', invoice_no: 'STC-39127', wht_rate: 5, wht_amount: 814 },
        ],
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 7. WELDING ALLOYS PVT LTD
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [7/8] Welding Alloys Pvt Ltd...');
    const map7 = await upsertSupplier({
        code: 'SUP-WAL-001',
        name: 'Welding Alloys Pvt Ltd',
        address: '7-Akhara Building Bhimpura, Nishtar Road, Karachi 74550',
        ntn: '0829180-2',
        strn: '11-90-9999-779-19',
        bank_name: 'Summit Bank',
        bank_account: '1-2-44-20311-714-102-800',
    });

    await createTransaction({
        supplier_id: map7.supplier_id,
        accounts: ACCOUNTS,
        invoices: [
            { invoice_no: 'WAL-6566', date: '2024-12-14', base_amount: 8750, tax_amount: 1575, total_amount: 10325, tax_type: 'GST', tax_rate: 18, particulars: 'Welding Alloys & Consumables' },
            { invoice_no: 'WAL-6667', date: '2025-02-04', base_amount: 86400, tax_amount: 15552, total_amount: 101952, tax_type: 'GST', tax_rate: 18, particulars: 'Welding Alloys & Consumables' },
            { invoice_no: 'WAL6752', date: '2025-04-16', base_amount: 79500, tax_amount: 14310, total_amount: 93810, tax_type: 'GST', tax_rate: 18, particulars: 'Welding Alloys & Consumables' },
            { invoice_no: 'WAL6827', date: '2025-05-31', base_amount: 14400, tax_amount: 2592, total_amount: 16992, tax_type: 'GST', tax_rate: 18, particulars: 'Welding Alloys & Consumables' },
        ],
        payments: [
            { date: '2025-01-08', reference: 'CMS/207-012025', amount: 9809, method: 'ONLINE', invoice_no: 'WAL-6566', wht_rate: 5, wht_amount: 516 },
            { date: '2025-04-08', reference: 'CMS/304-042025', amount: 96854, method: 'ONLINE', invoice_no: 'WAL-6667', wht_rate: 5, wht_amount: 5098 },
            { date: '2025-05-14', reference: 'CMS/340-052025', amount: 89120, method: 'ONLINE', invoice_no: 'WAL6752', wht_rate: 5, wht_amount: 4691 },
            { date: '2025-07-17', reference: 'CMS/006-072025', amount: 16142, method: 'ONLINE', invoice_no: 'WAL6827', wht_rate: 5, wht_amount: 850 },
        ],
    });

    // ════════════════════════════════════════════════════════════════════════════
    // 8. ZAHID ENTERPRISES / ZAMSUN STEEL
    // ════════════════════════════════════════════════════════════════════════════
    console.log('► [8/8] Zahid Enterprises / Zamsun Steel...');
    const map8 = await upsertSupplier({
        code: 'SUP-ZAH-001',
        name: 'Zahid Enterprises / Zamsun Steel',
        ntn: '8255820-3',
        strn: '32-7787-6203-99-6',
        bank_name: 'Meezan Bank',
        bank_account: '0286-0104150750',
        bank_iban: 'PK60MEZN0001390101009197',
    });

    await createTransaction({
        supplier_id: map8.supplier_id,
        accounts: ACCOUNTS,
        invoices: [
            { invoice_no: 'ZAH-3034', date: '2025-06-26', base_amount: 212500, tax_amount: 38250, total_amount: 250750, tax_type: 'GST', tax_rate: 18, particulars: 'Steel Supply' },
        ],
        payments: [
            { date: '2025-03-26', reference: 'CMS/288-032025', amount: 247992, method: 'ONLINE', wht_rate: 5.5, wht_amount: 2758, invoice_no: 'ZAH-3034' },
            { date: '2025-08-07', reference: 'CMS/05-082025', amount: 85864, method: 'ONLINE', invoice_no: 'ZAH-3034' },
            { date: '2025-09-09', reference: 'CMS/135-092025', amount: 98382, method: 'ONLINE', wht_rate: 1.1, wht_amount: 2049, invoice_no: 'ZAH-3034' },
            { date: '2026-01-12', reference: 'CMS/396-012026', amount: 135139, method: 'ONLINE', wht_rate: 1.1, wht_amount: 1503, invoice_no: 'ZAH-3034' },
        ],
    });

    console.log('\n════════════════════════════════════════════════════════');
    console.log('   ✔ All 8 suppliers ingested successfully!');
    console.log('════════════════════════════════════════════════════════\n');
}

main()
    .catch((e) => { console.error('FATAL ERROR:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
