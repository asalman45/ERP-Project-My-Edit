// src/controllers/hr.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Employee Management
 */
export async function getEmployees(req, res) {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: { created_at: 'desc' }
        });
        res.json({ success: true, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function createEmployee(req, res) {
    const { first_name, last_name, email, phone, department, designation, doj, base_salary, bank_account, pan_no } = req.body;
    try {
        const count = await prisma.employee.count();
        const emp_code = `EMP${(count + 1).toString().padStart(3, '0')}`;
        const employee = await prisma.employee.create({
            data: { emp_code, first_name, last_name, email, phone, department, designation, doj: new Date(doj), base_salary, bank_account, pan_no }
        });
        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Attendance Tracking
 */
export async function logAttendance(req, res) {
    const { emp_id, date, status, clock_in, clock_out, remarks } = req.body;
    try {
        const attendance = await prisma.attendance.upsert({
            where: { emp_id_date: { emp_id, date: new Date(date) } },
            update: { status, clock_in, clock_out, remarks },
            create: { emp_id, date: new Date(date), status, clock_in, clock_out, remarks }
        });
        res.json({ success: true, data: attendance });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Payroll Processing
 */
export async function processPayroll(req, res) {
    const { month, year } = req.body;
    try {
        const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
        const payrolls = [];

        for (const emp of employees) {
            // Logic for calculating salary based on attendance would go here
            // For now, we take base salary as gross
            const gross = parseFloat(emp.base_salary);
            const deductions = 0; // Simulate PF/ESI if needed
            const net = gross - deductions;

            const payroll = await prisma.payroll.upsert({
                where: { emp_id_month_year: { emp_id: emp.emp_id, month, year } },
                update: { gross_salary: gross, deductions, net_salary: net },
                create: { emp_id: emp.emp_id, month, year, gross_salary: gross, deductions, net_salary: net }
            });
            payrolls.push(payroll);
        }

        res.json({ success: true, message: `Payroll processed for ${payrolls.length} employees`, data: payrolls });
    } catch (error) {
        logger.error({ error: error.message }, 'Payroll processing failed');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Pay Salary & Post to Ledger
 */
export async function paySalaries(req, res) {
    const { payrollIds, account_id } = req.body; // account_id is Bank account to pay from
    try {
        const results = [];
        for (const pid of payrollIds) {
            const payroll = await prisma.payroll.findUnique({
                where: { payroll_id: pid },
                include: { employee: true }
            });

            if (payroll && payroll.status !== 'PAID') {
                // 1. Create Journal Entry
                const salaryExpAcc = await prisma.financialAccount.findFirst({ where: { code: 'EXP-SALARY' } });
                const paymentAcc = await prisma.financialAccount.findUnique({ where: { account_id } }) ||
                    await prisma.financialAccount.findFirst({ where: { category: 'BANK' } });

                if (salaryExpAcc && paymentAcc) {
                    const entry = await prisma.journalEntry.create({
                        data: {
                            reference: `SAL-${payroll.year}${payroll.month}-${payroll.employee.emp_code}`,
                            description: `Salary Payment - ${payroll.employee.first_name} ${payroll.employee.last_name}`,
                            lines: {
                                create: [
                                    { account_id: salaryExpAcc.account_id, debit: payroll.net_salary, credit: 0 },
                                    { account_id: paymentAcc.account_id, debit: 0, credit: payroll.net_salary }
                                ]
                            }
                        }
                    });

                    // 2. Update Payroll status
                    const updated = await prisma.payroll.update({
                        where: { payroll_id: pid },
                        data: { status: 'PAID', payment_date: new Date(), journal_id: entry.entry_id }
                    });
                    results.push(updated);
                } else {
                    logger.warn('Salary payment skipped: Financial accounts not mapped');
                }
            }
        }
        res.json({ success: true, paid_count: results.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getEmployees,
    createEmployee,
    logAttendance,
    processPayroll,
    paySalaries
};
