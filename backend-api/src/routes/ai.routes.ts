import { Router } from 'express';
import { getRecommendedDoctors, getRecommendedHealthCenters } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Recommandations IA
router.get('/recommended-doctors', getRecommendedDoctors); // Médecins recommandés
router.get('/recommended-healthcenters', getRecommendedHealthCenters); // Hôpitaux recommandés

export default router;

