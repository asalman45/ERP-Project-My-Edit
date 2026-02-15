// src/routes/model.routes.js
import express from 'express';
import {
  listModels, getModel, listModelsByOEM, createModel, updateModel, deleteModel
} from '../controllers/model.controller.js';

const router = express.Router();

router.get('/', listModels);
router.get('/:id', getModel);
router.get('/by-oem/:oemId', listModelsByOEM);  // special route
router.post('/', createModel);
router.patch('/:id', updateModel);
router.delete('/:id', deleteModel);

export default router;
