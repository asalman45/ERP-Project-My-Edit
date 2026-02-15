// src/routes/material.routes.js
import express from 'express';
import {
  listMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial
} from '../controllers/material.controller.js';

const router = express.Router();

router.get('/', listMaterials);
router.get('/:id', getMaterial);
router.post('/', createMaterial);
router.patch('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;
