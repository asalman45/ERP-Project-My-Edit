// src/controllers/finance.controller.js
import db from '../utils/db.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Get all financial accounts (Chart of Accounts)
 */
export async function getAccounts(req, res) {
  try {
    const accounts = await prisma.financialAccount.findMany({
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching financial accounts');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Create a new journal entry
 */
export async function createJournalEntry(req, res) {
  const { entry_date, reference, description, lines } = req.body;

  if (!lines || lines.length < 2) {
    return res.status(400).json({ 
      success: false, 
      error: 'A journal entry must have at least two lines (Balanced Entry)' 
    });
  }

  // Basic balance check
  const totalDebit = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return res.status(400).json({ 
      success: false, 
      error: 'Debit and Credit must be equal' 
    });
  }

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        entry_date: entry_date ? new Date(entry_date) : new Date(),
        reference,
        description,
        lines: {
          create: lines.map(line => ({
            account_id: line.account_id,
            debit: line.debit,
            credit: line.credit,
            description: line.description,
            nre_id: line.nre_id,
            cash_flow_type: line.cash_flow_type
          }))
        }
      },
      include: { lines: true }
    });

    res.json({ success: true, data: entry });
  } catch (error) {
    logger.error({ error: error.message }, 'Error creating journal entry');
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Get General Ledger records
 */
export async function getGeneralLedger(req, res) {
  const { account_id, start_date, end_date } = req.query;

  try {
    const where = {};
    if (account_id) where.account_id = account_id;
    if (start_date || end_date) {
      where.entry = {
        entry_date: {
          ...(start_date && { gte: new Date(start_date) }),
          ...(end_date && { lte: new Date(end_date) })
        }
      };
    }

    const ledger = await prisma.journalLine.findMany({
      where,
      include: {
        entry: true,
        account: true,
        nre: true
      },
      orderBy: {
        entry: { entry_date: 'desc' }
      }
    });

    const formattedLedger = ledger.map(line => ({
      line_id: line.line_id,
      date: line.entry.entry_date,
      voucher_number: line.entry.voucher_number,
      account_code: line.account?.code || '',
      account_name: line.account?.name || 'Unknown Account',
      debit: line.debit,
      credit: line.credit,
      description: line.description || line.entry.description,
      status: line.entry.status
    }));

    res.json({ success: true, data: formattedLedger });
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching general ledger');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Get Cash Flow Summary
 */
export async function getCashFlowSummary(req, res) {
  try {
    const cashFlow = await prisma.journalLine.groupBy({
      by: ['cash_flow_type'],
      where: {
        NOT: { cash_flow_type: null }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });

    // Calculate net cash for each category
    const summary = cashFlow.map(item => ({
      type: item.cash_flow_type,
      net: parseFloat(item._sum.debit || 0) - parseFloat(item._sum.credit || 0)
    }));

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error({ error: error.message }, 'Error calculating cash flow');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * NRE Ledger Controllers
 */
export async function getNRELedgers(req, res) {
  try {
    const ledgers = await prisma.nRELedger.findMany({
      include: { product: true }
    });
    res.json({ success: true, data: ledgers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createNRELedger(req, res) {
  const { nre_code, name, description, product_id, estimated_cost } = req.body;
  try {
    const ledger = await prisma.nRELedger.create({
      data: {
        nre_code,
        name,
        description,
        product_id,
        estimated_cost
      }
    });
    res.json({ success: true, data: ledger });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * ==========================================
 * PRODUCTION READINESS - FINANCE MODULE
 * ==========================================
 */

/**
 * Get AR Aging (Accounts Receivable)
 * Tracks overdue payments from customers.
 * Since we don't have a direct CustomerInvoice model yet that pairs with AR,
 * we will simulate this by checking unpaid Sales Orders that have been shipped/invoiced.
 */
export async function getARAging(req, res) {
  try {
    // In a fully featured system, this would query the `Invoice` table where type='CUSTOMER'
    // For now, we look at Sales Orders that are completed but perhaps not fully paid.
    // Since payment tracking per SO isn't explicitly in schema, we'll return a stubbed aging report 
    // based on completed sales orders to demonstrate the structure.
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] }
      },
      include: {
        customer: true
      }
    });

    // Bucket them by age
    const agingData = salesOrders.map(so => {
      const soDate = new Date(so.created_at);
      let bucket = 'Current';
      if (soDate < ninetyDaysAgo) bucket = '> 90 Days';
      else if (soDate < sixtyDaysAgo) bucket = '61-90 Days';
      else if (soDate < thirtyDaysAgo) bucket = '31-60 Days';

      return {
        customer: so.customer?.name || 'Unknown',
        so_no: so.so_no,
        amount: Number(so.total_amount),
        date: soDate,
        bucket
      };
    });

    // Aggregate by bucket
    const summary = {
      'Current': agingData.filter(d => d.bucket === 'Current').reduce((sum, d) => sum + d.amount, 0),
      '31-60 Days': agingData.filter(d => d.bucket === '31-60 Days').reduce((sum, d) => sum + d.amount, 0),
      '61-90 Days': agingData.filter(d => d.bucket === '61-90 Days').reduce((sum, d) => sum + d.amount, 0),
      '> 90 Days': agingData.filter(d => d.bucket === '> 90 Days').reduce((sum, d) => sum + d.amount, 0),
    };

    res.json({ success: true, data: { details: agingData, summary } });
  } catch (error) {
    logger.error({ error: error.message }, 'Error fetching AR Aging');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Get Tax Summary
 * Automates GST/VAT calculation for a given period.
 */
export async function getTaxSummary(req, res) {
  const { start_date, end_date } = req.query;
  
  try {
    let startDate = start_date ? new Date(start_date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1); // Default to start of current month
    let endDate = end_date ? new Date(end_date) : new Date();

    const taxAccounts = await prisma.financialAccount.findMany({
      where: {
        OR: [
          { name: { contains: 'Tax', mode: 'insensitive' } },
          { name: { contains: 'GST', mode: 'insensitive' } },
          { name: { contains: 'VAT', mode: 'insensitive' } }
        ]
      }
    });

    const accountIds = taxAccounts.map(a => a.account_id);

    const taxLines = await prisma.journalLine.findMany({
      where: {
        account_id: { in: accountIds },
        entry: {
          entry_date: {
            gte: startDate,
            lte: endDate
          },
          status: 'POSTED'
        }
      },
      include: {
        account: true,
        entry: true
      }
    });

    let taxCollected = 0; // Credits
    let taxPaid = 0; // Debits

    taxLines.forEach(line => {
      taxCollected += Number(line.credit);
      taxPaid += Number(line.debit);
    });

    res.json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate
        },
        tax_collected: taxCollected,
        tax_paid: taxPaid,
        net_liability: taxCollected - taxPaid,
        details: taxLines.map(l => ({
          date: l.entry.entry_date,
          account: l.account.name,
          type: Number(l.credit) > 0 ? 'Collected' : 'Paid',
          amount: Number(l.credit) > 0 ? Number(l.credit) : Number(l.debit)
        }))
      }
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Error calculating Tax Summary');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

/**
 * Perform Year-End Close
 * Closes out Revenue and Expense accounts to Retained Earnings.
 */
export async function performYearEndClose(req, res) {
  const { year, retained_earnings_account_id } = req.body;

  if (!year || !retained_earnings_account_id) {
    return res.status(400).json({ success: false, error: 'Year and Retained Earnings Account ID are required.' });
  }

  try {
    // 1. Get all revenue and expense accounts
    const targetAccounts = await prisma.financialAccount.findMany({
      where: {
        type: { in: ['REVENUE', 'EXPENSE'] }
      }
    });
    
    const accountIds = targetAccounts.map(a => a.account_id);

    // 2. Calculate net balances for the given year
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const lines = await prisma.journalLine.findMany({
      where: {
        account_id: { in: accountIds },
        entry: {
          entry_date: {
            gte: startDate,
            lte: endDate
          },
          status: 'POSTED'
        }
      }
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    // Accounts map for creating the closing entry
    const closingLines = [];

    // We need to zero out each account.
    // If Revenue has credit balance, debit it to zero.
    // If Expense has debit balance, credit it to zero.
    for (const account of targetAccounts) {
      const acctLines = lines.filter(l => l.account_id === account.account_id);
      const debits = acctLines.reduce((sum, l) => sum + Number(l.debit), 0);
      const credits = acctLines.reduce((sum, l) => sum + Number(l.credit), 0);
      
      const net = account.type === 'REVENUE' ? (credits - debits) : (debits - credits);

      if (net > 0) {
        if (account.type === 'REVENUE') {
          totalRevenue += net;
          closingLines.push({ account_id: account.account_id, debit: net, credit: 0, description: `Close FY${year} Revenue` });
        } else {
          totalExpense += net;
          closingLines.push({ account_id: account.account_id, debit: 0, credit: net, description: `Close FY${year} Expense` });
        }
      }
    }

    const netIncome = totalRevenue - totalExpense;

    // 3. Post to Retained Earnings
    if (netIncome > 0) {
      closingLines.push({ account_id: retained_earnings_account_id, debit: 0, credit: netIncome, description: `Net Income FY${year} to Retained Earnings` });
    } else if (netIncome < 0) {
      closingLines.push({ account_id: retained_earnings_account_id, debit: Math.abs(netIncome), credit: 0, description: `Net Loss FY${year} to Retained Earnings` });
    }

    if (closingLines.length < 2) {
       return res.json({ success: true, message: 'No revenue or expenses to close for this year.' });
    }

    // 4. Create the comprehensive Journal Entry
    const closingEntry = await prisma.journalEntry.create({
      data: {
        entry_date: new Date(),
        reference: `YEC-${year}`,
        description: `Year-End Closing Entry for FY${year}`,
        lines: {
          create: closingLines
        }
      },
      include: { lines: true }
    });

    res.json({ 
      success: true, 
      data: closingEntry,
      summary: {
        total_revenue_closed: totalRevenue,
        total_expense_closed: totalExpense,
        net_income_transferred: netIncome
      }
    });

  } catch (error) {
    logger.error({ error: error.message }, 'Error performing Year End Close');
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

export default {
  getAccounts,
  createJournalEntry,
  getGeneralLedger,
  getCashFlowSummary,
  getNRELedgers,
  createNRELedger,
  getARAging,
  getTaxSummary,
  performYearEndClose
};
