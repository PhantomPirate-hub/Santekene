import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { badgeLevelService } from '../services/badge-level.service.js';

/**
 * Récupère le portefeuille complet avec badge et historique
 */
export const getWalletInfo = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer ou créer le wallet
    let wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      // Créer le wallet s'il n'existe pas
      wallet = await prisma.userWallet.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      });
    }

    // Calculer le badge et la progression
    const badgeInfo = badgeLevelService.getBadgeProgress(wallet.balance);

    // Récupérer l'historique des transactions (dernières 20)
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.status(200).json({
      wallet: {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent,
      },
      badge: {
        current: badgeInfo.current,
        next: badgeInfo.next,
        progressPercentage: badgeInfo.progressPercentage,
        kpToNext: badgeInfo.kpToNext,
      },
      transactions,
    });
  } catch (error) {
    console.error('Erreur récupération wallet:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupère uniquement le solde (pour compatibilité)
 */
export const getUserBalance = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    let wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      });
    }

    return res.status(200).json({
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
    });
  } catch (error) {
    console.error('Erreur récupération solde:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupère l'historique des transactions
 */
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return res.status(200).json({ transactions: [] });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupère tous les niveaux de badges (pour les explications)
 */
export const getBadgeLevels = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      levels: badgeLevelService.BADGE_LEVELS,
    });
  } catch (error) {
    console.error('Erreur récupération niveaux:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Leaderboard (Top utilisateurs par balance)
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const topWallets = await prisma.userWallet.findMany({
      take: 10,
      orderBy: { balance: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const leaderboard = topWallets.map((wallet, index) => {
      const badge = badgeLevelService.getBadgeLevel(wallet.balance);
      return {
        rank: index + 1,
        userId: wallet.user.id,
        name: wallet.user.name,
        role: wallet.user.role,
        balance: wallet.balance,
        badge: {
          level: badge.level,
          name: badge.name,
          icon: badge.icon,
        },
      };
    });

    return res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Erreur récupération leaderboard:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Règles de récompenses
 */
export const getRewardRules = async (req: Request, res: Response) => {
  try {
    const rules = [
      { action: 'Consultation complétée (Médecin)', knp: 150 },
      { action: 'Document uploadé (Médecin)', knp: 20 },
      { action: 'Partage DSE (Patient)', knp: 150 },
      { action: 'RDV honoré (Patient)', knp: 100 },
      { action: 'Création de compte', knp: 900 },
      { action: 'Profil complété', knp: 200 },
      { action: 'Parrainage réussi', knp: 400 },
      { action: 'Avis détaillé', knp: 40 },
    ];

    return res.status(200).json({ rules });
  } catch (error) {
    console.error('Erreur récupération règles:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Statistiques globales (SuperAdmin uniquement)
 */
export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    if (currentUser?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    const totalWallets = await prisma.userWallet.count();
    const totalKNPCirculation = await prisma.userWallet.aggregate({
      _sum: { balance: true },
    });
    const totalKNPEarned = await prisma.userWallet.aggregate({
      _sum: { totalEarned: true },
    });
    const totalTransactions = await prisma.walletTransaction.count();

    return res.status(200).json({
      totalWallets,
      totalKNPCirculation: totalKNPCirculation._sum.balance || 0,
      totalKNPEarned: totalKNPEarned._sum.totalEarned || 0,
      totalTransactions,
    });
  } catch (error) {
    console.error('Erreur récupération stats globales:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
