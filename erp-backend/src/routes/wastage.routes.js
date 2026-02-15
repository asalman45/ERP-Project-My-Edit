// src/routes/wastage.routes.js
import express from 'express';
import {
  createWastage,
  getAllWastage,
  getWastageById,
  updateWastage,
  getWastageByWorkOrder,
  getWastageByMaterial,
  getWastageSummary
} from '../controllers/wastage.controller.js';

const router = express.Router();

// Wastage CRUD
router.get('/', getAllWastage);
router.get('/summary', getWastageSummary);
router.get('/:id', getWastageById);
router.post('/', createWastage);
router.patch('/:id', updateWastage);

// Wastage by work order/material
router.get('/work-order/:woId', getWastageByWorkOrder);
router.get('/material/:materialId', getWastageByMaterial);

export default router;
