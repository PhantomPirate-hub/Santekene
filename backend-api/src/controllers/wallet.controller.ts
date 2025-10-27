import { Request, Response } from 'express';
import { hederaHtsService } from '../services/hedera-hts.service.js';
import { rewardRulesService } from '../services/reward-rules.service.js';

/**
 * Obtenir le solde de l'utilisateur connecté
 */
export const getUserBalance = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const balance = await hederaHtsService.getUserBalance(currentUser.id);

    return res.status(200).json(balance);
  } catch (error) {
    console.error('Erreur récupération solde:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir l'historique des transactions
 */
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { limit = '50', offset = '0' } = req.query;

    const transactions = await hederaHtsService.getUserTransactions(
      currentUser.id,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir le leaderboard (Top utilisateurs)
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const topUsers = await hederaHtsService.getTopUsers(parseInt(limit as string));

    return res.status(200).json(topUsers);
  } catch (error) {
    console.error('Erreur récupération leaderboard:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les règles de récompenses
 */
export const getRewardRules = async (req: Request, res: Response) => {
  try {
    const rules = rewardRulesService.getRewardRules();
    return res.status(200).json(rules);
  } catch (error) {
    console.error('Erreur récupération règles:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les statistiques globales KenePoints
 */
export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    const stats = await hederaHtsService.getGlobalStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Erreur récupération stats globales:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
