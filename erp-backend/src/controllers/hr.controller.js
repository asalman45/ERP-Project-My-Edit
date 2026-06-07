// src/controllers/hr.controller.js
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PAYROLL_SETTINGS_PATH = path.join(__dirname, '..', 'config', 'payrollSettings.json');

/**
 * Load payroll settings from config file
 */
const loadPayrollSettings = () => {
  try {
    const raw = fs.readFileSync(PAYROLL_SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {
      taxBrackets: [
        { minGross: 100000, rate: 0.20 },
        { minGross: 50000, rate: 0.10 },
        { minGross: 0, rate: 0.05 }
      ]
    };
  }
};


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
    const { first_name, last_name, email, phone, department, designation, doj, base_salary, bank_account, pan_no, image_url } = req.body;
    try {
        const count = await prisma.employee.count();
        const emp_code = `EMP${(count + 1).toString().padStart(3, '0')}`;
        const employee = await prisma.employee.create({
            data: { emp_code, first_name, last_name, email, phone, department, designation, doj: new Date(doj), base_salary, bank_account, pan_no, image_url }
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
 * Get Payrolls (by month/year)
 */
export async function getPayrolls(req, res) {
    const { month, year } = req.query;
    try {
        const where = {};
        if (month) where.month = parseInt(month);
        if (year) where.year = parseInt(year);
        const payrolls = await prisma.payroll.findMany({
            where,
            include: { employee: true },
            orderBy: { payroll_id: 'desc' }
        });
        res.json({ success: true, data: payrolls });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Payroll Processing — with attendance-based deductions and configurable tax slabs
 */
export async function processPayroll(req, res) {
    const { month, year } = req.body;
    try {
        const settings = loadPayrollSettings();
        const taxBrackets = (settings.taxBrackets || [])
            .sort((a, b) => b.minGross - a.minGross); // descending order

        const employees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });
        const payrolls = [];

        // Calculate number of calendar days in the given month/year
        const daysInMonth = new Date(year, month, 0).getDate();

        for (const emp of employees) {
            const baseSalary = parseFloat(emp.base_salary);

            // Query attendance for this employee this month/year
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const attendanceRecords = await prisma.attendance.findMany({
                where: {
                    emp_id: emp.emp_id,
                    date: { gte: startDate, lte: endDate }
                }
            });

            const absentDays = attendanceRecords.filter(a => a.status === 'ABSENT').length;
            const halfDays = attendanceRecords.filter(a => a.status === 'HALF_DAY').length;

            const dailyRate = baseSalary / daysInMonth;
            const absentDeduction = absentDays * dailyRate;
            const halfDayDeduction = halfDays * (dailyRate * 0.5);

            const gross = Math.max(0, baseSalary - absentDeduction - halfDayDeduction);

            // Dynamic tax from configured slabs
            let taxRate = 0.05; // default fallback
            for (const bracket of taxBrackets) {
                if (gross >= bracket.minGross) {
                    taxRate = bracket.rate;
                    break;
                }
            }

            const taxDeduction = gross * taxRate;
            const deductions = taxDeduction;
            const net = gross - deductions;

            // High-value Payroll requires strict Approval
            const payrollStatus = gross >= 100000 ? 'PENDING_APPROVAL' : 'APPROVED';

            const payroll = await prisma.payroll.upsert({
                where: { emp_id_month_year: { emp_id: emp.emp_id, month, year } },
                update: { gross_salary: gross, deductions, net_salary: net, status: payrollStatus },
                create: { emp_id: emp.emp_id, month, year, gross_salary: gross, deductions, net_salary: net, status: payrollStatus }
            });
            payrolls.push({
                ...payroll,
                _meta: { absentDays, halfDays, taxRate, daysInMonth }
            });
        }

        res.json({
            success: true,
            message: `Payroll processed for ${payrolls.length} employees`,
            data: payrolls
        });
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

            if (payroll && payroll.status === 'APPROVED') {
                // 1. Create Journal Entry
                const salaryExpAcc = await prisma.financialAccount.findFirst({ where: { code: 'EXP-SALARY' } });
                let paymentAcc = null;
                if (account_id) {
                    paymentAcc = await prisma.financialAccount.findUnique({ where: { account_id } });
                }
                if (!paymentAcc) {
                    paymentAcc = await prisma.financialAccount.findFirst({ where: { category: 'BANK' } });
                }

                if (salaryExpAcc && paymentAcc) {
                    // Check for Income Tax Payable account
                    let taxAcc = await prisma.financialAccount.findFirst({ where: { name: { contains: 'Tax Payable', mode: 'insensitive' } } });
                    if (!taxAcc) {
                        taxAcc = await prisma.financialAccount.create({
                            data: { code: '2100', name: 'Income Tax Payable', type: 'LIABILITY', category: 'OTHER_EXPENSE' }
                        });
                    }

                    const entry = await prisma.journalEntry.create({
                        data: {
                            reference: `SAL-${payroll.year}${payroll.month}-${payroll.employee.emp_code}`,
                            description: `Salary Payment - ${payroll.employee.first_name} ${payroll.employee.last_name}`,
                            lines: {
                                create: [
                                    { account_id: salaryExpAcc.account_id, debit: payroll.gross_salary, credit: 0 },
                                    { account_id: paymentAcc.account_id, debit: 0, credit: payroll.net_salary },
                                    { account_id: taxAcc.account_id, debit: 0, credit: payroll.deductions }
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

/**
 * Approve High-Value Payrolls
 */
export async function approvePayroll(req, res) {
    const { payrollIds } = req.body;
    try {
        if (!payrollIds || !Array.isArray(payrollIds)) {
            return res.status(400).json({ success: false, error: 'payrollIds array is required' });
        }

        const updated = await prisma.payroll.updateMany({
            where: {
                payroll_id: { in: payrollIds },
                status: 'PENDING_APPROVAL'
            },
            data: { status: 'APPROVED' }
        });

        res.json({ success: true, approved_count: updated.count });
    } catch (error) {
        logger.error({ error }, 'Failed to approve payroll');
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Get Payroll Settings (tax brackets config)
 */
export async function getPayrollSettings(req, res) {
    try {
        const settings = loadPayrollSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Update Payroll Settings (tax brackets config)
 */
export async function updatePayrollSettings(req, res) {
    try {
        const { taxBrackets } = req.body;
        if (!Array.isArray(taxBrackets) || taxBrackets.length === 0) {
            return res.status(400).json({ success: false, error: 'taxBrackets must be a non-empty array' });
        }
        const existing = loadPayrollSettings();
        const updated = {
            ...existing,
            taxBrackets,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user?.username || 'Admin'
        };
        fs.writeFileSync(PAYROLL_SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf8');
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * Generate Payslip PDF
 */
export async function generatePayslipPdf(req, res) {
    const { id } = req.params;
    try {
        const payroll = await prisma.payroll.findUnique({
            where: { payroll_id: id },
            include: { employee: true }
        });
        
        if (!payroll) return res.status(404).send('Payroll not found');
        
        const html = `
        <html>
            <head><style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #4f46e5; margin: 0; }
                .details { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .amount-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .amount-table th, .amount-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                .amount-table th { background-color: #f8fafc; }
                .total { font-weight: bold; font-size: 1.2em; color: #10b981; }
            </style></head>
            <body>
                <div class="header">
                    <h1>EmpclERP Payslip</h1>
                    <p>Salary Slip for ${payroll.month}/${payroll.year}</p>
                </div>
                <div class="details">
                    <div>
                        <p><strong>Employee Name:</strong> ${payroll.employee.first_name} ${payroll.employee.last_name}</p>
                        <p><strong>Employee ID:</strong> ${payroll.employee.emp_code}</p>
                    </div>
                    <div>
                        <p><strong>Department:</strong> ${payroll.employee.department}</p>
                        <p><strong>Designation:</strong> ${payroll.employee.designation}</p>
                    </div>
                </div>
                <table class="amount-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: right;">Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Gross Salary</td>
                            <td style="text-align: right;">${parseFloat(payroll.gross_salary).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>Deductions</td>
                            <td style="text-align: right; color: #ef4444;">- ${parseFloat(payroll.deductions).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td class="total">Net Payable Salary</td>
                            <td class="total" style="text-align: right;">${parseFloat(payroll.net_salary).toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
                <p style="margin-top: 50px; text-align: center; color: #888; font-size: 0.9em;">This is a computer-generated document. No signature is required.</p>
            </body>
        </html>
        `;
        
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=payslip_${payroll.employee.emp_code}_${payroll.month}_${payroll.year}.pdf`);
        res.send(pdf);
    } catch (error) {
        logger.error({ error: error.message }, 'Failed to generate PDF payslip');
        res.status(500).json({ success: false, error: 'Failed to generate PDF payslip' });
    }
}

/**
 * Leave Management
 */
export async function applyLeave(req, res) {
    try {
        const { emp_id, leave_type, start_date, end_date, reason } = req.body;
        const leave = await prisma.leaveRequest.create({
            data: {
                emp_id,
                leave_type,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                reason
            }
        });
        res.json({ success: true, data: leave });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getLeaveRequests(req, res) {
    try {
        const leaves = await prisma.leaveRequest.findMany({
            include: { employee: true },
            orderBy: { applied_at: 'desc' }
        });
        res.json({ success: true, data: leaves });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function updateLeaveStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const leave = await prisma.leaveRequest.update({
            where: { leave_id: id },
            data: { 
                status,
                reviewed_at: new Date(),
                reviewed_by: req.user?.username || 'Admin'
            }
        });
        res.json({ success: true, data: leave });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getEmployees,
    createEmployee,
    getPayrolls,
    logAttendance,
    processPayroll,
    paySalaries,
    approvePayroll,
    getPayrollSettings,
    updatePayrollSettings,
    generatePayslipPdf,
    applyLeave,
    getLeaveRequests,
    updateLeaveStatus
};
