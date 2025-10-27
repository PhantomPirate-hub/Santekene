import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { Role } from '@prisma/client';
import { hederaHcsService } from '../services/hedera-hcs.service.js';
import { HcsMessageBuilder } from '../services/hcs-message-builder.service.js';
import { rewardRulesService } from '../services/reward-rules.service.js';

/**
 * Contrôleur pour les consultations
 */

/**
 * Créer une nouvelle consultation (Médecin uniquement)
 */
export const createConsultation = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    // Vérifier que l'utilisateur est un médecin
    if (currentUser?.role !== Role.MEDECIN) {
      return res.status(403).json({ error: 'Seuls les médecins peuvent créer des consultations' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    const {
      patientId,
      appointmentId,
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      treatment,
      notes,
    } = req.body;

    // Validation
    if (!patientId || !diagnosis) {
      return res.status(400).json({
        error: 'Patient et diagnostic sont requis',
      });
    }

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Créer la consultation
    const consultation = await prisma.consultation.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: doctor.id,
        date: new Date(),
        chiefComplaint: chiefComplaint || '',
        historyOfPresentIllness: historyOfPresentIllness || '',
        physicalExamination: physicalExamination || '',
        diagnosis,
        treatment: treatment || '',
        notes: notes || '',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
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
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Si un rendez-vous est associé, le marquer comme complété
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: parseInt(appointmentId) },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    // Créer une notification pour le patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        type: 'CONSULTATION',
        title: 'Nouvelle consultation',
        message: `Une consultation a été enregistrée par ${currentUser.name}. Diagnostic: ${diagnosis}`,
        isRead: false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_CONSULTATION',
        userId: userId,
        details: `Consultation créée pour le patient ${patient.id} - Diagnostic: ${diagnosis}`,
      },
    });

    // 🔗 Intégration Hedera HCS : Enregistrer la consultation sur la blockchain
    try {
      const hcsMessage = HcsMessageBuilder.forConsultationCreated(
        userId,
        'MEDECIN',
        consultation.id,
        { diagnosis, treatment, notes, date: consultation.date },
        patient.id,
        doctor.id
      );

      // Soumettre via queue (non-bloquant)
      await hederaHcsService.submit(hcsMessage, { useQueue: true, priority: 5 });
      
      console.log(`✅ Consultation ${consultation.id} soumise à HCS`);
    } catch (hcsError) {
      // Ne pas bloquer la création si HCS échoue
      console.error('⚠️  Erreur HCS (non-bloquant):', hcsError);
    }

    // 🎁 Récompense KenePoints : Consultation complétée
    try {
      await rewardRulesService.rewardConsultationCompleted(
        parseInt(patientId),
        consultation.id
      );
      console.log(`✅ Récompense attribuée au patient ${patientId} pour consultation ${consultation.id}`);
    } catch (rewardError) {
      // Ne pas bloquer la création si la récompense échoue
      console.error('⚠️  Erreur récompense (non-bloquant):', rewardError);
    }

    return res.status(201).json({
      message: 'Consultation créée avec succès',
      consultation,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer une consultation par ID
 */
export const getConsultationById = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const consultation = await prisma.consultation.findUnique({
      where: { id: parseInt(id) },
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
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        prescription: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    // Contrôle d'accès
    if (currentUser?.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!patient || consultation.patientId !== patient.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    } else if (currentUser?.role === Role.MEDECIN) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: currentUser.id },
      });
      if (!doctor || consultation.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }
    // Admin et SuperAdmin peuvent tout voir

    return res.status(200).json(consultation);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour une consultation (Médecin uniquement)
 */
export const updateConsultation = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    if (currentUser?.role !== Role.MEDECIN) {
      return res.status(403).json({ error: 'Seuls les médecins peuvent modifier des consultations' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que la consultation existe et appartient au médecin
    const consultation = await prisma.consultation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    if (consultation.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const {
      chiefComplaint,
      historyOfPresentIllness,
      physicalExamination,
      diagnosis,
      treatment,
      notes,
    } = req.body;

    // Mettre à jour la consultation
    const updatedConsultation = await prisma.consultation.update({
      where: { id: parseInt(id) },
      data: {
        ...(chiefComplaint !== undefined && { chiefComplaint }),
        ...(historyOfPresentIllness !== undefined && { historyOfPresentIllness }),
        ...(physicalExamination !== undefined && { physicalExamination }),
        ...(diagnosis !== undefined && { diagnosis }),
        ...(treatment !== undefined && { treatment }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
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
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        prescription: true,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CONSULTATION',
        userId: userId,
        details: `Consultation ${id} mise à jour`,
      },
    });

    // 🔗 Intégration Hedera HCS : Enregistrer la modification sur la blockchain
    try {
      const hcsMessage = HcsMessageBuilder.forConsultationUpdated(
        userId,
        'MEDECIN',
        updatedConsultation.id,
        {
          diagnosis: updatedConsultation.diagnosis,
          treatment: updatedConsultation.treatment,
          notes: updatedConsultation.notes,
          date: updatedConsultation.date,
        },
        updatedConsultation.patientId,
        doctor.id
      );

      // Soumettre via queue (non-bloquant)
      await hederaHcsService.submit(hcsMessage, { useQueue: true, priority: 5 });
      
      console.log(`✅ Consultation ${updatedConsultation.id} (modification) soumise à HCS`);
    } catch (hcsError) {
      // Ne pas bloquer la modification si HCS échoue
      console.error('⚠️  Erreur HCS (non-bloquant):', hcsError);
    }

    return res.status(200).json({
      message: 'Consultation mise à jour avec succès',
      consultation: updatedConsultation,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer une consultation (Admin uniquement)
 */
export const deleteConsultation = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent supprimer des consultations' });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: parseInt(id) },
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    // Supprimer la consultation (cela supprimera aussi la prescription associée en cascade)
    await prisma.consultation.delete({
      where: { id: parseInt(id) },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_CONSULTATION',
        userId: currentUser.id,
        details: `Consultation ${id} supprimée`,
      },
    });

    return res.status(200).json({
      message: 'Consultation supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer toutes les consultations (Admin uniquement)
 */
export const getAllConsultations = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const { patientId, doctorId, startDate, endDate } = req.query;

    const where: any = {};

    if (patientId) {
      where.patientId = parseInt(patientId as string);
    }

    if (doctorId) {
      where.doctorId = parseInt(doctorId as string);
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
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
                id: true,
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

