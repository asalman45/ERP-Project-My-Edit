// src/routes/scrapInventory.routes.js
import express from 'express';
import {
  getScrapInventory, getScrapItem, createScrapItem, updateScrapItem, deleteScrapItem,
  getAvailableScrap, findMatchingScrap, markAsConsumed, getScrapSummary
} from '../controllers/scrapInventory.controller.js';

const router = express.Router();

// Scrap management functionality (specific routes must come before parameterized routes)
router.get('/summary', getScrapSummary);
router.get('/available', getAvailableScrap);
router.post('/find-matching', findMatchingScrap);

// Basic CRUD operations
router.get('/', getScrapInventory);
router.get('/:scrapId', getScrapItem);
router.post('/', createScrapItem);
router.put('/:scrapId', updateScrapItem);
router.patch('/:scrapId/consume', markAsConsumed);
router.delete('/:scrapId', deleteScrapItem);

export default router;
