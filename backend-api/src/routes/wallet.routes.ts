import express from 'express';
import * as walletController from '../controllers/wallet.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// Solde de l'utilisateur connecté
router.get('/balance', walletController.getUserBalance);

// Historique des transactions
router.get('/transactions', walletController.getUserTransactions);

// Leaderboard (Top utilisateurs par balance)
router.get('/leaderboard', walletController.getLeaderboard);

// Règles de récompenses
router.get('/rules', walletController.getRewardRules);

// Statistiques globales (pour Super Admin)
router.get('/stats/global', walletController.getGlobalStats);

export default router;

