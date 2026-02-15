// src/routes/bomImport.routes.js
import express from 'express';
import multer from 'multer';
import {
  importBOMFromExcel, exportBOMToExcel, validateImportData
} from '../controllers/bomImport.controller.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files are allowed.'), false);
    }
  }
});

// Import/Export routes
router.post('/import', upload.single('file'), importBOMFromExcel);
router.post('/validate', upload.single('file'), validateImportData);
router.get('/export/:productId', exportBOMToExcel);

export default router;
