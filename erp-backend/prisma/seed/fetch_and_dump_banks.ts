import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import xlsx from 'xlsx';

const { readFile, utils } = xlsx;
const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN === 'true';

async function fetchAndDumpBanks() {
  const files = [
    { name: 'MBL JULY - DEC 2025.xlsx', type: 'MBL' },
    { name: 'MBL 1st Jan to 19th Mar 20261.xlsx', type: 'MBL' },
    { name: 'BAHL Statements.xlsx', type: 'BAHL' }
  ];

  console.log('🏦 Starting Bank Transaction Seeding...');
  if (DRY_RUN) console.log('🧪 DRY RUN MODE: No database changes will be made.');

  // Ensure Financial Accounts exist
  const mblAccount = await getOrCreateAccount('BNK-MBL-001', 'Meezan Bank', 'ASSET', 'BANK');
  const bahlAccount = await getOrCreateAccount('BNK-BAHL-001', 'Bank Al Habib', 'ASSET', 'BANK');
  const equityAccount = await getOrCreateAccount('AC-EQUITY-001', 'Opening Balance Equity', 'EQUITY', 'OTHER_INCOME');

  let totalSuccess = 0;

  for (const fileObj of files) {
    const filePath = path.join(process.cwd(), fileObj.name);
    console.log(`\n📂 Processing: ${fileObj.name}`);

    let workbook;
    try {
      workbook = readFile(filePath);
    } catch (err: any) {
      console.error(`❌ Error reading ${fileObj.name}: ${err.message}`);
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[][] = utils.sheet_to_json(worksheet, { header: 1 });

    const bankAccount = fileObj.type === 'MBL' ? mblAccount : bahlAccount;
    let fileSuccess = 0;

    if (fileObj.type === 'MBL') {
      fileSuccess = await parseMBL(data, bankAccount, equityAccount);
    } else {
      fileSuccess = await parseBAHL(data, bankAccount, equityAccount);
    }

    totalSuccess += fileSuccess;
    console.log(`✅ Processed ${fileSuccess} transactions from ${fileObj.name}`);
  }

  console.log(`\n🎉 Seeding completed! Total transactions processed: ${totalSuccess}`);
}

async function getOrCreateAccount(code: string, name: string, type: any, category: any) {
  if (DRY_RUN) return { account_id: `dummy-${code}`, name };
  return await prisma.financialAccount.upsert({
    where: { code },
    update: {},
    create: { code, name, type, category }
  });
}

async function parseMBL(data: any[][], bankAccount: any, equityAccount: any): Promise<number> {
  let count = 0;
  let headerFound = false;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;

    const col0 = String(row[0] || '').trim();
    if (col0 === 'Booking Date') {
      headerFound = true;
      continue;
    }

    if (!headerFound) continue;
    if (!col0 || col0 === 'Total' || col0 === 'Opening Balance') continue;

    // Parse Date (DD/MM/YYYY or similar)
    const date = parseDate(col0);
    if (!date) continue;

    const description = String(row[3] || '').trim();
    const debit = parseAmount(row[4]);
    const credit = parseAmount(row[5]);

    if (debit === 0 && credit === 0) continue;

    await createJournalEntry(date, description, bankAccount, equityAccount, debit, credit);
    count++;
  }
  return count;
}

async function parseBAHL(data: any[][], bankAccount: any, equityAccount: any): Promise<number> {
  let count = 0;
  let headerFound = false;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 5) continue;

    const col0 = String(row[0] || '').trim();
    if (col0 === 'DATE') {
      headerFound = true;
      continue;
    }

    if (!headerFound) continue;
    
    // Parse Date (handles Excel numbers)
    const date = parseDate(row[0]);
    if (!date) continue;

    const description = String(row[2] || '').trim();
    if (description === 'OPENING BALANCE' || description === 'CLOSING BALANCE') continue;

    const debit = parseAmount(row[3]);
    const credit = parseAmount(row[4]);

    if (debit === 0 && credit === 0) continue;

    await createJournalEntry(date, description, bankAccount, equityAccount, debit, credit);
    count++;
  }
  return count;
}

function parseAmount(val: any): number {
  if (val === undefined || val === null || val === '-' || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  
  // Handle Excel Serial Number
  if (typeof val === 'number') {
    return new Date((val - 25569) * 86400 * 1000);
  }

  // Handle String formats
  const str = String(val).trim();
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    // Assuming DD/MM/YYYY or MM/DD/YYYY
    // Most Pakistani banks use DD/MM/YYYY
    let d = parseInt(parts[0]);
    let m = parseInt(parts[1]) - 1;
    let y = parseInt(parts[2]);
    if (y < 100) y += 2000;
    
    // Safety check for swap if month > 12
    if (m > 11 && d <= 12) {
        const temp = d;
        d = m + 1;
        m = temp - 1;
    }
    
    return new Date(y, m, d);
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

async function createJournalEntry(
  date: Date, 
  desc: string, 
  bankAcc: any, 
  equityAcc: any, 
  debit: number, 
  credit: number
) {
  if (DRY_RUN) {
    // console.log(`[DRY RUN] ${date.toISOString().split('T')[0]} | ${desc} | Dr: ${debit} | Cr: ${credit}`);
    return;
  }

  // Double Entry Logic:
  // Credit (Into Bank): Debit Bank Account, Credit Equity Account
  // Debit (Out of Bank): Credit Bank Account, Debit Equity Account
  
  const amount = credit > 0 ? credit : debit;
  const isIncoming = credit > 0;

  await prisma.journalEntry.create({
    data: {
      entry_date: date,
      description: desc,
      status: 'POSTED',
      lines: {
        create: [
          {
            account_id: bankAcc.account_id,
            debit: isIncoming ? amount : 0,
            credit: isIncoming ? 0 : amount,
            description: desc
          },
          {
            account_id: equityAcc.account_id,
            debit: isIncoming ? 0 : amount,
            credit: isIncoming ? amount : 0,
            description: desc
          }
        ]
      }
    }
  });
}

fetchAndDumpBanks()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
