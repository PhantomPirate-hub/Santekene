import { Router } from 'express';
import { register, login, logout, updateProfile, updatePassword, getApprovedFacilities } from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/facilities', getApprovedFacilities); // Récupérer les structures approuvées (public)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

export default router;
