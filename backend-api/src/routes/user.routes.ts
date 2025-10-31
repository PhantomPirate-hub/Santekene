
import { Router } from 'express';
import UserController from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Route to register a device token for push notifications
router.post('/me/device-token', protect, UserController.registerDeviceToken);

export default router;
