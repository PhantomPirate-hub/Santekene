import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { Role } from '@prisma/client';
import * as hederaService from '../services/hedera.service.js';
import { hederaHcsService } from '../services/hedera-hcs.service.js';
import { HcsMessageBuilder } from '../services/hcs-message-builder.service.js';

/**
 * Contrôleur pour les prescriptions
 */

/**
 * Créer une nouvelle prescription (Médecin uniquement)
 */
export const createPrescription = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (currentUser?.role !== Role.MEDECIN) {
      return res.status(403).json({ error: 'Seuls les médecins peuvent créer des prescriptions' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    const { consultationId, medications, instructions, duration, nftMetadata } = req.body;

    // Validation
    if (!consultationId || !medications || medications.length === 0) {
      return res.status(400).json({
        error: 'Consultation et médicaments sont requis',
      });
    }

    // Vérifier que la consultation existe et appartient au médecin
    const consultation = await prisma.consultation.findUnique({
      where: { id: parseInt(consultationId) },
      include: {
        patient: true,
      },
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    if (consultation.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Créer le NFT sur Hedera (si configuré)
    let nftTokenId = null;
    let nftSerialNumber = null;

    try {
      // Préparer les métadonnées du NFT
      const metadata = {
        type: 'prescription',
        consultationId: consultation.id,
        patientId: consultation.patientId,
        doctorId: doctor.id,
        medications,
        timestamp: new Date().toISOString(),
        ...nftMetadata,
      };

      const nftData = await hederaService.createNft(
        'Prescription Médicale',
        'PRESCRIP',
        JSON.stringify(metadata)
      );

      nftTokenId = nftData.tokenId;
      nftSerialNumber = nftData.serialNumber;

      // Enregistrer la transaction Hedera
      await prisma.hederaTransaction.create({
        data: {
          txId: nftData.transactionId,
          type: 'HTS_MINT_NFT',
          userId: userId,
          entityId: parseInt(consultationId),
          status: 'SUCCESS',
          cost: 0,
          metadata: `NFT Prescription créé - Token: ${nftTokenId}, Serial: ${nftSerialNumber}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création du NFT:', error);
      // Continue quand même sans le NFT si Hedera n'est pas configuré
    }

    // Créer la prescription
    const prescription = await prisma.prescription.create({
      data: {
        consultationId: parseInt(consultationId),
        instructions: instructions || '',
        duration: duration || '',
        nftTokenId,
        nftSerialNumber,
        medications: {
          create: medications.map((med: any) => ({
            name: med.medication || med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration || duration || '',
            instructions: med.instructions || '',
          })),
        },
      },
      include: {
        medications: true,
        consultation: {
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
        },
      },
    });

    // Créer une notification pour le patient
    await prisma.notification.create({
      data: {
        userId: consultation.patient.userId,
        type: 'PRESCRIPTION',
        title: 'Nouvelle prescription',
        message: `Une prescription a été émise par ${currentUser.name}. ${nftTokenId ? `NFT Token: ${nftTokenId}` : ''}`,
        isRead: false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_PRESCRIPTION',
        userId: userId,
        hcsTxId: nftTokenId || undefined,
        details: `Prescription créée pour la consultation ${consultationId}. ${nftTokenId ? `NFT: ${nftTokenId}` : 'Sans NFT'}`,
      },
    });

    // 🔗 Intégration Hedera HCS : Enregistrer la prescription sur la blockchain
    try {
      const hcsMessage = HcsMessageBuilder.forPrescriptionIssued(
        userId,
        'MEDECIN',
        prescription.id,
        {
          medications,
          instructions: prescription.instructions,
          duration: prescription.duration,
          nftTokenId,
          issuedAt: new Date(),
        },
        consultation.patientId,
        parseInt(consultationId)
      );

      // Soumettre via queue (non-bloquant)
      await hederaHcsService.submit(hcsMessage, { useQueue: true, priority: 7 }); // Priorité haute pour prescriptions
      
      console.log(`✅ Prescription ${prescription.id} soumise à HCS`);
    } catch (hcsError) {
      // Ne pas bloquer la création si HCS échoue
      console.error('⚠️  Erreur HCS (non-bloquant):', hcsError);
    }

    return res.status(201).json({
      message: 'Prescription créée avec succès',
      prescription,
      nft: nftTokenId ? { tokenId: nftTokenId, serialNumber: nftSerialNumber } : null,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer une prescription par ID
 */
export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id || '0') },
      include: {
        medications: true,
        consultation: {
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
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription non trouvée' });
    }

    // Contrôle d'accès
    if (currentUser?.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!patient || prescription.consultation.patientId !== patient.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    } else if (currentUser?.role === Role.MEDECIN) {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: currentUser.id },
      });
      if (!doctor || prescription.consultation.doctorId !== doctor.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }
    // Admin et SuperAdmin peuvent tout voir

    return res.status(200).json(prescription);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour une prescription (Médecin uniquement)
 */
export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    if (currentUser?.role !== Role.MEDECIN) {
      return res.status(403).json({ error: 'Seuls les médecins peuvent modifier des prescriptions' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que la prescription existe et appartient au médecin
    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id || '0') },
      include: {
        consultation: true,
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription non trouvée' });
    }

    if (prescription.consultation.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const { instructions, duration, medications } = req.body;

    // Mettre à jour la prescription
    const updateData: any = {};
    if (instructions !== undefined) updateData.instructions = instructions;
    if (duration !== undefined) updateData.duration = duration;

    const updatedPrescription = await prisma.prescription.update({
      where: { id: parseInt(id || '0') },
      data: updateData,
      include: {
        medications: true,
        consultation: {
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
        },
      },
    });

    // Si des médicaments sont fournis, mettre à jour
    if (medications && Array.isArray(medications)) {
      // Supprimer les anciens médicaments
      await prisma.medication.deleteMany({
        where: { prescriptionId: parseInt(id || '0') },
      });

      // Créer les nouveaux médicaments
      await prisma.medication.createMany({
        data: medications.map((med: any) => ({
          prescriptionId: parseInt(id || '0'),
          name: med.medication || med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration || duration || '',
          instructions: med.instructions || '',
        })),
      });
    }

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PRESCRIPTION',
        userId: userId,
        details: `Prescription ${id} mise à jour`,
      },
    });

    return res.status(200).json({
      message: 'Prescription mise à jour avec succès',
      prescription: updatedPrescription,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer une prescription (Admin uniquement)
 */
export const deletePrescription = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent supprimer des prescriptions' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id || '0') },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription non trouvée' });
    }

    // Supprimer la prescription (cela supprimera aussi les médicaments en cascade)
    await prisma.prescription.delete({
      where: { id: parseInt(id || '0') },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_PRESCRIPTION',
        userId: currentUser.id,
        details: `Prescription ${id} supprimée`,
      },
    });

    return res.status(200).json({
      message: 'Prescription supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer toutes les prescriptions d'un patient
 */
export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { patientId } = req.params;

    // Contrôle d'accès
    if (currentUser?.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!patient || patient.id !== parseInt(patientId || '0')) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        consultation: {
          patientId: parseInt(patientId || '0'),
        },
      },
      include: {
        medications: true,
        consultation: {
          include: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier un NFT de prescription
 */
export const verifyPrescriptionNFT = async (req: Request, res: Response) => {
  try {
    const { tokenId, serialNumber } = req.params;

    const prescription = await prisma.prescription.findFirst({
      where: {
        nftTokenId: tokenId,
        nftSerialNumber: parseInt(serialNumber || '0'),
      },
      include: {
        medications: true,
        consultation: {
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
        },
      },
    });

    if (!prescription) {
      return res.status(404).json({
        verified: false,
        error: 'NFT de prescription non trouvé',
      });
    }

    return res.status(200).json({
      verified: true,
      prescription: {
        id: prescription.id,
        date: prescription.issuedAt,
        patient: prescription.consultation.patient.user.name,
        doctor: prescription.consultation.doctor.user.name,
        medications: prescription.medications,
        nft: {
          tokenId: prescription.nftTokenId,
          serialNumber: prescription.nftSerialNumber,
        },
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

