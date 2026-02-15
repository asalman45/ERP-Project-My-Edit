// src/routes/bom.routes.js
import express from 'express';
import {
  getBOM, addMaterial, removeMaterial, removeSubAssembly, updateQuantity,
  getBOMWithSubAssemblies, calculateMaterialConsumption, getProcessFlow,
  addSubAssembly, getReusableMaterials, optimizeMaterialUsage,
  importBOMFromSpreadsheet, exportBOMData, exportScrapData, getBOMInStandardFormat,
  getScrapManagement
} from '../controllers/bom.controller.js';

const router = express.Router();

// Original BOM routes
router.get('/:productId', getBOM);
router.post('/', addMaterial);
router.delete('/:productId/:materialId', removeMaterial);
router.patch('/:productId/:materialId', updateQuantity);

// Enhanced BOM routes for spreadsheet-like functionality
router.get('/:productId/sub-assemblies', getBOMWithSubAssemblies);
router.post('/:productId/sub-assemblies', addSubAssembly);
router.delete('/:productId/sub-assemblies/:subAssemblyName', removeSubAssembly);
router.post('/:productId/calculate-consumption', calculateMaterialConsumption);
router.get('/:productId/process-flow', getProcessFlow);
router.get('/:productId/reusable-materials', getReusableMaterials);
router.post('/:productId/optimize-usage', optimizeMaterialUsage);

// New standardized BOM format routes
router.get('/:productId/standard-format', getBOMInStandardFormat);
router.get('/:productId/scrap-management', getScrapManagement);
router.post('/import/spreadsheet', importBOMFromSpreadsheet);
router.get('/export/bom', exportBOMData);
router.get('/export/scrap', exportScrapData);

export default router;
