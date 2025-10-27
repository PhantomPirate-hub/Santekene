import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getMyAppointments,
  acceptAppointment,
  rejectAppointment,
  getMyConsultations,
  getMyStats,
} from '../controllers/doctor.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Toutes les routes sont protégées et réservées aux médecins
router.use(protect, authorize(Role.MEDECIN));

// Profil du médecin
router.get('/me/profile', getMyProfile);
router.put('/me/profile', updateMyProfile);

// Rendez-vous
router.get('/me/appointments', getMyAppointments);
router.put('/appointments/:id/accept', acceptAppointment);
router.put('/appointments/:id/reject', rejectAppointment);

// Consultations
router.get('/me/consultations', getMyConsultations);

// Statistiques
router.get('/me/stats', getMyStats);

export default router;

