import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.ts';
import { authLimiter } from '../middleware/rateLimiter.middleware.ts';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;
