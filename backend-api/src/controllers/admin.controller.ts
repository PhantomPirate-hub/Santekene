import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';

/**
 * Contrôleur pour les fonctionnalités d'administration
 */

/**
 * Créer un nouvel utilisateur (CRUD - Admin/SuperAdmin)
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role, profileData } = req.body;

    // Validation
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        error: 'Email, mot de passe, nom et rôle sont requis',
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone: phone || null,
        role: role as Role,
      },
    });

    // Créer le profil spécifique selon le rôle
    let profile = null;

    if (role === Role.PATIENT) {
      profile = await prisma.patient.create({
        data: {
          userId: user.id,
          dateOfBirth: profileData?.dateOfBirth ? new Date(profileData.dateOfBirth) : null,
          gender: profileData?.gender || null,
          bloodGroup: profileData?.bloodGroup || null,
          address: profileData?.address || null,
          city: profileData?.city || null,
          country: profileData?.country || null,
        },
      });
    } else if (role === Role.MEDECIN) {
      profile = await prisma.doctor.create({
        data: {
          userId: user.id,
          speciality: profileData?.speciality || 'Médecine Générale',
          licenseNumber: profileData?.licenseNumber || null,
        },
      });
    } else if (role === Role.ADMIN) {
      profile = await prisma.admin.create({
        data: {
          userId: user.id,
          department: profileData?.department || null,
          accessLevel: profileData?.accessLevel || 1,
        },
      });
    } else if (role === Role.SUPERADMIN) {
      profile = await prisma.superAdmin.create({
        data: {
          userId: user.id,
          permissions: profileData?.permissions || 'ALL',
        },
      });
    }

    const currentUser = (req as any).user;

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_USER',
        userId: currentUser.id,
        details: `Utilisateur créé: ${email} (${role})`,
      },
    });

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour un utilisateur
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { email, name, phone, role, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const updateData: any = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role as Role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        userId: currentUser.id,
        details: `Utilisateur ${id} mis à jour`,
      },
    });

    return res.status(200).json({
      message: 'Utilisateur mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Ne pas permettre la suppression de son propre compte
    if (user.id === currentUser.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Supprimer l'utilisateur (les profils seront supprimés en cascade)
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_USER',
        userId: currentUser.id,
        details: `Utilisateur ${user.email} (ID: ${id}) supprimé`,
      },
    });

    return res.status(200).json({
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer tous les utilisateurs avec pagination
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role, page = '1', limit = '20', search } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (role) {
      where.role = role as Role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les statistiques globales (Dashboard Admin)
 */
export const getGlobalStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAdmins,
      totalConsultations,
      totalPrescriptions,
      totalAppointments,
      totalDocuments,
      recentConsultations,
      pendingAppointments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.admin.count(),
      prisma.consultation.count(),
      prisma.prescription.count(),
      prisma.appointment.count(),
      prisma.document.count(),
      prisma.consultation.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.appointment.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    // Statistiques par mois (derniers 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const consultationsByMonth = await prisma.consultation.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: sixMonthsAgo,
        },
      },
      _count: true,
    });

    return res.status(200).json({
      overview: {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalAdmins,
        totalConsultations,
        totalPrescriptions,
        totalAppointments,
        totalDocuments,
        pendingAppointments,
      },
      recentActivity: {
        recentConsultations,
      },
      trends: {
        consultationsByMonth,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les logs d'audit
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { userId, action, startDate, endDate, page = '1', limit = '50' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (userId) {
      where.userId = parseInt(userId as string);
    }

    if (action) {
      where.action = action as string;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      logs,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Exporter les données (RGPD)
 */
export const exportUserData = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        patient: {
          include: {
            consultations: true,
            appointments: true,
            documents: true,
            allergies: true,
            kenePoints: true,
          },
        },
        doctor: {
          include: {
            consultations: true,
            appointments: true,
          },
        },
        notifications: true,
        auditLogs: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const currentUser = (req as any).user;

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'EXPORT_USER_DATA',
        userId: currentUser.id,
        details: `Données de l'utilisateur ${userId} exportées`,
      },
    });

    return res.status(200).json({
      message: 'Données exportées avec succès',
      data: user,
      exportDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Anonymiser un utilisateur (RGPD - Droit à l'oubli)
 */
export const anonymizeUser = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Anonymiser l'utilisateur
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        email: `anonymized_${userId}@deleted.com`,
        name: `Utilisateur Anonymisé ${userId}`,
        phone: null,
        password: 'ANONYMIZED',
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'ANONYMIZE_USER',
        userId: currentUser.id,
        details: `Utilisateur ${userId} anonymisé (RGPD)`,
      },
    });

    return res.status(200).json({
      message: 'Utilisateur anonymisé avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

