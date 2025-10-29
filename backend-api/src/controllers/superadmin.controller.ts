import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import bcrypt from 'bcrypt';
import { endOfDay, startOfDay, subDays } from 'date-fns';

/**
 * Récupérer les données de monitoring en temps réel
 */
export const getMonitoringData = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    const now = new Date();
    const today = startOfDay(now);
    const yesterday = subDays(today, 1);
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);

    // Statistiques en temps réel
    const [
      todayRegistrations,
      ongoingConsultations,
      pendingAppointments,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.consultation.count({
        where: {
          date: {
            gte: yesterday,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    // Activités des dernières 24h
    const [
      logins24h,
      consultations24h,
      appointments24h,
      prescriptions24h,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          updatedAt: {
            gte: subDays(now, 1),
          },
        },
      }),
      prisma.consultation.count({
        where: {
          date: {
            gte: subDays(now, 1),
          },
        },
      }),
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: subDays(now, 1),
          },
        },
      }),
      prisma.prescription.count({
        where: {
          issuedAt: {
            gte: subDays(now, 1),
          },
        },
      }),
    ]);

    // Activités des 7 derniers jours
    const [
      logins7d,
      consultations7d,
      appointments7d,
      prescriptions7d,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          updatedAt: {
            gte: last7Days,
          },
        },
      }),
      prisma.consultation.count({
        where: {
          date: {
            gte: last7Days,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: last7Days,
          },
        },
      }),
      prisma.prescription.count({
        where: {
          issuedAt: {
            gte: last7Days,
          },
        },
      }),
    ]);

    // Activités des 30 derniers jours
    const [
      logins30d,
      consultations30d,
      appointments30d,
      prescriptions30d,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          updatedAt: {
            gte: last30Days,
          },
        },
      }),
      prisma.consultation.count({
        where: {
          date: {
            gte: last30Days,
          },
        },
      }),
      prisma.appointment.count({
        where: {
          createdAt: {
            gte: last30Days,
          },
        },
      }),
      prisma.prescription.count({
        where: {
          issuedAt: {
            gte: last30Days,
          },
        },
      }),
    ]);

    // Activités récentes - Mix de différents types d'activités
    const [recentConsultations, recentAppointments, recentUsers, recentLogins] = await Promise.all([
      prisma.consultation.findMany({
        take: 2,
        orderBy: {
          date: 'desc',
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.appointment.findMany({
        take: 2,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 2,
        where: {
          createdAt: {
            gte: subDays(now, 7),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.session.findMany({
        take: 3,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    // Combiner et trier les activités
    const activities: any[] = [];

    recentConsultations.forEach((c) => {
      activities.push({
        id: `consultation-${c.id}`,
        type: 'CONSULTATION',
        user: `Dr. ${c.doctor.user.name}`,
        action: `Consultation avec ${c.patient.user.name}`,
        timestamp: c.date.toISOString(),
      });
    });

    recentAppointments.forEach((a) => {
      activities.push({
        id: `appointment-${a.id}`,
        type: 'APPOINTMENT',
        user: a.patient.user.name,
        action: `RDV avec Dr. ${a.doctor.user.name} - ${a.status === 'PENDING' ? 'En attente' : a.status === 'CONFIRMED' ? 'Confirmé' : a.status}`,
        timestamp: a.createdAt.toISOString(),
      });
    });

    recentUsers.forEach((u) => {
      const roleLabel = u.role === 'PATIENT' ? 'Patient' : u.role === 'MEDECIN' ? 'Médecin' : u.role === 'ADMIN' ? 'Admin' : 'Super Admin';
      activities.push({
        id: `registration-${u.id}`,
        type: 'REGISTRATION',
        user: u.name || 'Utilisateur',
        action: `Nouvelle inscription - ${roleLabel}`,
        timestamp: u.createdAt.toISOString(),
      });
    });

    recentLogins.forEach((s) => {
      const roleLabel = s.user.role === 'PATIENT' ? 'Patient' : s.user.role === 'MEDECIN' ? 'Médecin' : s.user.role === 'ADMIN' ? 'Admin' : 'Super Admin';
      activities.push({
        id: `login-${s.id}`,
        type: 'LOGIN',
        user: s.user.name || 'Utilisateur',
        action: `Connexion - ${roleLabel}`,
        timestamp: s.createdAt.toISOString(),
      });
    });

    // Trier par date décroissante et prendre les 10 premières
    const recentActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Utilisateurs actifs (connectés dans les dernières 24h)
    const activeUsers = await prisma.session.count({
      where: {
        expiresAt: {
          gte: now,
        },
        createdAt: {
          gte: subDays(now, 1),
        },
      },
    });

    // Calculer les statistiques de performance réelles
    const totalUsers = await prisma.user.count();
    const totalSessions = await prisma.session.count();
    const totalConsultations = await prisma.consultation.count();
    const totalAppointments = await prisma.appointment.count();
    
    // Calcul du taux de succès basé sur les RDV complétés vs total
    const completedAppointments = await prisma.appointment.count({
      where: {
        status: 'COMPLETED',
      },
    });
    
    const successRate = totalAppointments > 0 
      ? Math.round((completedAppointments / totalAppointments) * 100 * 10) / 10 
      : 100;

    // Nombre total de requêtes (approximation basée sur l'activité)
    const totalRequests = totalSessions + totalConsultations + totalAppointments;

    return res.status(200).json({
      realTime: {
        activeUsers,
        ongoingConsultations,
        pendingAppointments,
        todayRegistrations,
      },
      activity: {
        last24h: {
          logins: logins24h,
          consultations: consultations24h,
          appointments: appointments24h,
          prescriptions: prescriptions24h,
        },
        last7days: {
          logins: logins7d,
          consultations: consultations7d,
          appointments: appointments7d,
          prescriptions: prescriptions7d,
        },
        last30days: {
          logins: logins30d,
          consultations: consultations30d,
          appointments: appointments30d,
          prescriptions: prescriptions30d,
        },
      },
      performance: {
        avgResponseTime: 150, // Moyenne estimée pour l'API
        successRate,
        totalRequests,
      },
      recentActivities,
    });
  } catch (error) {
    console.error('❌ Erreur récupération monitoring:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer les statistiques globales de la plateforme
 */
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier que l'utilisateur est bien un super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    // Compter les utilisateurs par rôle
    const [
      totalUsers,
      patients,
      doctors,
      admins,
      superAdmins,
      totalConsultations,
      consultationsThisMonth,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      totalFacilities,
      pendingFacilities,
      approvedFacilities,
      rejectedFacilities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.user.count({ where: { role: 'MEDECIN' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'SUPERADMIN' } }),
      prisma.consultation.count(),
      prisma.consultation.count({
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } }),
      prisma.healthFacilityRequest.count(),
      prisma.healthFacilityRequest.count({ where: { status: 'PENDING' } }),
      prisma.healthFacilityRequest.count({ where: { status: 'APPROVED' } }),
      prisma.healthFacilityRequest.count({ where: { status: 'REJECTED' } }),
    ]);

    // Nouveaux utilisateurs dans les 30 derniers jours
    const thirtyDaysAgo = subDays(new Date(), 30);
    const newUsersLast30Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Croissance des utilisateurs sur les 7 derniers jours
    const growthData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
      });
      growthData.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        count,
      });
    }

    return res.status(200).json({
      users: {
        total: totalUsers,
        byRole: {
          patients,
          doctors,
          admins,
          superAdmins,
        },
        newLast30Days: newUsersLast30Days,
      },
      consultations: {
        total: totalConsultations,
        thisMonth: consultationsThisMonth,
        last30Days: await prisma.consultation.count({
          where: {
            date: {
              gte: thirtyDaysAgo,
            },
          },
        }),
      },
      appointments: {
        total: totalAppointments,
        byStatus: {
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
        },
      },
      facilities: {
        total: totalFacilities,
        pending: pendingFacilities,
        approved: approvedFacilities,
        rejected: rejectedFacilities,
      },
      growth: {
        users: growthData,
      },
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats plateforme:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer une demande de structure spécifique par ID
 */
export const getFacilityRequestById = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    const request = await prisma.healthFacilityRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        approvedBySuperAdmin: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande de structure non trouvée' });
    }

    return res.status(200).json({ request });
  } catch (error) {
    console.error('❌ Erreur récupération demande:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer toutes les demandes de structures de santé
 */
export const getFacilityRequests = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    const requests = await prisma.healthFacilityRequest.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        approvedBySuperAdmin: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const stats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length,
    };

    return res.status(200).json({
      requests,
      stats,
    });
  } catch (error) {
    console.error('❌ Erreur récupération demandes structures:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Approuver une demande de structure de santé
 */
export const approveFacilityRequest = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const requestId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    const request = await prisma.healthFacilityRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    // Trouver le SuperAdmin qui approuve (car approvedBy fait référence à SuperAdmin.id, pas User.id)
    const superAdmin = await prisma.superAdmin.findFirst({
      where: { userId: userId },
    });

    if (!superAdmin) {
      return res.status(403).json({ error: 'Super Admin non trouvé' });
    }

    console.log('👤 SuperAdmin:', { userId, superAdminId: superAdmin.id });

    // Trouver l'admin lié à cette structure pour l'activer
    const admin = await prisma.admin.findFirst({
      where: { facilityRequestId: requestId },
      include: {
        user: true,
      },
    });

    console.log('🏥 Approbation structure:', {
      requestId,
      facilityName: request.facilityName,
      adminFound: !!admin,
      adminUserId: admin?.userId,
    });

    // Mettre à jour le statut de la demande
    const updatedRequest = await prisma.healthFacilityRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: superAdmin.id, // Utiliser l'ID du SuperAdmin, pas du User
      },
    });

    // Activer l'utilisateur admin lié à cette structure
    if (admin) {
      await prisma.user.update({
        where: { id: admin.userId },
        data: {
          isVerified: true,
        },
      });
      console.log(`✅ Utilisateur admin activé: ${admin.user.email}`);
    } else {
      console.warn('⚠️ Aucun admin trouvé pour cette structure');
    }

    // TODO: Envoyer un email de confirmation au responsable de la structure

    return res.status(200).json({
      message: 'Demande approuvée avec succès. L\'administrateur de la structure a été activé.',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('❌ Erreur approbation demande:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Refuser une demande de structure de santé
 */
export const rejectFacilityRequest = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const requestId = parseInt(req.params.id || '0');
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Le motif de refus est obligatoire' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    const request = await prisma.healthFacilityRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    // Mettre à jour le statut de la demande
    const updatedRequest = await prisma.healthFacilityRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedAt: new Date(),
      },
    });

    // TODO: Envoyer un email de refus au responsable de la structure avec le motif

    return res.status(200).json({
      message: 'Demande refusée',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('❌ Erreur refus demande:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Créer un nouveau super administrateur
 */
export const createSuperAdmin = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { name, email, phone, password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Nom, email, téléphone et mot de passe sont obligatoires' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le téléphone existe déjà
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le super admin
    const newSuperAdmin = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'SUPERADMIN',
        isVerified: true,
      },
    });

    return res.status(201).json({
      message: 'Super Admin créé avec succès',
      user: {
        id: newSuperAdmin.id,
        name: newSuperAdmin.name,
        email: newSuperAdmin.email,
        phone: newSuperAdmin.phone,
        role: newSuperAdmin.role,
      },
    });
  } catch (error) {
    console.error('❌ Erreur création super admin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer tous les utilisateurs de la plateforme
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    console.log('📥 getAllUsers - userId:', userId);

    if (!userId) {
      console.log('❌ Non authentifié');
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log('👤 Current user:', user?.email, '- Role:', user?.role);

    if (!user || user.role !== 'SUPERADMIN') {
      console.log('❌ Accès refusé - Rôle requis: SUPERADMIN, Rôle actuel:', user?.role);
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        patient: {
          select: {
            birthDate: true,
            bloodGroup: true,
            location: true,
          },
        },
        doctor: {
          select: {
            speciality: true,
            structure: true,
            location: true,
          },
        },
        admin: {
          select: {
            id: true,
            centerId: true,
          },
        },
        superAdmin: {
          select: {
            id: true,
            permissions: true,
          },
        },
      },
    });

    console.log('✅ Users récupérés:', users.length);

    const stats = {
      total: users.length,
      patients: users.filter((u) => u.role === 'PATIENT').length,
      doctors: users.filter((u) => u.role === 'MEDECIN').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      superAdmins: users.filter((u) => u.role === 'SUPERADMIN').length,
      active: users.filter((u) => u.isVerified).length,
      inactive: users.filter((u) => !u.isVerified).length,
    };

    console.log('📊 Stats calculées:', stats);

    return res.status(200).json({
      users,
      stats,
    });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Activer/Désactiver un utilisateur (via isVerified)
 */
export const toggleUserActive = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const targetUserId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès refusé - Super Admin requis' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Empêcher un super admin de se modifier lui-même
    if (targetUserId === userId) {
      return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre statut' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isVerified: !targetUser.isVerified,
      },
    });

    return res.status(200).json({
      message: `Utilisateur ${updatedUser.isVerified ? 'activé' : 'désactivé'} avec succès`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Erreur modification utilisateur:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};
