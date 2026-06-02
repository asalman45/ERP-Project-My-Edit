// src/routes/finance.routes.js
import express from 'express';
import financeController from '../controllers/finance.controller.js';
import * as bankReconciliationController from '../controllers/bankReconciliation.controller.js';
import * as vendorPaymentController from '../controllers/vendorPayment.controller.js';
import * as taxReportingController from '../controllers/taxReporting.controller.js';
import * as financialStatementsController from '../controllers/financialStatements.controller.js';
import * as fixedAssetController from '../controllers/fixedAsset.controller.js';
import * as costCenterController from '../controllers/costCenter.controller.js';
import * as collectionAutomationController from '../controllers/collectionAutomation.controller.js';
import * as cashFlowForecastController from '../controllers/cashFlowForecast.controller.js';
import * as expenseClaimController from '../controllers/expenseClaim.controller.js';
import * as budgetController from '../controllers/budget.controller.js';
import * as currencyController from '../controllers/currency.controller.js';
import * as customerLedgerController from '../controllers/customerLedger.controller.js';
import * as financialReportsController from '../controllers/financialReports.controller.js';
import * as supplierLedgerController from '../controllers/supplierLedger.controller.js';

const router = express.Router();

// Chart of Accounts
router.get('/accounts', financeController.getAccounts);

// Journal Entries & General Ledger
router.post('/journal-entries', financeController.createJournalEntry);
router.get('/ledger', financeController.getGeneralLedger);
router.get('/customer-ledger/:customerId', customerLedgerController.getCustomerLedger);

// Supplier Ledger & AP
router.get('/supplier-ledger', supplierLedgerController.getAllSupplierSummaries);
router.get('/supplier-ledger/wht-summary', supplierLedgerController.getWHTSummary);
router.get('/supplier-ledger/:supplierId', supplierLedgerController.getSupplierLedger);

// Cash Flow Analysis
router.get('/cash-flow', financeController.getCashFlowSummary);

// NRE Ledgers
router.get('/nre-ledgers', financeController.getNRELedgers);
router.post('/nre-ledgers', financeController.createNRELedger);

// Bank Reconciliation
router.post('/bank/import', bankReconciliationController.importBankStatement);
router.get('/bank/transactions/:accountId', bankReconciliationController.getBankTransactions);
router.post('/bank/reconcile', bankReconciliationController.reconcileTransaction);
router.post('/bank/auto-match', bankReconciliationController.autoMatchTransactions);

// Vendor Payments
router.get('/vendor-payments/pending', vendorPaymentController.getPendingPayments);
router.post('/vendor-payments/schedule', vendorPaymentController.schedulePayment);
router.post('/vendor-payments/record', vendorPaymentController.recordPayment);

// Tax Reporting
router.get('/tax/gst-summary', taxReportingController.getGSTSummary);
router.get('/tax/sales-gst', taxReportingController.getSalesGSTReport);
router.get('/tax/purchase-gst', taxReportingController.getPurchaseGSTReport);

// Advanced Reporting (P&L, Balance Sheet, Aging)
router.get('/reporting/p-and-l', financialReportsController.getPnL);
router.get('/reporting/balance-sheet', financialReportsController.getBalanceSheet);
router.get('/reporting/ap-aging', financialReportsController.getAPAging);
router.get('/reporting/ar-aging', financeController.getARAging);
router.get('/reporting/expense-summary', financialReportsController.getExpenseSummary);
router.get('/reporting/tax-summary', financeController.getTaxSummary);

// Year-End Close
router.post('/year-end-close', financeController.performYearEndClose);

// Fixed Assets
router.get('/fixed-assets', fixedAssetController.getAssets);
router.post('/fixed-assets', fixedAssetController.registerAsset);
router.post('/fixed-assets/depreciate', fixedAssetController.runDepreciation);

// Cost Centers
router.get('/cost-centers', costCenterController.getCostCenters);
router.post('/cost-centers', costCenterController.createCostCenter);

// Collection Automation
router.get('/collections/overdue', collectionAutomationController.getOverdueInvoices);
router.post('/collections/send-reminder', collectionAutomationController.sendReminder);
router.get('/collections/history/:invoiceId', collectionAutomationController.getCollectionHistory);

// Cash Forecast
router.get('/reporting/cash-forecast', cashFlowForecastController.getCashForecast);

// Expense Claims
router.get('/expenses/claims', expenseClaimController.getClaims);
router.post('/expenses/claims', expenseClaimController.submitClaim);
router.post('/expenses/approve/:claimId', expenseClaimController.approveClaim);

// Budgets & Alerts
router.get('/budgets', budgetController.getBudgets);
router.post('/budgets', budgetController.setBudget);
router.post('/budgets/check-variances', budgetController.checkBudgetVariances);
router.get('/notifications', budgetController.getNotifications);

// Multi-Currency
router.get('/currencies', currencyController.getCurrencies);
router.post('/currencies/update-rate', currencyController.updateExchangeRate);
router.post('/currencies/init', currencyController.initCurrencies);

export default router;
