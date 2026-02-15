// src/routes/uom.routes.js
import express from 'express';
import {
  listUOMs, getUOM, createUOM, updateUOM, deleteUOM
} from '../controllers/uom.controller.js';

const router = express.Router();

router.get('/', listUOMs);
router.get('/:id', getUOM);
router.post('/', createUOM);
router.patch('/:id', updateUOM);
router.delete('/:id', deleteUOM);

export default router;
