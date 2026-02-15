// src/index.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import 'express-async-errors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger.js';
import socketService from './services/socket.service.js';

// routes
import productRoutes from './routes/product.routes.js';
import oemRoutes from './routes/oem.routes.js';
import modelRoutes from './routes/model.routes.js';
import uomRoutes from './routes/uom.routes.js';
import materialRoutes from './routes/material.routes.js';
import rawMaterialRoutes from './routes/raw_material.routes.js';
import bomRoutes from './routes/bom.routes.js';
import blankSpecRoutes from './routes/blankSpec.routes.js';
import processFlowRoutes from './routes/processFlow.routes.js';
import scrapInventoryRoutes from './routes/scrapInventory.routes.js';
import bomImportRoutes from './routes/bomImport.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import supplierRoutes from './routes/supplier.routes.js';
import purchaseOrderRoutes from './routes/purchase_order.routes.js';
import goodsReceiptRoutes from './routes/goodsReceipt.routes.js';
import locationRoutes from './routes/location.routes.js';
import scrapRoutes from './routes/scrap.routes.js';
import wastageRoutes from './routes/wastage.routes.js';
import scrapReuseRoutes from './routes/scrapReuse.routes.js';
import stockAdjustmentRoutes from './routes/stockAdjustment.routes.js';
import productionTrackingRoutes from './routes/productionTracking.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import monthlyInventorySalesReportRoutes from './routes/monthlyInventorySalesReport.routes.js';
import procurementRequestRoutes from './routes/procurementRequest.routes.js';
import productionMaterialConsumptionRoutes from './routes/productionMaterialConsumption.routes.js';
import scrapManagementRoutes from './routes/scrapManagement.routes.js';
import sheetOptimizationRoutes from './routes/sheetOptimization.routes.js';
import salesOrderRoutes from './routes/salesOrder.routes.js';
import dispatchRoutes from './routes/dispatch.routes.js';
import customerInvoiceRoutes from './routes/customerInvoice.routes.js';
import oemApiRoutes from './routes/oem.routes.js';
import plannedProductionRoutes from './routes/plannedProduction.routes.js';
import internalPurchaseOrderRoutes from './routes/internalPurchaseOrder.routes.js';
import authRoutes from './routes/auth.routes.js';
import financeRoutes from './routes/finance.routes.js';

// Dual-BOM API routes
import bomApiRoutes from './routes/bomApi.routes.js';
import mrpApiRoutes from './routes/mrpApi.routes.js';
import productionApiRoutes from './routes/productionApi.routes.js';
import hierarchicalWorkOrderRoutes from './routes/hierarchicalWorkOrder.routes.js';
import crmRoutes from './routes/crm.routes.js';
import hrRoutes from './routes/hr.routes.js';
import qcRoutes from './routes/qc.routes.js';
import assetRoutes from './routes/asset.routes.js';

// Test import controller
import { importSampleBOMData, getSampleBOMData } from './controllers/testImport.controller.js';

// New comprehensive inventory API routes
import inventoryApiRoutes from './routes/api/index.js';
import qualityAssuranceController from './controllers/api/qualityAssurance.controller.js';

dotenv.config();

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://erp_user:erp_pass123@localhost:5433/erp_db";
}
if (!process.env.PORT) {
  process.env.PORT = "4000";
}

const app = express();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081', 'http://localhost:9000', 'http://127.0.0.1:5173', 'http://127.0.0.1:8081', 'http://127.0.0.1:9000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/oems', oemRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/uoms', uomRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/bom', bomRoutes);
app.use('/api/blank-specs', blankSpecRoutes);
app.use('/api/process-flows', processFlowRoutes);
app.use('/api/scrap-inventory', scrapInventoryRoutes);
app.use('/api/bom-import', bomImportRoutes);
app.use('/api/inventory', inventoryRoutes); // Legacy inventory routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/goods-receipt', goodsReceiptRoutes);
app.use('/api/hierarchical-work-order', hierarchicalWorkOrderRoutes); // Hierarchical WO routes
app.use('/api/locations', locationRoutes);
app.use('/api/scrap', scrapRoutes);
app.use('/api/wastage', wastageRoutes);
app.use('/api/scrap-reuse', scrapReuseRoutes);
app.use('/api/stock-adjustment', stockAdjustmentRoutes);
app.use('/api/production-tracking', productionTrackingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/reports', monthlyInventorySalesReportRoutes);
app.use('/api/procurement', procurementRequestRoutes);
app.use('/api/production-material-consumption', productionMaterialConsumptionRoutes);
app.use('/api/scrap-management', scrapManagementRoutes);
app.use('/api/sheet-optimization', sheetOptimizationRoutes);
app.use('/api/sales-orders', salesOrderRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/customer-invoices', customerInvoiceRoutes);
app.use('/api/oems', oemApiRoutes);
app.use('/api/planned-production', plannedProductionRoutes);
app.use('/api/internal-purchase-orders', internalPurchaseOrderRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/qc', qcRoutes);
app.use('/api/assets', assetRoutes);

// Dual-BOM API routes
app.use('/api/bom-api', bomApiRoutes);
app.use('/api/mrp', mrpApiRoutes);
app.use('/api/mrp-api', mrpApiRoutes);
app.use('/api/production', productionApiRoutes);

// New comprehensive inventory API routes
app.use('/api', inventoryApiRoutes);

// Quality Assurance routes
app.post('/api/quality-assurance/:inventoryId', qualityAssuranceController.updateQAStatus);

// Test import routes
app.post('/api/test/import-sample-bom', importSampleBOMData);
app.get('/api/test/sample-bom-data', getSampleBOMData);

// global error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
socketService.initialize(server);

// Start server
server.listen(PORT, () => logger.info({ port: PORT }, 'Server started with WebSocket support'));
