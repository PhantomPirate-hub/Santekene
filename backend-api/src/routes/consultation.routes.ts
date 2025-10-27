import { Router } from 'express';
import {
  createConsultation,
  getConsultationById,
  updateConsultation,
  deleteConsultation,
  getAllConsultations,
} from '../controllers/consultation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les médecins
router.post('/', authorize(Role.MEDECIN), createConsultation);
router.put('/:id', authorize(Role.MEDECIN), updateConsultation);

// Routes pour tous les utilisateurs authentifiés (avec contrôle d'accès dans le contrôleur)
router.get('/:id', getConsultationById);

// Routes pour les administrateurs
router.get('/', authorize(Role.ADMIN, Role.SUPERADMIN), getAllConsultations);
router.delete('/:id', authorize(Role.ADMIN, Role.SUPERADMIN), deleteConsultation);

export default router;

