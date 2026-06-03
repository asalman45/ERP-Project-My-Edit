import express from 'express';
import { login, getProfile, refreshToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getProfile);

export default router;

