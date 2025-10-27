import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getFacilityStats,
  getPendingDoctors,
  getAllFacilityDoctors,
  approveDoctorRequest,
  rejectDoctorRequest,
  getFacilityActivities,
} from '../controllers/admin.controller.js';

const router = express.Router();

// Toutes les routes admin nécessitent une authentification
router.use(protect);

// Statistiques de la structure
router.get('/facility/stats', getFacilityStats);

// Gestion des médecins
router.get('/doctors/pending', getPendingDoctors);
router.get('/doctors', getAllFacilityDoctors);
router.put('/doctors/:id/approve', approveDoctorRequest);
router.put('/doctors/:id/reject', rejectDoctorRequest);

// Activités de la structure
router.get('/facility/activities', getFacilityActivities);

export default router;
