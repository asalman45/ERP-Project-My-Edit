// src/routes/productionRecipe.routes.js
import express from 'express';
import {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  getRecipeByPartNumber,
  addBomItem,
  getBomItems,
  addRoutingStep,
  getRoutingSteps,
  getWorkCenters,
  getMachines,
  createSampleRecipe
} from '../controllers/productionRecipe.controller.js';

const router = express.Router();

/**
 * Production Recipe Routes
 * All routes are prefixed with /api/production-recipes
 */

// Recipe CRUD operations
router.post('/', createRecipe);
router.get('/', getAllRecipes);
router.post('/sample', createSampleRecipe);
router.get('/part/:part_number', getRecipeByPartNumber);
router.get('/:recipe_id', getRecipeById);

// BOM (Bill of Materials) operations
router.post('/:recipe_id/bom-items', addBomItem);
router.get('/:recipe_id/bom-items', getBomItems);

// Production routing operations
router.post('/:recipe_id/routing-steps', addRoutingStep);
router.get('/:recipe_id/routing-steps', getRoutingSteps);

// Work centers and machines
router.get('/work-centers', getWorkCenters);
router.get('/machines', getMachines);

export default router;
