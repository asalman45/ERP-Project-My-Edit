// src/routes/scrapReuse.routes.js
import express from 'express';
import {
  reuseScrapIntoStock,
  getReusableScrap,
  getScrapReuseHistory,
  getScrapReuseSavings
} from '../controllers/scrapReuse.controller.js';

const router = express.Router();

// Scrap reuse operations
router.post('/reuse', reuseScrapIntoStock);
router.get('/reusable/:materialId', getReusableScrap);
router.get('/reusable/:materialId/:locationId', getReusableScrap);
router.get('/history', getScrapReuseHistory);
router.get('/savings', getScrapReuseSavings);

export default router;
