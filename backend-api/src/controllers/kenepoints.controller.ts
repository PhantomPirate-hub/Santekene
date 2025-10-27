import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { Role } from '@prisma/client';

/**
 * Contrôleur pour les KènèPoints
 */

/**
 * Récupérer les KènèPoints du patient connecté
 */
export const getMyKenePoints = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Récupérer toutes les transactions KènèPoints
    const transactions = await prisma.kenePoints.findMany({
      where: {
        patientId: patient.id,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculer le total
    const totalPoints = transactions.reduce((sum, tx) => sum + tx.points, 0);

    // Statistiques
    const earned = transactions
      .filter(tx => tx.points > 0)
      .reduce((sum, tx) => sum + tx.points, 0);

    const spent = Math.abs(
      transactions
        .filter(tx => tx.points < 0)
        .reduce((sum, tx) => sum + tx.points, 0)
    );

    return res.status(200).json({
      totalPoints,
      statistics: {
        earned,
        spent,
        transactionCount: transactions.length,
      },
      transactions,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Attribuer des KènèPoints (Admin/Médecin)
 */
export const awardKenePoints = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { patientId, points, reason } = req.body;

    // Validation
    if (!patientId || !points || !reason) {
      return res.status(400).json({
        error: 'Patient, points et raison sont requis',
      });
    }

    if (points <= 0) {
      return res.status(400).json({
        error: 'Le nombre de points doit être positif',
      });
    }

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Créer la transaction
    const transaction = await prisma.kenePoints.create({
      data: {
        patientId: parseInt(patientId),
        points: parseInt(points),
        reason,
        date: new Date(),
      },
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: patient.user.id,
        type: 'KENEPOINTS',
        title: 'KènèPoints reçus !',
        message: `Vous avez reçu ${points} KènèPoints ! Raison: ${reason}`,
        isRead: false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'AWARD_KENEPOINTS',
        userId: currentUser.id,
        details: `${points} KènèPoints attribués au patient ${patientId} - Raison: ${reason}`,
      },
    });

    return res.status(201).json({
      message: 'KènèPoints attribués avec succès',
      transaction,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Déduire des KènèPoints (utilisation pour récompenses)
 */
export const redeemKenePoints = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { points, reason } = req.body;

    // Validation
    if (!points || !reason) {
      return res.status(400).json({
        error: 'Points et raison sont requis',
      });
    }

    if (points <= 0) {
      return res.status(400).json({
        error: 'Le nombre de points doit être positif',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Calculer le solde actuel
    const transactions = await prisma.kenePoints.findMany({
      where: { patientId: patient.id },
    });

    const currentBalance = transactions.reduce((sum, tx) => sum + tx.points, 0);

    // Vérifier que le patient a assez de points
    if (currentBalance < points) {
      return res.status(400).json({
        error: 'Solde insuffisant',
        currentBalance,
        requested: points,
      });
    }

    // Créer la transaction (points négatifs)
    const transaction = await prisma.kenePoints.create({
      data: {
        patientId: patient.id,
        points: -parseInt(points),
        reason,
        date: new Date(),
      },
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'KENEPOINTS',
        title: 'KènèPoints utilisés',
        message: `Vous avez utilisé ${points} KènèPoints pour: ${reason}`,
        isRead: false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'REDEEM_KENEPOINTS',
        userId,
        details: `${points} KènèPoints utilisés - Raison: ${reason}`,
      },
    });

    return res.status(201).json({
      message: 'KènèPoints utilisés avec succès',
      transaction,
      newBalance: currentBalance - points,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer le classement des patients par KènèPoints
 */
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = '10', page = '1' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Récupérer tous les patients avec leurs KènèPoints
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        kenePoints: true,
      },
    });

    // Calculer le total de points pour chaque patient
    const leaderboard = patients
      .map(patient => {
        const totalPoints = patient.kenePoints.reduce((sum, tx) => sum + tx.points, 0);
        return {
          patientId: patient.id,
          userId: patient.user.id,
          name: patient.user.name,
          totalPoints,
          transactionCount: patient.kenePoints.length,
        };
      })
      .filter(p => p.totalPoints > 0) // Filtrer ceux qui ont au moins 1 point
      .sort((a, b) => b.totalPoints - a.totalPoints); // Trier par points décroissants

    // Pagination
    const paginatedLeaderboard = leaderboard.slice(skip, skip + take);

    // Ajouter le rang
    const leaderboardWithRank = paginatedLeaderboard.map((entry, index) => ({
      ...entry,
      rank: skip + index + 1,
    }));

    return res.status(200).json({
      leaderboard: leaderboardWithRank,
      pagination: {
        total: leaderboard.length,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(leaderboard.length / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer le rang du patient connecté
 */
export const getMyRank = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const patient = await prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Récupérer tous les patients avec leurs KènèPoints
    const patients = await prisma.patient.findMany({
      include: {
        kenePoints: true,
      },
    });

    // Calculer le total de points pour chaque patient
    const leaderboard = patients
      .map(p => {
        const totalPoints = p.kenePoints.reduce((sum, tx) => sum + tx.points, 0);
        return {
          patientId: p.id,
          totalPoints,
        };
      })
      .filter(p => p.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Trouver le rang du patient connecté
    const rank = leaderboard.findIndex(p => p.patientId === patient.id) + 1;
    const totalPatients = leaderboard.length;

    const myPoints = leaderboard.find(p => p.patientId === patient.id)?.totalPoints || 0;

    // Points nécessaires pour le prochain rang
    const nextRankPoints = rank > 1 ? leaderboard[rank - 2]?.totalPoints : null;
    const pointsToNextRank = nextRankPoints ? nextRankPoints - myPoints : null;

    return res.status(200).json({
      rank: rank || totalPatients + 1, // Si pas dans le classement, donner un rang après le dernier
      totalPatients,
      myPoints,
      nextRankPoints,
      pointsToNextRank,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les récompenses disponibles
 */
export const getRewards = async (req: Request, res: Response) => {
  try {
    // Définir les récompenses disponibles (à terme, cela pourrait être dans la DB)
    const rewards = [
      {
        id: 1,
        title: 'Consultation gratuite',
        description: 'Une consultation gratuite avec un médecin généraliste',
        points: 500,
        category: 'Santé',
        icon: 'Stethoscope',
        available: true,
      },
      {
        id: 2,
        title: 'Réduction 10% pharmacie',
        description: 'Bon de réduction de 10% en pharmacie partenaire',
        points: 200,
        category: 'Pharmacie',
        icon: 'Pill',
        available: true,
      },
      {
        id: 3,
        title: 'Kit premiers secours',
        description: 'Kit complet de premiers secours à domicile',
        points: 350,
        category: 'Équipement',
        icon: 'FirstAid',
        available: true,
      },
      {
        id: 4,
        title: 'Séance de nutrition',
        description: 'Consultation nutritionnelle avec un diététicien',
        points: 300,
        category: 'Bien-être',
        icon: 'Apple',
        available: true,
      },
      {
        id: 5,
        title: 'Abonnement sport 1 mois',
        description: 'Accès gratuit à une salle de sport partenaire pendant 1 mois',
        points: 800,
        category: 'Sport',
        icon: 'Dumbbell',
        available: true,
      },
      {
        id: 6,
        title: 'Analyse sanguine complète',
        description: 'Bilan sanguin complet pris en charge',
        points: 600,
        category: 'Santé',
        icon: 'Activity',
        available: true,
      },
      {
        id: 7,
        title: 'Bon cadeau santé',
        description: 'Bon d\'achat de 50€ en parapharmacie',
        points: 450,
        category: 'Shopping',
        icon: 'Gift',
        available: true,
      },
      {
        id: 8,
        title: 'Pack vaccination',
        description: 'Vaccinations recommandées gratuites',
        points: 700,
        category: 'Prévention',
        icon: 'Shield',
        available: true,
      },
    ];

    return res.status(200).json({ rewards });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Échanger des KènèPoints contre une récompense
 */
export const redeemReward = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { rewardId, rewardTitle, pointsCost } = req.body;

    // Validation
    if (!rewardId || !rewardTitle || !pointsCost) {
      return res.status(400).json({
        error: 'ID de récompense, titre et coût sont requis',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        kenePoints: true,
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Calculer le solde actuel
    const currentBalance = patient.kenePoints.reduce((sum, tx) => sum + tx.points, 0);

    // Vérifier que le patient a assez de points
    if (currentBalance < pointsCost) {
      return res.status(400).json({
        error: 'Solde insuffisant',
        currentBalance,
        required: pointsCost,
      });
    }

    // Créer la transaction (points négatifs)
    const transaction = await prisma.kenePoints.create({
      data: {
        patientId: patient.id,
        points: -parseInt(pointsCost),
        reason: `Récompense échangée: ${rewardTitle}`,
        date: new Date(),
      },
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'KENEPOINTS',
        title: 'Récompense obtenue !',
        message: `Félicitations ! Vous avez échangé ${pointsCost} KènèPoints contre: ${rewardTitle}. Un membre de notre équipe vous contactera bientôt.`,
        isRead: false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'REDEEM_REWARD',
        userId,
        details: `Récompense échangée: ${rewardTitle} (${pointsCost} points)`,
      },
    });

    return res.status(201).json({
      message: 'Récompense échangée avec succès',
      transaction,
      newBalance: currentBalance - pointsCost,
      reward: {
        id: rewardId,
        title: rewardTitle,
        pointsCost,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les statistiques globales KènèPoints (Admin)
 */
export const getKenePointsStats = async (req: Request, res: Response) => {
  try {
    const allTransactions = await prisma.kenePoints.findMany();

    const totalPointsDistributed = allTransactions
      .filter(tx => tx.points > 0)
      .reduce((sum, tx) => sum + tx.points, 0);

    const totalPointsRedeemed = Math.abs(
      allTransactions
        .filter(tx => tx.points < 0)
        .reduce((sum, tx) => sum + tx.points, 0)
    );

    const totalTransactions = allTransactions.length;

    const activePatients = await prisma.patient.count({
      where: {
        kenePoints: {
          some: {},
        },
      },
    });

    return res.status(200).json({
      totalPointsDistributed,
      totalPointsRedeemed,
      totalTransactions,
      activePatients,
      averagePointsPerPatient: activePatients > 0 ? Math.round(totalPointsDistributed / activePatients) : 0,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

