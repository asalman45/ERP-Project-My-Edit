import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import xlsx from 'xlsx';
const { readFile, utils } = xlsx;

const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN === 'true';

// Slugify function to generate unique supplier codes
function generateSupplierCode(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '-').substring(0, 15);
}

async function fetchAndDump() {
  const filePath = path.join(process.cwd(), 'Ledger for Purchases Official.xlsx');
  console.log(`🔍 Reading Excel file: ${filePath}`);
  if (DRY_RUN) console.log('🧪 DRY RUN MODE: No database changes will be made.');

  let workbook;
  try {
    workbook = readFile(filePath);
  } catch (err: any) {
    console.error(`❌ Error reading Excel file: ${err.message}`);
    return;
  }

  // Ensure Financial Accounts exist
  console.log('📉 Ensuring financial accounts exist...');
  let payableAccount, equityAccount;
  
  if (!DRY_RUN) {
    payableAccount = await prisma.financialAccount.upsert({
      where: { code: 'AC-PAYABLE-001' },
      update: {},
      create: { 
        code: 'AC-PAYABLE-001',
        name: 'Accounts Payable', 
        type: 'LIABILITY', 
        category: 'ACCOUNTS_PAYABLE' 
      },
    });

    equityAccount = await prisma.financialAccount.upsert({
      where: { code: 'AC-EQUITY-001' },
      update: {},
      create: { 
        code: 'AC-EQUITY-001',
        name: 'Opening Balance Equity', 
        type: 'EQUITY', 
        category: 'OTHER_INCOME' 
      },
    });
  }

  let successCount = 0;

  for (const sheetName of workbook.SheetNames) {
    try {
      const vendorName = sheetName.trim();
      if (!vendorName || 
          vendorName === 'Sheet1' || 
          vendorName.includes('Data') || 
          vendorName === 'Ledger for Purchases Official'
      ) continue;

      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = utils.sheet_to_json(worksheet, { header: 1 });

      let closingBalance = 0;

      // Find the last valid balance in Column 4 (Index 4)
      for (let i = data.length - 1; i >= 5; i--) {
        const row = data[i];
        if (!row || row.length < 5) continue;

        let val = row[4]; // BALANCE column
        if (val !== undefined && val !== null && !isNaN(Number(val))) {
          let num = parseFloat(val.toString());

          // Safeguard: Ignore numbers > 5 Crore
          if (num > 0 && num < 50000000) { 
            closingBalance = num;
            break;
          }
        }
      }

      if (closingBalance === 0) {
         // console.log(`⚠️ Skipped ${vendorName}: No valid balance found.`);
         continue;
      }

      console.log(`✅ Found: ${vendorName.padEnd(30)} | Balance: Rs. ${closingBalance.toLocaleString()}`);

      if (!DRY_RUN && payableAccount && equityAccount) {
        // Find existing supplier by name
        let supplier = await prisma.supplier.findFirst({
            where: { name: vendorName }
        });

        if (!supplier) {
            supplier = await prisma.supplier.create({
                data: {
                    name: vendorName,
                    code: generateSupplierCode(vendorName) + '-' + Math.floor(Math.random() * 1000)
                }
            });
        }

        // Create Opening Balance Journal Entry
        await prisma.journalEntry.create({
          data: {
            entry_date: new Date('2026-01-01'),
            description: `Opening Balance - ${supplier.name}`,
            status: 'POSTED',
            lines: {
              create: [
                {
                  account_id: payableAccount.account_id,
                  credit: closingBalance,
                  debit: 0,
                  description: `Opening Balance - ${supplier.name}`,
                },
                {
                  account_id: equityAccount.account_id,
                  debit: closingBalance,
                  credit: 0,
                  description: `Opening Balance Offset - ${supplier.name}`,
                }
              ]
            }
          }
        });
      }
      
      successCount++;

    } catch (err: any) {
      console.error(`❌ Error parsing sheet ${sheetName}:`, err.message);
    }
  }

  console.log(`\n🎉 ${DRY_RUN ? 'Dry run finished.' : 'Success!'} Processed ${successCount} vendors.`);
}


fetchAndDump()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
