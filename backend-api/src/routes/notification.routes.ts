import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  createBulkNotifications,
  getUnreadCount,
} from '../controllers/notification.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour tous les utilisateurs authentifiés
router.get('/me', getMyNotifications);
router.get('/me/unread-count', getUnreadCount);
router.put('/:id/read', markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);
router.delete('/:id', deleteNotification);

// Routes pour les administrateurs
router.post('/', authorize(Role.ADMIN, Role.SUPERADMIN), createNotification);
router.post('/bulk', authorize(Role.ADMIN, Role.SUPERADMIN), createBulkNotifications);

export default router;

