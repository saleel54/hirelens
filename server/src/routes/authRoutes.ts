import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Guarded/Private session route
router.get('/me', authenticateToken as any, getMe as any);

export default router;
