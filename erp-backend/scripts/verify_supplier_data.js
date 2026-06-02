// scripts/verify_supplier_data.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
    console.log('\n════════════════════════════════════════════');
    console.log('   Supplier Ingestion Verification');
    console.log('════════════════════════════════════════════\n');

    const suppliers = await prisma.supplier.findMany({
        where: { code: { startsWith: 'SUP-' } },
        select: {
            name: true, ntn: true, bank_name: true,
            _count: { select: { invoices: true } }
        }
    });

    console.log('Suppliers loaded:');
    suppliers.forEach(s => {
        console.log(`  ${s.name}`);
        console.log(`    NTN: ${s.ntn ?? 'N/A'}   Bank: ${s.bank_name ?? 'N/A'}   Invoices: ${s._count.invoices}`);
    });

    const invTotal = await prisma.invoice.count({ where: { type: 'SUPPLIER' } });
    const pmtTotal = await prisma.payment.count();
    const whtTotal = await prisma.payment.aggregate({ _sum: { wht_amount: true } });
    const jeTotal = await prisma.journalEntry.count();

    console.log('\nSummary:');
    console.log(`  Supplier Invoices: ${invTotal}`);
    console.log(`  Payments:          ${pmtTotal}`);
    console.log(`  WHT Deducted:      PKR ${whtTotal._sum.wht_amount?.toFixed(2) ?? 0}`);
    console.log(`  Journal Entries:   ${jeTotal}`);
    console.log('\n✔ Verification complete\n');
}

verify().catch(console.error).finally(() => prisma.$disconnect());
