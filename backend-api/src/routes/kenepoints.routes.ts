import { Router } from 'express';
import {
  getMyKenePoints,
  awardKenePoints,
  redeemKenePoints,
  getLeaderboard,
  getMyRank,
  getRewards,
  redeemReward,
  getKenePointsStats,
} from '../controllers/kenepoints.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes pour les patients
router.get('/me', getMyKenePoints); // Mes KènèPoints
router.get('/me/rank', getMyRank); // Mon rang
router.post('/redeem', redeemKenePoints); // Utiliser des points (générique)

// Routes pour les récompenses
router.get('/rewards', getRewards); // Liste des récompenses
router.post('/rewards/redeem', redeemReward); // Échanger contre une récompense

// Routes publiques (authentifiées)
router.get('/leaderboard', getLeaderboard); // Classement

// Routes pour les médecins et admin
router.post('/award', authorize(Role.MEDECIN, Role.ADMIN, Role.SUPERADMIN), awardKenePoints);

// Routes pour les administrateurs
router.get('/stats', authorize(Role.ADMIN, Role.SUPERADMIN), getKenePointsStats);

export default router;

