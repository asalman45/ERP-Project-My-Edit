// src/routes/product.routes.js
import express from 'express';
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, exportProducts
} from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', listProducts);
router.get('/export', exportProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
