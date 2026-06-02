import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function importOpeningBalances() {
  const csvFilePath = path.resolve(__dirname, '../../opening_balances.csv');
  const results: any[] = [];

  console.log(`📖 Reading CSV from: ${csvFilePath}`);

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File not found: ${csvFilePath}`);
    process.exit(1);
  }

  // 1. Ensure Accounts Exist
  console.log('🏛️ Ensuring standard financial accounts exist...');
  
  // Accounts Receivable (Asset)
  let arAccount = await prisma.financialAccount.findFirst({
    where: { category: 'ACCOUNTS_RECEIVABLE', active: true }
  });

  if (!arAccount) {
    console.log('✨ Creating "Accounts Receivable" account...');
    arAccount = await prisma.financialAccount.create({
      data: {
        code: '1100-AR',
        name: 'Accounts Receivable',
        type: 'ASSET',
        category: 'ACCOUNTS_RECEIVABLE',
        description: 'Customer outstanding balances'
      }
    });
  }

  // Opening Balance Equity (Equity)
  let equityAccount = await prisma.financialAccount.findFirst({
    where: { name: { contains: 'Opening Balance Equity', mode: 'insensitive' } }
  });

  if (!equityAccount) {
    console.log('✨ Creating "Opening Balance Equity" account...');
    equityAccount = await prisma.financialAccount.create({
      data: {
        code: '3000-OBE',
        name: 'Opening Balance Equity',
        type: 'EQUITY',
        category: 'ACCOUNTS_RECEIVABLE', // Category is a bit loose in schema, but EQUITY type is correct
        description: 'Account to balance opening entries'
      }
    });
  }
  const customers = await prisma.customer.findMany(); // Fetch all customers once
  console.log(`🔍 Cached ${customers.length} customers for matching.`);

  fs.createReadStream(csvFilePath)
    .pipe(csv({
      mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '')
    }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`✅ Read ${results.length} rows from CSV.`);

      for (const row of results) {
        const { date, customer_name, balance_amount, balance_type } = row;

        if (!customer_name || !balance_amount) {
          console.warn(`⚠️ Skipping row with missing data: ${JSON.stringify(row)}`);
          continue;
        }

        const amount = parseFloat(balance_amount);
        const entryDate = new Date(date || new Date());

        try {
          // 2. Lookup Customer (Fuzzy/Insensitive)
          const normalizedCsvName = row.customer_name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const customer = customers.find(c => 
            c.name && c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedCsvName
          );

          if (!customer) {
            console.error(`❌ Customer NOT FOUND: "${customer_name}". Please create the customer first.`);
            continue;
          }

          console.log(`🔍 Found Customer: ${customer.name} (ID: ${customer.customer_id})`);

          // 3. Create Journal Entry (Voucher)
          const voucherNumber = `OB-${customer.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
          
          const journalEntry = await prisma.journalEntry.create({
            data: {
              voucher_number: voucherNumber,
              entry_date: entryDate,
              description: `${customer.name} Opening Balance`,
              reference: customer.customer_id, // Link to customer ID in reference as requested
              status: 'POSTED',
              lines: {
                create: [
                  {
                    // Line 1: Accounts Receivable
                    account_id: arAccount!.account_id,
                    debit: balance_type.toLowerCase() === 'dr' ? amount : 0,
                    credit: balance_type.toLowerCase() === 'cr' ? amount : 0,
                    description: `${customer.name} - Opening Balance`,
                  },
                  {
                    // Line 2: Balancing Entry (Equity)
                    account_id: equityAccount!.account_id,
                    debit: balance_type.toLowerCase() === 'cr' ? amount : 0,
                    credit: balance_type.toLowerCase() === 'dr' ? amount : 0,
                    description: `Balancing Entry for ${customer.name}`,
                  }
                ]
              }
            }
          });

          console.log(`✅ Created Journal Entry: ${voucherNumber} for ${customer_name}`);
        } catch (error) {
          console.error(`❌ Failed to process balance for "${customer_name}":`, error);
        }
      }

      await prisma.$disconnect();
      console.log('🏁 Opening balance import completed.');
    });
}

importOpeningBalances().catch((e) => {
  console.error('💥 Fatal error during balance import:', e);
  process.exit(1);
});
