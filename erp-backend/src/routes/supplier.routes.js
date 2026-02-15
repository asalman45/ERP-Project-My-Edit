// src/routes/supplier.routes.js
import express from 'express';
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  exportSuppliers,
  importSuppliers,
  uploadMiddleware
} from '../controllers/supplier.controller.js';

const router = express.Router();

router.post('/import', uploadMiddleware, importSuppliers);
router.get('/', listSuppliers);
router.get('/export', exportSuppliers);
router.get('/:id', getSupplier);
router.post('/', createSupplier);
router.patch('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
