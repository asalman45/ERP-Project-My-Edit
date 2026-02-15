// erp-backend/scripts/seed-finance.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const accounts = [
    // Assets
    { code: '1000', name: 'Cash on Hand', type: 'ASSET', category: 'CASH' },
    { code: '1010', name: 'Main Bank Account', type: 'ASSET', category: 'BANK' },
    { code: '1200', name: 'Accounts Receivable', type: 'ASSET', category: 'ACCOUNTS_RECEIVABLE' },
    { code: '1300', name: 'Inventory - Raw Materials', type: 'ASSET', category: 'INVENTORY' },
    { code: '1310', name: 'Inventory - Finished Goods', type: 'ASSET', category: 'INVENTORY' },

    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', category: 'ACCOUNTS_PAYABLE' },
    { code: '2100', name: 'GST Payable', type: 'LIABILITY', category: 'OPERATING_EXPENSE' },

    // Equity
    { code: '3000', name: 'Owner Capital', type: 'EQUITY', category: 'OTHER_INCOME' },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY', category: 'OTHER_INCOME' },

    // Revenue
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', category: 'OTHER_INCOME' },

    // Expenses
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', category: 'COST_OF_GOODS_SOLD' },
    { code: '5100', name: 'Salaries & Wages', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
    { code: '5200', name: 'NRE Costs - Tooling', type: 'EXPENSE', category: 'NRE_COST' },
    { code: '5210', name: 'NRE Costs - Design', type: 'EXPENSE', category: 'NRE_COST' },
    { code: '5300', name: 'Factory Rent', type: 'EXPENSE', category: 'OPERATING_EXPENSE' },
];

async function seed() {
    console.log('Starting financial seed...');
    for (const acc of accounts) {
        try {
            await prisma.financialAccount.upsert({
                where: { code: acc.code },
                update: {},
                create: acc
            });
            console.log(`Synced account: ${acc.code} - ${acc.name}`);
        } catch (e) {
            console.error(`Error seeding ${acc.code}:`, e.message);
        }
    }
    console.log('Seeding complete.');
    process.exit(0);
}

seed();
