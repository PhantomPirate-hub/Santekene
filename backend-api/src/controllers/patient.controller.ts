import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hederaHcsService } from '../services/hedera-hcs.service.js';
import { HcsMessageBuilder } from '../services/hcs-message-builder.service.js';
import { HcsEventType, HcsEntityType } from '../types/hedera-hcs.types.js';
import { rewardRulesService } from '../services/reward-rules.service.js';

const prisma = new PrismaClient();

/**
 * Récupérer les informations d'un patient par son ID
 */
export const getPatientById = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.id);
    
    if (isNaN(patientId)) {
      return res.status(400).json({ error: 'ID de patient invalide' });
    }

    // Récupérer le patient avec ses relations
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
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
                    email: true,
                  },
                },
              },
            },
            prescription: true,
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
        appointments: {
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
          orderBy: {
            date: 'desc',
          },
        },
        kenePoints: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Contrôle d'accès : vérifier que l'utilisateur a le droit de voir ce patient
    const currentUser = (req as any).user;
    
    // Un patient peut seulement voir ses propres données
    if (currentUser.role === Role.PATIENT && patient.userId !== currentUser.id) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Les médecins et admins peuvent voir tous les patients
    
    return res.status(200).json({ patient });
  } catch (error) {
    console.error('Erreur lors de la récupération du patient:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la récupération du patient' });
  }
};

/**
 * Récupérer le DSE complet du patient connecté
 */
