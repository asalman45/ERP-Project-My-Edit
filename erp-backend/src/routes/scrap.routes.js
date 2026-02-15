// src/routes/scrap.routes.js
import express from 'express';
import {
  createScrap,
  getAllScrap,
  getScrapById,
  updateScrapStatus,
  createScrapTransaction,
  getScrapTransactions,
  getScrapByLocation,
  getScrapByMaterial
} from '../controllers/scrap.controller.js';

const router = express.Router();

// Scrap Inventory CRUD
router.get('/', getAllScrap);
router.get('/:id', getScrapById);
router.post('/', createScrap);
router.patch('/:id/status', updateScrapStatus);

// Scrap Transactions
router.get('/transactions/list', getScrapTransactions);
router.post('/transactions', createScrapTransaction);

// Scrap by location/material
router.get('/location/:locationId', getScrapByLocation);
router.get('/material/:materialId', getScrapByMaterial);

export default router;
