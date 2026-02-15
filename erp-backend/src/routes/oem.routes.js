// src/routes/oem.routes.js
import express from 'express';
import {
  listOEMs, getOEM, createOEM, updateOEM, deleteOEM
} from '../controllers/oem.controller.js';

const router = express.Router();

router.get('/', listOEMs);
router.get('/:id', getOEM);
router.post('/', createOEM);
router.patch('/:id', updateOEM);
router.delete('/:id', deleteOEM);

export default router;
