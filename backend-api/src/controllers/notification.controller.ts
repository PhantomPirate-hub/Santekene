import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

/**
 * Contrôleur pour les notifications
 */

/**
 * Récupérer toutes les notifications de l'utilisateur connecté
 */
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { isRead, type, limit } = req.query;

    const where: any = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type as string;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit as string) : undefined,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Marquer une notification comme lue
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      message: 'Notification marquée comme lue',
      notification: updatedNotification,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Marquer toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      message: 'Toutes les notifications ont été marquées comme lues',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer une notification
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    return res.status(200).json({
      message: 'Notification supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer une notification (Admin uniquement)
 */
export const createNotification = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { userId, type, title, message } = req.body;

    // Validation
    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Tous les champs sont requis',
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        type,
        title,
        message,
        isRead: false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_NOTIFICATION',
        userId: currentUser.id,
        details: `Notification créée pour l'utilisateur ${userId}`,
      },
    });

    return res.status(201).json({
      message: 'Notification créée avec succès',
      notification,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer une notification de masse (Admin uniquement)
 */
export const createBulkNotifications = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { userIds, type, title, message, role } = req.body;

    // Validation
    if (!type || !title || !message) {
      return res.status(400).json({
        error: 'Type, titre et message sont requis',
      });
    }

    let targetUserIds: number[] = [];

    if (userIds && Array.isArray(userIds)) {
      targetUserIds = userIds.map((id: any) => parseInt(id));
    } else if (role) {
      // Envoyer à tous les utilisateurs d'un rôle spécifique
      const users = await prisma.user.findMany({
        where: { role },
        select: { id: true },
      });
      targetUserIds = users.map(u => u.id);
    } else {
      return res.status(400).json({
        error: 'Veuillez fournir userIds ou role',
      });
    }

    // Créer les notifications en masse
    const notifications = await prisma.notification.createMany({
      data: targetUserIds.map(userId => ({
        userId,
        type,
        title,
        message,
        isRead: false,
      })),
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_BULK_NOTIFICATIONS',
        userId: currentUser.id,
        details: `${notifications.count} notifications créées`,
      },
    });

    return res.status(201).json({
      message: `${notifications.count} notifications créées avec succès`,
      count: notifications.count,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer le nombre de notifications non lues
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return res.status(200).json({
      unreadCount,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

