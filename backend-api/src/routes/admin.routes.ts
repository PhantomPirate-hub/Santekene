import { Router } from 'express';
import {
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getGlobalStats,
  getAuditLogs,
  exportUserData,
  anonymizeUser,
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Toutes les routes nécessitent une authentification et des droits admin
router.use(protect, authorize(Role.ADMIN, Role.SUPERADMIN));

// CRUD Utilisateurs
router.post('/users', createUser);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Statistiques globales
router.get('/stats', getGlobalStats);

// Logs d'audit
router.get('/audit-logs', getAuditLogs);

// RGPD
router.get('/users/:userId/export', exportUserData);
router.post('/users/:userId/anonymize', anonymizeUser);

export default router;

