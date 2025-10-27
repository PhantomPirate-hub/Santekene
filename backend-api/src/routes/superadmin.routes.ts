import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getPlatformStats,
  getMonitoringData,
  getFacilityRequests,
  getFacilityRequestById,
  approveFacilityRequest,
  rejectFacilityRequest,
  createSuperAdmin,
  getAllUsers,
  toggleUserActive,
} from '../controllers/superadmin.controller.js';

const router = express.Router();

// Toutes les routes super admin nécessitent une authentification
router.use(protect);

// Statistiques globales
router.get('/stats', getPlatformStats);

// Monitoring
router.get('/monitoring', getMonitoringData);

// Gestion des demandes de structures
router.get('/facility-requests', getFacilityRequests);
router.get('/facility-requests/:id', getFacilityRequestById); // Doit être avant les routes avec actions
router.put('/facility-requests/:id/approve', approveFacilityRequest);
router.put('/facility-requests/:id/reject', rejectFacilityRequest);

// Gestion des utilisateurs
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-active', toggleUserActive);

// Création de super admins
router.post('/create-superadmin', createSuperAdmin);

export default router;
