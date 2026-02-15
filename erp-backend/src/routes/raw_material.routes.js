// src/routes/raw_material.routes.js
import express from 'express';
import {
  listRawMaterials,
  getRawMaterial,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  exportRawMaterials,
  importRawMaterials,
  uploadMiddleware
} from '../controllers/raw_material.controller.js';

const router = express.Router();

// POST /api/raw-materials/import - Import raw materials from CSV/Excel
router.post('/import', uploadMiddleware, importRawMaterials);

// GET /api/raw-materials - List all raw materials
router.get('/', listRawMaterials);

// GET /api/raw-materials/export - Export raw materials data
router.get('/export', exportRawMaterials);

// GET /api/raw-materials/:id - Get raw material by ID
router.get('/:id', getRawMaterial);

// POST /api/raw-materials - Create new raw material
router.post('/', createRawMaterial);

// PUT /api/raw-materials/:id - Update raw material
router.put('/:id', updateRawMaterial);

// DELETE /api/raw-materials/:id - Delete raw material
router.delete('/:id', deleteRawMaterial);

export default router;
