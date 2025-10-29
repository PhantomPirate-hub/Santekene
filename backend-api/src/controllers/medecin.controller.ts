import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

/**
 * Contrôleur pour les fonctionnalités du médecin
 */

/**
 * Récupérer le profil du médecin avec ses statistiques
 */
export const getDoctorProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Compter le nombre de patients uniques
    const uniquePatients = await prisma.consultation.findMany({
      where: { doctorId: doctor.id },
      select: { patientId: true },
      distinct: ['patientId'],
    });

    // Compter le nombre total de consultations
    const consultationsCount = await prisma.consultation.count({
      where: { doctorId: doctor.id },
    });

    // Retourner le profil avec statistiques
    return res.status(200).json({
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      specialty: doctor.speciality, // ✅ Correction: speciality → specialty pour le frontend
      structure: doctor.structure || 'Non spécifié',
      location: doctor.location || 'Non spécifié',
      patientsCount: uniquePatients.length,
      consultationsCount,
    });
  } catch (error) {
    console.error('❌ Erreur récupération profil médecin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Mettre à jour le profil du médecin
 * Note: La structure ne peut pas être modifiée (définie lors de l'inscription et validée par l'admin)
 */
export const updateDoctorProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    console.log('🔍 [updateDoctorProfile] userId:', userId);
    console.log('📦 [updateDoctorProfile] Body reçu:', req.body);

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { name, email, phone, specialty, location } = req.body;

    console.log('📝 [updateDoctorProfile] Données extraites:', { name, email, phone, specialty, location });

    // Récupérer le médecin et l'utilisateur actuel
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    console.log('👨‍⚕️ [updateDoctorProfile] Médecin trouvé:', doctor ? 'Oui' : 'Non');

    if (!doctor) {
      console.error('❌ [updateDoctorProfile] Médecin non trouvé pour userId:', userId);
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    console.log('📊 [updateDoctorProfile] Données actuelles:', {
      name: doctor.user.name,
      email: doctor.user.email,
      speciality: doctor.speciality, // ✅ Utilise speciality (DB) pas specialty
      location: doctor.location,
    });

    // Vérifier si l'email existe déjà (si changé)
    if (email && email !== doctor.user.email) {
      console.log('📧 [updateDoctorProfile] Vérification email:', email);
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.error('❌ [updateDoctorProfile] Email déjà utilisé:', email);
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
      }
    }

    // Mettre à jour les informations du médecin dans la table Doctor
    // Note: 'structure' est volontairement exclu (non modifiable)
    console.log('🔄 [updateDoctorProfile] Mise à jour Doctor...');
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        speciality: specialty !== undefined && specialty !== '' ? specialty : doctor.speciality, // ✅ Utilise speciality dans la DB
        location: location !== undefined && location !== '' ? location : doctor.location,
      },
    });

    console.log('✅ [updateDoctorProfile] Doctor mis à jour:', {
      speciality: updatedDoctor.speciality,
      location: updatedDoctor.location,
    });

    // Mettre à jour les informations de base dans la table User
    console.log('🔄 [updateDoctorProfile] Mise à jour User...');
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined && name !== '' ? name : doctor.user.name,
        email: email !== undefined && email !== '' ? email : doctor.user.email,
        phone: phone !== undefined && phone !== '' ? phone : doctor.user.phone,
      },
    });

    console.log('✅ [updateDoctorProfile] User mis à jour:', {
      name: updatedUser.name,
      email: updatedUser.email,
    });

    const response = {
      message: 'Profil mis à jour avec succès',
      doctor: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        specialty: updatedDoctor.speciality, // ✅ Envoie specialty au frontend (depuis speciality de la DB)
        structure: updatedDoctor.structure,
        location: updatedDoctor.location,
      },
    };

    console.log('📤 [updateDoctorProfile] Réponse:', response);

    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ [updateDoctorProfile] ERREUR COMPLÈTE:', error);
    console.error('❌ [updateDoctorProfile] Stack:', (error as Error).stack);
    return res.status(500).json({ 
      error: 'Erreur serveur', 
      details: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
};

/**
 * Récupérer les statistiques détaillées du médecin
 */
export const getDoctorStats = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // 1. Nombre total de patients uniques
    const uniquePatients = await prisma.consultation.findMany({
      where: { doctorId: doctor.id },
      select: { patientId: true },
      distinct: ['patientId'],
    });
    const totalPatients = uniquePatients.length;

    // 2. Nombre total de consultations
    const totalConsultations = await prisma.consultation.count({
      where: { doctorId: doctor.id },
    });

    // 3. Statistiques des rendez-vous
    const totalAppointments = await prisma.appointment.count({
      where: { doctorId: doctor.id },
    });

    const pendingAppointments = await prisma.appointment.count({
      where: { 
        doctorId: doctor.id,
        status: 'PENDING',
      },
    });

    const confirmedAppointments = await prisma.appointment.count({
      where: { 
        doctorId: doctor.id,
        status: 'CONFIRMED',
      },
    });

    const rejectedAppointments = await prisma.appointment.count({
      where: { 
        doctorId: doctor.id,
        status: 'REJECTED',
      },
    });

    // 4. Consultations ce mois et mois dernier
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const consultationsThisMonth = await prisma.consultation.count({
      where: {
        doctorId: doctor.id,
        date: {
          gte: startOfThisMonth,
        },
      },
    });

    const consultationsLastMonth = await prisma.consultation.count({
      where: {
        doctorId: doctor.id,
        date: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // 5. Moyenne de consultations par jour (sur les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const consultationsLast30Days = await prisma.consultation.count({
      where: {
        doctorId: doctor.id,
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const avgConsultationsPerDay = consultationsLast30Days / 30;

    // 6. Top 10 des diagnostics les plus fréquents
    const consultations = await prisma.consultation.findMany({
      where: { 
        doctorId: doctor.id,
        diagnosis: {
          not: null,
        },
      },
      select: {
        diagnosis: true,
      },
    });

    // Compter les occurrences
    const diagnosisMap: { [key: string]: number } = {};
    consultations.forEach((c) => {
      if (c.diagnosis) {
        diagnosisMap[c.diagnosis] = (diagnosisMap[c.diagnosis] || 0) + 1;
      }
    });

    const topDiagnoses = Object.entries(diagnosisMap)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7. Activité récente (dernières 10 consultations et RDV)
    const recentConsultations = await prisma.consultation.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const recentAppointments = await prisma.appointment.findMany({
      where: { 
        doctorId: doctor.id,
        status: 'CONFIRMED',
      },
      include: {
        patient: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentActivity = [
      ...recentConsultations.map((c) => ({
        id: c.id,
        type: 'consultation' as const,
        patientName: c.patient.user.name,
        date: c.date,
        details: c.diagnosis || 'Consultation',
      })),
      ...recentAppointments.map((a) => ({
        id: a.id,
        type: 'appointment' as const,
        patientName: a.patient.user.name,
        date: a.date || a.createdAt,
        details: `RDV ${a.type} - ${a.isVideo ? 'Visio' : 'Présentiel'}`,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Préparer la réponse
    const stats = {
      totalPatients,
      totalConsultations,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      rejectedAppointments,
      consultationsThisMonth,
      consultationsLastMonth,
      avgConsultationsPerDay,
      topDiagnoses,
      recentActivity,
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('❌ Erreur récupération stats médecin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer l'historique complet des consultations du médecin
 * Avec filtres: date, patient, diagnostic
 */
export const getConsultationsHistory = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Récupérer les paramètres de filtrage
    const { startDate, endDate, patientName, diagnosis } = req.query;

    // Construire les filtres
    const filters: any = {
      doctorId: doctor.id,
    };

    // Filtre par date
    if (startDate || endDate) {
      filters.date = {};
      if (startDate) {
        filters.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        filters.date.lte = new Date(endDate as string);
      }
    }

    // Filtre par diagnostic
    if (diagnosis) {
      filters.diagnosis = {
        contains: diagnosis as string,
        mode: 'insensitive',
      };
    }

    // Récupérer les consultations avec les détails du patient
    let consultations = await prisma.consultation.findMany({
      where: filters,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        documents: true, // ✅ Inclure les documents liés à la consultation
        prescription: {
          include: {
            medications: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Filtre par nom de patient (côté application car c'est une relation)
    if (patientName) {
      const searchTerm = (patientName as string).toLowerCase();
      consultations = consultations.filter((c) =>
        c.patient.user?.name?.toLowerCase().includes(searchTerm) || false
      );
    }

    // Formatter les données
    const formattedConsultations = consultations.map((c) => ({
      id: c.id,
      date: c.date,
      diagnosis: c.diagnosis,
      notes: c.notes,
      allergies: c.allergies,
      aiSummary: c.aiSummary,
      triageScore: c.triageScore,
      blockchainTxId: c.blockchainTxId,
      patient: {
        id: c.patient.id,
        name: c.patient.user.name,
        phone: c.patient.user.phone,
        bloodGroup: c.patient.bloodGroup,
        birthDate: c.patient.birthDate,
      },
      documents: c.documents || [], // ✅ Inclure les documents
      prescription: c.prescription ? {
        id: c.prescription.id,
        issuedAt: c.prescription.issuedAt,
        medications: c.prescription.medications || [],
      } : null,
    }));

    return res.status(200).json({
      total: formattedConsultations.length,
      consultations: formattedConsultations,
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique consultations:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Modifier une consultation existante
 * Le médecin peut corriger des erreurs dans une consultation qu'il a créée
 */
export const updateConsultation = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const consultationId = parseInt(req.params.id || '0');

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que la consultation existe et appartient au médecin
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    if (consultation.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cette consultation' });
    }

    // Récupérer les données à mettre à jour
    const { diagnosis, notes, allergies, aiSummary } = req.body;

    // Mettre à jour la consultation
    const updatedConsultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        diagnosis: diagnosis !== undefined ? diagnosis : consultation.diagnosis,
        notes: notes !== undefined ? notes : consultation.notes,
        allergies: allergies !== undefined ? allergies : consultation.allergies,
        aiSummary: aiSummary !== undefined ? aiSummary : consultation.aiSummary,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Consultation modifiée avec succès',
      consultation: updatedConsultation,
    });
  } catch (error) {
    console.error('❌ Erreur modification consultation:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer les notifications du médecin (RDV, accès DSE)
 */
export const getDoctorNotifications = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Nouvelles demandes de RDV (status PENDING)
    const pendingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: 'PENDING',
      },
      include: {
        patient: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Nouvelles demandes d'accès DSE (status PENDING)
    const pendingDseRequests = await prisma.dseAccessRequest.findMany({
      where: {
        doctorId: doctor.id,
        status: 'PENDING',
      },
      include: {
        patient: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const notifications = [
      ...pendingAppointments.map((apt) => ({
        id: `rdv-${apt.id}`,
        type: 'appointment',
        title: 'Nouvelle demande de RDV',
        message: `${apt.patient.user.name} demande un rendez-vous`,
        date: apt.createdAt,
        link: '/dashboard/medecin/rdv',
      })),
      ...pendingDseRequests.map((req) => ({
        id: `dse-${req.id}`,
        type: 'dse_access',
        title: 'Demande d\'accès DSE',
        message: `${req.patient.user.name} demande l'accès à son DSE`,
        date: req.createdAt,
        link: '/dashboard/medecin/consultations',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json({
      total: notifications.length,
      unread: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Rechercher un patient par numéro de téléphone
 */
export const searchPatientByPhone = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const doctorId = currentUser?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier que l'utilisateur est bien un médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Accès réservé aux médecins' });
    }

    const { phone } = req.query;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Numéro de téléphone requis' });
    }

    // Rechercher l'utilisateur par téléphone
    const user = await prisma.user.findFirst({
      where: {
        phone: {
          contains: phone,
        },
        role: 'PATIENT',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.patient) {
      return res.status(404).json({ error: 'Aucun patient trouvé avec ce numéro' });
    }

    // Vérifier si une demande d'accès existe déjà
    const existingRequest = await prisma.dseAccessRequest.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: doctor.id,
          patientId: user.patient.id,
        },
      },
    });

    console.log('🔍 [searchPatientByPhone] Patient trouvé:');
    console.log('   • patient.id (TABLE Patient):', user.patient.id);
    console.log('   • user.id (TABLE User):', user.id);
    console.log('   • doctorId:', doctor.id);
    console.log('   • Demande d\'accès:', existingRequest ? `ID=${existingRequest.id}, status=${existingRequest.status}` : 'NON TROUVÉE');

    return res.status(200).json({
      patient: {
        id: user.patient.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        birthDate: user.patient.birthDate,
        bloodGroup: user.patient.bloodGroup,
      },
      accessRequest: existingRequest || null,
    });
  } catch (error) {
    console.error('Erreur recherche patient:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Demander l'accès au DSE d'un patient
 */
export const requestDseAccess = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const doctorId = currentUser?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Vérifier que l'utilisateur est bien un médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Accès réservé aux médecins' });
    }

    const { patientId, reason } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'ID du patient requis' });
    }

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Vérifier si une demande existe déjà
    const existingRequest = await prisma.dseAccessRequest.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: doctor.id,
          patientId: patient.id,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({ error: 'Une demande est déjà en attente' });
      }
      if (existingRequest.status === 'APPROVED') {
        return res.status(400).json({ error: 'Vous avez déjà accès au DSE de ce patient' });
      }
      // Si REJECTED ou EXPIRED, on peut faire une nouvelle demande
      await prisma.dseAccessRequest.delete({
        where: { id: existingRequest.id },
      });
    }

    // Créer la demande
    const accessRequest = await prisma.dseAccessRequest.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        reason: reason || 'Consultation médicale',
        status: 'PENDING',
      },
      include: {
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
    });

    return res.status(201).json({
      message: 'Demande d\'accès envoyée au patient',
      accessRequest,
    });
  } catch (error) {
    console.error('Erreur demande d\'accès:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier l'accès au DSE d'un patient
 */
export const checkDseAccess = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const doctorId = currentUser?.id;

    console.log('🔍 [checkDseAccess] userId du token:', doctorId);

    if (!doctorId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    console.log('🔍 [checkDseAccess] Doctor trouvé:', doctor ? `ID=${doctor.id}` : 'NON TROUVÉ');

    if (!doctor) {
      return res.status(403).json({ error: 'Accès réservé aux médecins' });
    }

    const { patientId } = req.params;
    console.log('🔍 [checkDseAccess] patientId depuis URL:', patientId);

    const accessRequest = await prisma.dseAccessRequest.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: doctor.id,
          patientId: parseInt(patientId || '0'),
        },
      },
    });

    console.log('🔍 [checkDseAccess] Demande d\'accès trouvée:', accessRequest ? `ID=${accessRequest.id}, status=${accessRequest.status}` : 'NON TROUVÉE');

    if (!accessRequest || accessRequest.status !== 'APPROVED') {
      console.log('❌ [checkDseAccess] Accès refusé - Demande non trouvée ou pas approuvée');
      return res.status(403).json({ 
        hasAccess: false,
        error: 'Accès non autorisé au DSE de ce patient',
        debug: {
          doctorId: doctor.id,
          patientId: parseInt(patientId || '0'),
          accessRequestFound: !!accessRequest,
          status: accessRequest?.status || 'N/A'
        }
      });
    }

    // Vérifier l'expiration
    if (accessRequest.expiresAt && new Date() > accessRequest.expiresAt) {
      await prisma.dseAccessRequest.update({
        where: { id: accessRequest.id },
        data: { status: 'EXPIRED' },
      });
      console.log('❌ [checkDseAccess] Accès expiré');
      return res.status(403).json({ 
        hasAccess: false,
        error: 'Accès expiré' 
      });
    }

    console.log('✅ [checkDseAccess] Accès autorisé !');
    return res.status(200).json({ 
      hasAccess: true,
      accessRequest 
    });
  } catch (error) {
    console.error('❌ [checkDseAccess] Erreur vérification accès:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer le DSE d'un patient (pour le médecin)
 */
export const getPatientDse = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const doctorId = currentUser?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Accès réservé aux médecins' });
    }

    const { patientId } = req.params;

    // Vérifier l'accès
    const accessRequest = await prisma.dseAccessRequest.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: doctor.id,
          patientId: parseInt(patientId || '0'),
        },
      },
    });

    if (!accessRequest || accessRequest.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Récupérer le DSE complet
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId || '0') },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        allergies: true,
        consultations: {
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            prescription: {
              include: {
                medications: true,
              },
            },
            documents: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    return res.status(200).json({ patient });
  } catch (error) {
    console.error('Erreur récupération DSE:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer une consultation complète (notes, allergies, documents, ordonnance)
 */
export const createConsultation = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const doctorId = currentUser?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Accès réservé aux médecins' });
    }

    const { 
      patientId, 
      notes, 
      diagnosis, 
      allergies,
      medications, // [{name, dosage, duration, instructions}]
    } = req.body;

    if (!patientId || !notes) {
      return res.status(400).json({ error: 'Patient ID et notes requis' });
    }

    // Vérifier l'accès
    const accessRequest = await prisma.dseAccessRequest.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: doctor.id,
          patientId: parseInt(patientId),
        },
      },
    });

    if (!accessRequest || accessRequest.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Créer la consultation
    const consultation = await prisma.consultation.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: doctor.id,
        notes,
        diagnosis: diagnosis || null,
        allergies: allergies || null,
      },
    });

    // Créer l'ordonnance si des médicaments sont fournis
    if (medications && medications.length > 0) {
      const prescription = await prisma.prescription.create({
        data: {
          consultationId: consultation.id,
        },
      });

      // Créer tous les médicaments
      await prisma.medication.createMany({
        data: medications.map((med: any) => ({
          prescriptionId: prescription.id,
          name: med.name,
          dosage: med.dosage,
          duration: med.duration,
          frequency: med.frequency || null,
          instructions: med.instructions || null,
        })),
      });
    }

    // Récupérer la consultation complète
    const fullConsultation = await prisma.consultation.findUnique({
      where: { id: consultation.id },
      include: {
        prescription: {
          include: {
            medications: true,
          },
        },
        documents: true,
      },
    });

    return res.status(201).json({
      message: 'Consultation créée avec succès',
      consultation: fullConsultation,
    });
  } catch (error) {
    console.error('Erreur création consultation:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Upload un document lié à une consultation (utilise multer)
 */
export const uploadConsultationDocument = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const doctorId = currentUser?.id;

    if (!doctorId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Accès réservé aux médecins' });
    }

    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { consultationId, patientId, type, title } = req.body;

    if (!patientId || !type) {
      return res.status(400).json({ error: 'Patient ID et type sont requis' });
    }

    // Vérifier l'accès au patient
    const accessRequest = await prisma.dseAccessRequest.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: doctor.id,
          patientId: parseInt(patientId),
        },
      },
    });

    if (!accessRequest || accessRequest.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Accès non autorisé au DSE de ce patient' });
    }

    // Construire l'URL du fichier uploadé
    const fileUrl = `http://localhost:3001/uploads/${req.file.filename}`;

    // Calculer le hash SHA-256 du fichier (lire depuis le disque car multer utilise diskStorage)
    const fs = await import('fs');
    const crypto = await import('crypto');
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Créer le document
    const document = await prisma.document.create({
      data: {
        patientId: parseInt(patientId),
        consultationId: consultationId ? parseInt(consultationId) : null,
        type,
        name: req.file.originalname,
        title: title || req.file.originalname,
        url: fileUrl,
        fileUrl: fileUrl,
        hash: fileHash,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: doctorId,
        description: title || type,
      },
    });

    return res.status(201).json({
      message: 'Document uploadé avec succès',
      document,
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: (error as Error).message 
    });
  }
};

