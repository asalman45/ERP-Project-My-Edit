// src/routes/crm.routes.js
import express from 'express';
import * as crmController from '../controllers/crm.controller.js';
import * as quotationController from '../controllers/quotation.controller.js';

const router = express.Router();

// Lead Routes
router.get('/leads', crmController.getLeads);
router.post('/leads', crmController.createLead);

// Opportunity Routes
router.get('/opportunities', crmController.getOpportunities);
router.post('/opportunities', crmController.createOpportunity);
router.patch('/opportunities/:oppId', crmController.updateOpportunityStage);

// Activity Routes
router.get('/activities', crmController.getActivities);
router.post('/activities', crmController.logActivity);

// Quotation Routes
router.get('/quotations', quotationController.getQuotations);
router.post('/quotations', quotationController.createQuotation);
router.post('/quotations/convert/:quoteId', quotationController.convertToSalesOrder);
router.patch('/quotations/:quoteId', quotationController.updateQuotationStatus);

export default router;
