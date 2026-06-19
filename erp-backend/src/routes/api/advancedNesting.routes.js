import express from 'express';
import { advancedNestingController } from '../../controllers/api/advancedNesting.controller.js';
import multer from 'multer';

const router = express.Router();

// Setup multer for memory storage (for DXF/SVG parsing)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Calculate multi-part heterogeneous rectangular nesting
router.post('/calculate-batch', advancedNestingController.calculateBatch);

// Upload and parse CAD file (DXF/SVG)
router.post('/upload-cad', upload.any(), advancedNestingController.processCadUpload);

// Get available offcuts from scrap inventory
router.get('/offcuts', advancedNestingController.getAvailableOffcuts);

export default router;
