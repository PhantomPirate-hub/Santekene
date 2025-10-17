import { Router } from 'express';
import { getPatientById } from '../controllers/patient.controller.ts';
import { protect, authorize } from '../middleware/auth.middleware.ts';
import { Role } from '@prisma/client';

const router = Router();

// Tous les utilisateurs connectés peuvent potentiellement accéder à cette route,
// la logique de contrôle d'accès fine se fera dans le contrôleur.
router.get('/:id', protect, getPatientById);


export default router;
