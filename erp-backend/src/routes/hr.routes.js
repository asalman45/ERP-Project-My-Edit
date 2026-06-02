// src/routes/hr.routes.js
import express from 'express';
import * as hrController from '../controllers/hr.controller.js';

const router = express.Router();

// Employee Routes
router.get('/employees', hrController.getEmployees);
router.post('/employees', hrController.createEmployee);

// Attendance Routes
router.post('/attendance/log', hrController.logAttendance);

// Payroll Routes
router.get('/payroll', hrController.getPayrolls);
router.post('/payroll/process', hrController.processPayroll);
router.post('/payroll/pay', hrController.paySalaries);
router.post('/payroll/approve', hrController.approvePayroll);

export default router;
