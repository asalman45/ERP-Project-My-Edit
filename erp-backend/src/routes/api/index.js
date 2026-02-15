// src/routes/api/index.js
import express from 'express';
import inventoryRoutes from './inventory/index.js';
import dashboardRoutes from '../dashboard.routes.js';
import purchaseOrderRoutes from '../purchaseOrder.routes.js';
import stockLevelRoutes from '../stockLevel.routes.js';
import auditTrailRoutes from '../auditTrail.routes.js';
import batchTrackingRoutes from '../batchTracking.routes.js';
import workOrderIntegrationRoutes from '../workOrderIntegration.routes.js';
import reportingRoutes from '../reporting.routes.js';
import reportsRoutes from '../reports.routes.js';
import productionRecipeRoutes from '../productionRecipe.routes.js';
import productionTrackingRoutes from '../productionTracking.routes.js';
import qualityAssuranceRoutes from './qualityAssurance.routes.js';

const router = express.Router();

/**
 * Main API Router
 * Central entry point for all API routes
 */

// Mount inventory routes
router.use('/inventory', inventoryRoutes);

// Mount quality assurance routes
router.use('/quality-assurance', qualityAssuranceRoutes);

// Mount dashboard routes
router.use('/dashboard', dashboardRoutes);

// Mount purchase order routes
router.use('/purchase-orders', purchaseOrderRoutes);

// Mount stock level management routes
router.use('/stock-levels', stockLevelRoutes);

// Mount audit trail routes
router.use('/audit-trail', auditTrailRoutes);

// Mount batch tracking routes
router.use('/batch-tracking', batchTrackingRoutes);

// Mount work order integration routes
router.use('/work-orders', workOrderIntegrationRoutes);

// Mount reporting routes
router.use('/reports', reportingRoutes);

// Mount new comprehensive reports routes
router.use('/reports', reportsRoutes);


// Mount production recipe routes
router.use('/production-recipes', productionRecipeRoutes);

// Mount production tracking routes
router.use('/production-tracking', productionTrackingRoutes);

// API health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ERP API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: {
      inventory: '/api/inventory',
      dashboard: '/api/dashboard',
      purchaseOrders: '/api/purchase-orders',
      stockLevels: '/api/stock-levels',
      auditTrail: '/api/audit-trail',
      batchTracking: '/api/batch-tracking',
      workOrderIntegration: '/api/work-orders',
      reporting: '/api/reports'
    }
  });
});

export default router;
