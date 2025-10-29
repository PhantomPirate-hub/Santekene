import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

/**
 * Récupérer les statistiques de la structure de l'admin
 */
export const getFacilityStats = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le profil Admin
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: {
        facilityRequest: true,
      },
    });

    console.log('🔍 Admin lookup:', {
      userId,
      adminFound: !!admin,
      facilityRequestId: admin?.facilityRequestId,
      hasFacilityRequest: !!admin?.facilityRequest,
    });

    if (!admin) {
      return res.status(404).json({ 
        error: 'Profil Admin non trouvé. Veuillez vous réinscrire en tant qu\'Admin.' 
      });
    }

    if (!admin.facilityRequest) {
      return res.status(404).json({ 
        error: 'Aucune structure liée à ce compte. Votre demande de structure doit être approuvée par un Super Admin.' 
      });
    }

    const facilityId = admin.facilityRequest.id;

    // Statistiques des médecins de la structure
    const totalDoctors = await prisma.doctor.count({
      where: { facilityId },
    });

    const pendingDoctors = await prisma.doctor.count({
      where: {
        facilityId,
        user: { isVerified: false },
      },
    });

    const activeDoctors = await prisma.doctor.count({
      where: {
        facilityId,
        user: { isVerified: true },
      },
    });

    // Statistiques des consultations
    const totalConsultations = await prisma.consultation.count({
      where: {
        doctor: { facilityId },
      },
    });

    // Consultations ce mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const consultationsThisMonth = await prisma.consultation.count({
      where: {
        doctor: { facilityId },
        date: { gte: startOfMonth },
      },
    });

    // Patients uniques traités
    const uniquePatients = await prisma.consultation.findMany({
      where: { doctor: { facilityId } },
      distinct: ['patientId'],
      select: { patientId: true },
    });

    // Prescriptions émises
    const totalPrescriptions = await prisma.prescription.count({
      where: {
        consultation: {
          doctor: { facilityId },
        },
      },
    });

    return res.status(200).json({
      facility: {
        id: admin.facilityRequest.id,
        name: admin.facilityRequest.facilityName,
        type: admin.facilityRequest.facilityType,
        city: admin.facilityRequest.facilityCity,
        status: admin.facilityRequest.status,
      },
      stats: {
        doctors: {
          total: totalDoctors,
          active: activeDoctors,
          pending: pendingDoctors,
        },
        consultations: {
          total: totalConsultations,
          thisMonth: consultationsThisMonth,
        },
        patients: {
          unique: uniquePatients.length,
        },
        prescriptions: {
          total: totalPrescriptions,
        },
      },
    });
  } catch (error) {
    console.error('❌ Erreur récupération stats structure:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer les demandes de médecins en attente de validation
 */
export const getPendingDoctors = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le profil Admin
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: { facilityRequest: true },
    });

    if (!admin || !admin.facilityRequest) {
      return res.status(404).json({ error: 'Structure non trouvée' });
    }

    const facilityId = admin.facilityRequest.id;

    // Récupérer les médecins en attente de validation
    const pendingDoctors = await prisma.doctor.findMany({
      where: {
        facilityId,
        user: { isVerified: false },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ doctors: pendingDoctors });
  } catch (error) {
    console.error('❌ Erreur récupération médecins en attente:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer tous les médecins de la structure
 */
export const getAllFacilityDoctors = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le profil Admin
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: { facilityRequest: true },
    });

    if (!admin || !admin.facilityRequest) {
      return res.status(404).json({ error: 'Structure non trouvée' });
    }

    const facilityId = admin.facilityRequest.id;

    // Récupérer tous les médecins
    const doctors = await prisma.doctor.findMany({
      where: { facilityId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            isVerified: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            consultations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({ doctors });
  } catch (error) {
    console.error('❌ Erreur récupération médecins:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Valider un médecin (activer son compte)
 */
export const approveDoctorRequest = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const doctorId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID médecin invalide' });
    }

    // Récupérer le profil Admin
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: { facilityRequest: true },
    });

    if (!admin || !admin.facilityRequest) {
      return res.status(404).json({ error: 'Structure non trouvée' });
    }

    const facilityId = admin.facilityRequest.id;

    // Vérifier que le médecin appartient bien à cette structure
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        facilityId,
      },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Médecin non trouvé dans cette structure' });
    }

    if (doctor.user.isVerified) {
      return res.status(400).json({ error: 'Ce médecin est déjà validé' });
    }

    // Activer le compte du médecin
    await prisma.user.update({
      where: { id: doctor.userId },
      data: { isVerified: true },
    });

    console.log(`✅ Médecin validé: ${doctor.user.email} par Admin de ${admin.facilityRequest.facilityName}`);

    // TODO: Envoyer un email au médecin pour l'informer

    return res.status(200).json({
      message: `${doctor.user.name} a été validé(e) avec succès`,
    });
  } catch (error) {
    console.error('❌ Erreur validation médecin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Refuser/Désactiver un médecin
 */
export const rejectDoctorRequest = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const doctorId = parseInt(req.params.id || '0');
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!doctorId || isNaN(doctorId)) {
      return res.status(400).json({ error: 'ID médecin invalide' });
    }

    // Récupérer le profil Admin
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: { facilityRequest: true },
    });

    if (!admin || !admin.facilityRequest) {
      return res.status(404).json({ error: 'Structure non trouvée' });
    }

    const facilityId = admin.facilityRequest.id;

    // Vérifier que le médecin appartient bien à cette structure
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        facilityId,
      },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Médecin non trouvé dans cette structure' });
    }

    // Désactiver le compte du médecin ET retirer la liaison avec la structure
    await prisma.user.update({
      where: { id: doctor.userId },
      data: { isVerified: false },
    });

    // Retirer la liaison avec la structure pour qu'il n'apparaisse plus dans les demandes
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { facilityId: null },
    });

    console.log(`❌ Médecin refusé: ${doctor.user.email} par Admin de ${admin.facilityRequest.facilityName}. Raison: ${reason || 'Non spécifiée'}`);

    // TODO: Envoyer un email au médecin avec le motif

    return res.status(200).json({
      message: `${doctor.user.name} a été refusé(e) et retiré(e) de votre structure`,
    });
  } catch (error) {
    console.error('❌ Erreur refus médecin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer les activités récentes de la structure
 */
export const getFacilityActivities = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le profil Admin
    const admin = await prisma.admin.findFirst({
      where: { userId },
      include: { facilityRequest: true },
    });

    if (!admin || !admin.facilityRequest) {
      return res.status(404).json({ error: 'Structure non trouvée' });
    }

    const facilityId = admin.facilityRequest.id;

    // Récupérer les consultations récentes
    const recentConsultations = await prisma.consultation.findMany({
      where: {
        doctor: { facilityId },
      },
      include: {
        patient: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        doctor: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 20,
    });

    // Récupérer les nouveaux médecins récemment inscrits
    const recentDoctors = await prisma.doctor.findMany({
      where: { facilityId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return res.status(200).json({
      recentConsultations,
      recentDoctors,
    });
  } catch (error) {
    console.error('❌ Erreur récupération activités:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};