/**
 * ========================================
 * GESTION DES RENDEZ-VOUS CÔTÉ MÉDECIN
 * ========================================
 */

/**
 * Récupérer toutes les demandes de RDV pour le médecin
 */
export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Filtres optionnels
    const { status } = req.query;

    // Construire le filtre
    const filter: any = {
      doctorId: doctor.id,
    };

    if (status) {
      filter.status = status;
    }

    // Récupérer les rendez-vous
    const appointments = await prisma.appointment.findMany({
      where: filter,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING en premier
        { createdAt: 'desc' },
      ],
    });

    // Formater les données
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patient: {
        id: apt.patient.id,
        name: apt.patient.user.name,
        email: apt.patient.user.email,
        phone: apt.patient.user.phone,
        age: apt.patient.birthDate 
          ? new Date().getFullYear() - new Date(apt.patient.birthDate).getFullYear()
          : null,
        gender: apt.patient.gender,
        bloodGroup: apt.patient.bloodGroup,
        location: apt.patient.location,
      },
      type: apt.type,
      reason: apt.reason,
      notes: apt.notes,
      isVideo: apt.isVideo,
      videoLink: apt.videoLink,
      videoRoomId: apt.videoRoomId,
      status: apt.status,
      date: apt.date,
      createdAt: apt.createdAt,
      acceptedAt: apt.acceptedAt,
      rejectedAt: apt.rejectedAt,
      rejectedReason: apt.rejectedReason,
    }));

    return res.status(200).json({
      appointments: formattedAppointments,
      stats: {
        total: appointments.length,
        pending: appointments.filter(a => a.status === 'PENDING').length,
        confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
      },
    });
  } catch (error) {
    console.error('❌ Erreur récupération RDV médecin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Accepter un rendez-vous et proposer une date/heure
 */
export const acceptAppointment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;
    const { date, notes } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!date) {
      return res.status(400).json({ error: 'La date du rendez-vous est requise' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que le RDV existe et appartient au médecin
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id || '0') },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Ce rendez-vous ne vous est pas adressé' });
    }

    if (appointment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Ce rendez-vous a déjà été traité' });
    }

    // Générer un ID de room Jitsi unique si c'est une visio
    let videoRoomId = appointment.videoRoomId;
    let videoLink = appointment.videoLink;

    if (appointment.isVideo && !videoRoomId) {
      videoRoomId = `sk-${doctor.id}-${appointment.patient.id}-${Date.now()}`;
      videoLink = `https://meet.jit.si/${videoRoomId}`;
    }

    // Mettre à jour le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id || '0') },
      data: {
        status: 'CONFIRMED',
        date: new Date(date),
        acceptedAt: new Date(),
        notes: notes || appointment.notes,
        videoRoomId,
        videoLink,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Rendez-vous accepté avec succès',
      appointment: {
        id: updatedAppointment.id,
        date: updatedAppointment.date,
        status: updatedAppointment.status,
        isVideo: updatedAppointment.isVideo,
        videoLink: updatedAppointment.videoLink,
        videoRoomId: updatedAppointment.videoRoomId,
        patient: {
          name: updatedAppointment.patient.user.name,
          email: updatedAppointment.patient.user.email,
        },
      },
    });
  } catch (error) {
    console.error('❌ Erreur acceptation RDV:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Refuser un rendez-vous
 */
export const rejectAppointment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que le RDV existe et appartient au médecin
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id || '0') },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Ce rendez-vous ne vous est pas adressé' });
    }

    if (appointment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Ce rendez-vous a déjà été traité' });
    }

    // Mettre à jour le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id || '0') },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedReason: reason || 'Aucune raison fournie',
      },
    });

    return res.status(200).json({
      message: 'Rendez-vous refusé',
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        rejectedReason: updatedAppointment.rejectedReason,
      },
    });
  } catch (error) {
    console.error('❌ Erreur refus RDV:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer le planning du médecin (RDV confirmés)
 */
export const getDoctorSchedule = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Récupérer les RDV confirmés
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: 'CONFIRMED',
        date: {
          gte: new Date(), // Seulement les RDV futurs
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Formater pour un calendrier
    const schedule = appointments.map(apt => ({
      id: apt.id,
      title: `${apt.type} - ${apt.patient.user.name}`,
      start: apt.date,
      end: apt.date, // TODO: Ajouter une durée si nécessaire
      patient: {
        id: apt.patient.id,
        name: apt.patient.user.name,
        phone: apt.patient.user.phone,
      },
      type: apt.type,
      isVideo: apt.isVideo,
      videoLink: apt.videoLink,
      reason: apt.reason,
    }));

    return res.status(200).json({
      schedule,
      total: schedule.length,
    });
  } catch (error) {
    console.error('❌ Erreur récupération planning:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Générer/Régénérer le lien de visioconférence pour un RDV
 */
export const generateVideoLink = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le médecin
    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que le RDV existe et appartient au médecin
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id || '0') },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Ce rendez-vous ne vous est pas adressé' });
    }

    if (!appointment.isVideo) {
      return res.status(400).json({ error: 'Ce rendez-vous n\'est pas une visioconférence' });
    }

    if (appointment.status !== 'CONFIRMED') {
      return res.status(400).json({ error: 'Le rendez-vous doit être confirmé pour générer un lien' });
    }

    // Générer un ID de room unique si pas déjà fait
    const videoRoomId = appointment.videoRoomId || `sk-${doctor.id}-${appointment.patient.id}-${Date.now()}`;
    const videoLink = `https://meet.jit.si/${videoRoomId}`;

    // Mettre à jour le RDV
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id || '0') },
      data: {
        videoRoomId,
        videoLink,
      },
    });

    return res.status(200).json({
      message: 'Lien de visioconférence généré',
      videoLink: updatedAppointment.videoLink,
      videoRoomId: updatedAppointment.videoRoomId,
      instructions: {
        doctor: 'Cliquez sur le lien pour rejoindre la visioconférence',
        patient: 'Le patient recevra le même lien dans son espace',
        security: 'Cette room est unique et sécurisée pour cette consultation',
      },
    });
  } catch (error) {
    console.error('❌ Erreur génération lien visio:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