export const getMyDSE = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le patient avec toutes ses données médicales
    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
        allergies: {
          orderBy: {
            id: 'desc',
          },
        },
        consultations: {
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
            prescription: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 20, // Dernières 20 consultations
        },
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
          take: 50, // Derniers 50 documents
        },
        appointments: {
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
          orderBy: {
            date: 'desc',
          },
        },
        kenePoints: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Dernières 10 transactions
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Calculer le total de KènèPoints
    const totalKenePoints = await prisma.kenePoints.aggregate({
      where: { patientId: patient.id },
      _sum: {
        pointsEarned: true,
      },
    });

    // Statistiques du DSE
    const stats = {
      totalConsultations: await prisma.consultation.count({
        where: { patientId: patient.id },
      }),
      totalDocuments: await prisma.document.count({
        where: { patientId: patient.id },
      }),
      totalAppointments: await prisma.appointment.count({
        where: { patientId: patient.id },
      }),
      totalKenePoints: totalKenePoints._sum.pointsEarned || 0,
      upcomingAppointments: await prisma.appointment.count({
        where: {
          patientId: patient.id,
          date: {
            gte: new Date(),
          },
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
        },
      }),
    };

    return res.status(200).json({
      patient,
      stats,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du DSE:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les consultations du patient connecté
 */
export const getMyConsultations = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    const consultations = await prisma.consultation.findMany({
      where: { patientId: patient.id },
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
        prescription: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return res.status(200).json(consultations);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les documents médicaux du patient connecté
 */
export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    const documents = await prisma.document.findMany({
      where: { patientId: patient.id },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return res.status(200).json(documents);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les rendez-vous du patient connecté
 */
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
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
      orderBy: {
        date: 'desc',
      },
    });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer l'historique KènèPoints du patient connecté
 */
export const getMyKenePoints = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    const kenePoints = await prisma.kenePoints.findMany({
      where: { patientId: patient.id },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.kenePoints.aggregate({
      where: { patientId: patient.id },
      _sum: {
        pointsEarned: true,
      },
    });

    return res.status(200).json({
      transactions: kenePoints,
      total: total._sum.pointsEarned || 0,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer la liste de tous les médecins
 */
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const doctors = await prisma.doctor.findMany({
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
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    return res.status(200).json(doctors);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer un nouveau rendez-vous
 */
export const createAppointment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    const { doctorId, type, reason, notes, isVideo } = req.body;

    // Validation
    if (!doctorId || !type) {
      console.error('Validation échouée:', { doctorId, type });
      return res.status(400).json({ 
        error: 'Médecin et type de consultation sont requis' 
      });
    }
    // Vérifier que le médecin existe
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(doctorId) },
    });
    if (!doctor) {
      return res.status(404).json({ error: 'Médecin non trouvé' });
    }

    console.log('🔍 Demande de RDV reçue:', { doctorId, type, reason, notes, isVideo });

    // Préparer les données pour la création (sans date - le médecin la proposera)
    const appointmentData = {
      patientId: patient.id,
      doctorId: parseInt(doctorId),
      date: null, // ✅ Le médecin choisira la date plus tard
      type: type || 'Consultation générale',
      reason: reason || null,
      notes: notes || null,
      isVideo: Boolean(isVideo),
      status: 'PENDING' as const,
    };

    console.log('✅ Données préparées:', appointmentData);

    // Créer le rendez-vous
    const appointment = await prisma.appointment.create({
      data: appointmentData,
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
      message: 'Demande de rendez-vous envoyée avec succès. Le médecin vous proposera une date.',
      appointment,
    });
  } catch (error: any) {
    console.error('=== ERREUR CRÉATION RDV ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Détails complets:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
};

/**
 * Annuler un rendez-vous
 */
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Vérifier que le rendez-vous appartient au patient
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (appointment.patientId !== patient.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Vérifier que le rendez-vous peut être annulé (seulement PENDING ou CONFIRMED)
    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Ce rendez-vous est déjà annulé' });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Impossible d\'annuler un rendez-vous terminé' });
    }

    // Annuler le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CANCELLED',
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

    return res.status(200).json({
      message: 'Rendez-vous annulé avec succès',
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Modifier un rendez-vous
 */
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;
    const { doctorId, date, type, reason, notes, isVideo } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Vérifier que le rendez-vous appartient au patient
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (appointment.patientId !== patient.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Vérifier que le rendez-vous peut être modifié (seulement PENDING)
    if (appointment.status !== 'PENDING') {
      return res.status(400).json({ 
        error: 'Seuls les rendez-vous en attente peuvent être modifiés' 
      });
    }

    // Si le médecin est modifié, vérifier qu'il existe
    if (doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: parseInt(doctorId) },
      });

      if (!doctor) {
        return res.status(404).json({ error: 'Médecin non trouvé' });
      }
    }

    console.log('🔍 Modification RDV ID:', id);
    console.log('🔍 Données reçues:', { doctorId, date, type, reason, notes, isVideo });

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (doctorId) updateData.doctorId = parseInt(doctorId);
    if (date) updateData.date = new Date(date);
    if (type) updateData.type = type;
    if (reason !== undefined) updateData.reason = reason || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (isVideo !== undefined) updateData.isVideo = Boolean(isVideo);

    console.log('✅ Données préparées pour mise à jour:', updateData);

    // Modifier le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: updateData,
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

    console.log('✅ RDV modifié avec succès:', updatedAppointment.id);

    return res.status(200).json({
      message: 'Rendez-vous modifié avec succès',
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    console.error('❌ Erreur modification RDV:', error);
    console.error('❌ Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
};

/**
 * Récupérer toutes les ordonnances du patient connecté
 */
export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // CORRECTION: 'id' au lieu de 'userId'
    console.log('👤 User complet:', (req as any).user);

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le patient
    const patient = await prisma.patient.findUnique({
      where: { userId },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Récupérer toutes les consultations du patient (même sans ordonnance pour debug)
    const allConsultations = await prisma.consultation.findMany({
      where: { patientId: patient.id },
    });
    // Récupérer toutes les consultations avec ordonnances
    const consultations = await prisma.consultation.findMany({
      where: { 
        patientId: patient.id,
        prescription: {
          isNot: null, // Seulement les consultations avec ordonnance
        },
      },
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
            medications: true, // ✅ INCLURE LES MÉDICAMENTS
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
    // Si aucune ordonnance, vérifier toutes les prescriptions existantes
    if (consultations.length === 0) {
      const allPrescriptions = await prisma.prescription.findMany({
        include: {
          consultation: {
            select: {
              patientId: true,
            },
          },
        },
      });
      console.log(`📊 Prescriptions pour ce patient:`, 
        allPrescriptions.filter(p => p.consultation.patientId === patient.id).length
      );
    }

    // Formatter les données pour le frontend
    const prescriptions = consultations
      .filter(c => c.prescription) // Double vérification
      .map(consultation => ({
        id: consultation.prescription!.id.toString(),
        date: consultation.date.toISOString(),
        doctor: {
          name: consultation.doctor.user.name,
          specialty: consultation.doctor.speciality, // ✅ Correction: speciality (DB) → specialty (API)
        },
        diagnosis: consultation.diagnosis || 'Non spécifié',
        // Nouveau format : plusieurs médicaments par prescription
        medications: consultation.prescription!.medications.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency || 'Non spécifié',
          duration: med.duration,
          instructions: med.instructions || 'Suivre les instructions du médecin',
        })),
        notes: `Ordonnance émise le ${new Date(consultation.prescription!.issuedAt).toLocaleDateString('fr-FR')}`,
        status: 'ACTIVE', // Par défaut
      }));
    return res.status(200).json({
      prescriptions,
      total: prescriptions.length,
    });
  } catch (error) {
    console.error('❌ Erreur récupération ordonnances:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: (error as Error).message });
  }
};

/**
 * Récupérer les demandes d'accès au DSE du patient
 */
export const getDseAccessRequests = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Récupérer le patient
    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    // Récupérer les demandes d'accès
    const requests = await prisma.dseAccessRequest.findMany({
      where: {
        patientId: patient.id,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      requests,
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
    });
  } catch (error) {
    console.error('Erreur récupération demandes d\'accès:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Approuver ou refuser une demande d'accès au DSE
 */
export const respondToDseAccessRequest = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: userId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Profil patient non trouvé' });
    }

    const { requestId } = req.params;
    const { action, expiresInDays } = req.body; // action: 'approve' ou 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide (approve ou reject)' });
    }

    // Vérifier que la demande appartient au patient
    const request = await prisma.dseAccessRequest.findUnique({
      where: { id: parseInt(requestId) },
    });

    if (!request || request.patientId !== patient.id) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    // Mettre à jour la demande
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    const expiresAt = action === 'approve' && expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const updatedRequest = await prisma.dseAccessRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        status,
        expiresAt,
      },
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
      },
    });

    // ✅ Envoyer événement HCS pour traçabilité
    try {
      if (hederaHcsService.isAvailable()) {
        const eventType = action === 'approve' 
          ? HcsEventType.DSE_ACCESS_GRANTED 
          : HcsEventType.DSE_ACCESS_DENIED;

        const hcsMessage = new HcsMessageBuilder()
          .setEventType(eventType)
          .setEntity(HcsEntityType.DSE_ACCESS, updatedRequest.id)
          .setUser(userId, 'PATIENT')
          .setDataHash({
            requestId: updatedRequest.id,
            patientId: updatedRequest.patientId,
            doctorId: updatedRequest.doctorId,
            status: updatedRequest.status,
            expiresAt: updatedRequest.expiresAt,
          })
          .addMetadata('patientId', updatedRequest.patientId)
          .addMetadata('doctorId', updatedRequest.doctorId)
          .addMetadata('action', action)
          .build();

        await hederaHcsService.submit(hcsMessage, { priority: 8 });
      }
    } catch (hcsError) {
      console.error('Erreur lors de l\'envoi HCS:', hcsError);
    }

    // ✅ Récompenser le patient si accès accordé (partage DSE = 150 KNP)
    if (action === 'approve') {
      try {
        await rewardRulesService.rewardDseShared(userId, updatedRequest.id);
      } catch (rewardError) {
        console.error('Erreur lors de la récompense DSE partagé:', rewardError);
      }
    }

    return res.status(200).json({
      message: action === 'approve' 
        ? 'Accès accordé au médecin' 
        : 'Demande refusée',
      request: updatedRequest,
    });
  } catch (error) {
    console.error('Erreur traitement demande d\'accès:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

