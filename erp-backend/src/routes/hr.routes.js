// src/routes/hr.routes.js
import express from 'express';
import * as hrController from '../controllers/hr.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkRole } from '../middleware/rbac.middleware.js';

const router = express.Router();

// Public / general employee routes (could be unprotected or just authenticated)
router.get('/employees', authenticate, hrController.getEmployees);
router.post('/employees', authenticate, checkRole(['Admin', 'HR']), hrController.createEmployee);

// Attendance Routes
router.post('/attendance/log', authenticate, hrController.logAttendance);

// Payroll Routes (Highly sensitive)
const payrollRoles = ['Admin', 'HR', 'Finance'];
router.get('/payroll', authenticate, checkRole(payrollRoles), hrController.getPayrolls);
router.post('/payroll/process', authenticate, checkRole(payrollRoles), hrController.processPayroll);
router.post('/payroll/pay', authenticate, checkRole(payrollRoles), hrController.paySalaries);
router.post('/payroll/approve', authenticate, checkRole(payrollRoles), hrController.approvePayroll);
router.get('/payroll/:id/pdf', authenticate, checkRole(payrollRoles), hrController.generatePayslipPdf);

// Payroll Settings Routes (configurable tax brackets)
router.get('/payroll/settings', authenticate, checkRole(payrollRoles), hrController.getPayrollSettings);
router.post('/payroll/settings', authenticate, checkRole(['Admin', 'HR']), hrController.updatePayrollSettings);

// Leave Management Routes
router.post('/leave/apply', authenticate, hrController.applyLeave);
router.get('/leave/requests', authenticate, checkRole(payrollRoles), hrController.getLeaveRequests);
router.patch('/leave/requests/:id', authenticate, checkRole(payrollRoles), hrController.updateLeaveStatus);

export default router;
