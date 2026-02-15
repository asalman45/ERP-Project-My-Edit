// src/routes/bomApi.routes.js
// Routes for BOM API (Production Recipe + Cutting BOM integration)

import express from 'express';
import bomApiController from '../controllers/api/bomApi.controller.js';

const router = express.Router();

// BOM explosion (dual-level)
router.post('/explode', bomApiController.explodeBOM);

// Get production recipe BOM for a product
router.get('/production-recipe/:productId', bomApiController.getProductionRecipe);

// Create or update BOM item
router.post('/item', bomApiController.createOrUpdateBOMItem);

// Delete BOM item
router.delete('/item/:bomId', bomApiController.deleteBOMItem);

// Link cut part to blank spec
router.post('/link-cut-part', bomApiController.linkCutPartToBlankSpec);

// Get BOM explosion history/audit log
router.get('/explosion-log/:productId', bomApiController.getBOMExplosionLog);

export default router;

