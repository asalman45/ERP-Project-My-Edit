import { Router } from 'express';
import { uploadSingle } from '../middleware/upload.middleware.js';
import {
    uploadFile,
    createAttachment,
    listAttachments,
    deleteAttachment,
} from '../controllers/upload.controller.js';

const router = Router();

// File upload endpoint
router.post('/upload', (req, res, next) => {
    uploadSingle(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
        next();
    });
}, uploadFile);

// Attachment CRUD
router.post('/attachments', createAttachment);
router.get('/attachments', listAttachments);
router.delete('/attachments/:id', deleteAttachment);

export default router;
