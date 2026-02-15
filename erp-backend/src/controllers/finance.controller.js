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

    res.json({ success: true, data: ledger });
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

export default {
  getAccounts,
  createJournalEntry,
  getGeneralLedger,
  getCashFlowSummary,
  getNRELedgers,
  createNRELedger
};
