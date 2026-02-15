// src/controllers/expenseClaim.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Submit an expense claim
 * POST /api/finance/expenses/claims
 */
export async function submitClaim(req, res) {
    const { employee_name, description, amount, category, receipt_url } = req.body;
    try {
        const claim = await prisma.expenseClaim.create({
            data: {
                employee_name,
                description,
                amount,
                category,
                receipt_url,
                status: 'PENDING'
            }
        });
        res.json({ success: true, data: claim });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Approve and Post Expense Claim to General Ledger
 * POST /api/finance/expenses/approve/:claimId
 */
export async function approveClaim(req, res) {
    const { claimId } = req.params;
    const { approved_by, account_id } = req.body; // account_id is the Cash/Bank account to pay from

    try {
        const claim = await prisma.expenseClaim.findUnique({ where: { claim_id: claimId } });
        if (!claim) return res.status(404).json({ success: false, error: 'Claim not found' });

        // 1. Create Journal Entry
        const entry = await prisma.journalEntry.create({
            data: {
                entry_date: new Date(),
                description: `Expense Reimbursement: ${claim.description} (${claim.employee_name})`,
                reference: claim.claim_id,
                status: 'POSTED',
                lines: {
                    create: [
                        {
                            account_id: 'EXPENSE_GEN_ACC_ID', // TODO: Map category to specific expense account
                            debit: claim.amount,
                            credit: 0,
                            description: claim.description
                        },
                        {
                            account_id: account_id,
                            debit: 0,
                            credit: claim.amount,
                            description: `Payment to ${claim.employee_name}`
                        }
                    ]
                }
            }
        });

        // 2. Update Claim Status
        const updatedClaim = await prisma.expenseClaim.update({
            where: { claim_id: claimId },
            data: {
                status: 'PAID',
                approved_by,
                approved_at: new Date(),
                journal_id: entry.entry_id
            }
        });

        res.json({ success: true, data: updatedClaim });
    } catch (error) {
        logger.error({ error: error.message }, 'Error approving expense claim');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get all claims
 * GET /api/finance/expenses/claims
 */
export async function getClaims(req, res) {
    try {
        const claims = await prisma.expenseClaim.findMany({
            orderBy: { claim_date: 'desc' }
        });
        res.json({ success: true, data: claims });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default { submitClaim, approveClaim, getClaims };
