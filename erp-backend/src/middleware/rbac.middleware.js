import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // 1. Check if user is attached to request
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: No user session found.' });
        }

        // 2. Check if user role is in the allowed array
        if (!allowedRoles.includes(req.user.role)) {
            logger.warn({ user: req.user.username, role: req.user.role, required: allowedRoles }, 'RBAC Access Denied');
            return res.status(403).json({ error: `Forbidden: Requires one of roles [${allowedRoles.join(', ')}]` });
        }

        // 3. Allowed
        next();
    };
};
