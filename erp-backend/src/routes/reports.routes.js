// src/routes/reports.routes.js
import express from 'express';
import {
  generateProductionReport,
  generateScrapReport,
  generateInventoryReport,
  generateCostAnalysisReport
} from '../controllers/simple-reports.controller.js';
import {
  generateSalesOrderReport,
  generateExpenseReport,
  generateIncomeReport,
  generateSalesTaxReport,
  generateDispatchReport,
  generateInvoicingReport,
  generatePaymentReport,
  generateDetailedProductionReport,
  generateTrackingReport,
  generateWorkOrderReport,
  generateProcessFlowReport,
  generateFinishedGoodsReport,
  generateBOMReport,
  generateReceiptSalesReport,
  generateCustomerLedgerExport
} from '../controllers/detailedReports.controller.js';

const router = express.Router();

/**
 * Reports Routes
 * GET /api/reports/production - Generate production report
 * GET /api/reports/scrap - Generate scrap management report
 * GET /api/reports/inventory - Generate inventory report
 * GET /api/reports/cost-analysis - Generate cost analysis report
 * 
 * Detailed Reports Routes
 * GET /api/reports/detailed/sales-orders - Generate sales order report
 * GET /api/reports/detailed/expenses - Generate expense report
 * GET /api/reports/detailed/income - Generate income report
 * GET /api/reports/detailed/sales-tax - Generate sales tax report
 */

// Production Report
router.get('/production', generateProductionReport);

// Scrap Management Report
router.get('/scrap', generateScrapReport);

// Inventory Report
router.get('/inventory', generateInventoryReport);

// Cost Analysis Report
router.get('/cost-analysis', generateCostAnalysisReport);

// Detailed Reports
router.get('/detailed/sales-orders', generateSalesOrderReport);
router.get('/detailed/expenses', generateExpenseReport);
router.get('/detailed/income', generateIncomeReport);
router.get('/detailed/sales-tax', generateSalesTaxReport);
router.get('/detailed/dispatch', generateDispatchReport);
router.get('/detailed/invoicing', generateInvoicingReport);
router.get('/detailed/payment', generatePaymentReport);
router.get('/detailed/production', generateDetailedProductionReport);
router.get('/detailed/tracking', generateTrackingReport);
router.get('/detailed/work-order', generateWorkOrderReport);
router.get('/detailed/process-flow', generateProcessFlowReport);
router.get('/detailed/finished-goods', generateFinishedGoodsReport);
router.get('/detailed/bom', generateBOMReport);
router.get('/detailed/receipt-sales', generateReceiptSalesReport);
router.get('/detailed/customer-ledger', generateCustomerLedgerExport);

export default router;