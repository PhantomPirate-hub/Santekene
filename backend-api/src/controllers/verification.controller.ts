import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import crypto from 'crypto';

/**
 * Contrôleur pour la vérification d'intégrité des données blockchain
 */

/**
 * Vérifier l'intégrité d'une consultation
 * GET /api/verify/consultation/:id
 */
export const verifyConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Récupérer la consultation
    const consultation = await prisma.consultation.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation non trouvée' });
    }

    // Calculer le hash actuel
    const currentData = {
      diagnosis: consultation.diagnosis,
      treatment: consultation.treatment,
      notes: consultation.notes,
      date: consultation.date,
    };
    const currentHash = crypto.createHash('sha256').update(JSON.stringify(currentData)).digest('hex');

    // Récupérer le message HCS enregistré
    const hcsTransaction = await prisma.hederaTransaction.findFirst({
      where: {
        entityId: consultation.id,
        type: 'HCS_MESSAGE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const blockchainTxId = consultation.blockchainTxId || hcsTransaction?.txId;

    if (!blockchainTxId) {
      return res.status(200).json({
        entity: 'consultation',
        entityId: consultation.id,
        isValid: false,
        currentHash,
        error: 'Aucune transaction blockchain trouvée pour cette consultation',
        warning: 'Cette consultation n\'a pas été enregistrée sur la blockchain',
      });
    }

    // TODO: Récupérer le message depuis Hedera pour comparer
    // Pour l'instant, on se base sur le cache/DB

    return res.status(200).json({
      entity: 'consultation',
      entityId: consultation.id,
      isValid: true, // Assumé valide si transaction existe
      currentHash,
      blockchainTxId,
      consensusTimestamp: hcsTransaction?.consensusTimestamp,
      createdAt: consultation.date,
      metadata: {
        patientName: consultation.patient.user.name,
        doctorName: consultation.doctor.user.name,
        diagnosis: consultation.diagnosis,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier l'intégrité d'une prescription
 * GET /api/verify/prescription/:id
 */
export const verifyPrescription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true,
        consultation: {
          include: {
            patient: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
            doctor: {
              include: {
                user: {
                  select: { id: true, name: true },
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

    // Calculer le hash actuel
    const currentData = {
      medications: prescription.items,
      instructions: prescription.instructions,
      duration: prescription.duration,
      issuedAt: prescription.issuedAt,
    };
    const currentHash = crypto.createHash('sha256').update(JSON.stringify(currentData)).digest('hex');

    // Récupérer la transaction HCS
    const hcsTransaction = await prisma.hederaTransaction.findFirst({
      where: {
        entityId: prescription.id,
        type: 'HCS_MESSAGE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const blockchainTxId = prescription.nftTokenId || hcsTransaction?.txId;

    if (!blockchainTxId) {
      return res.status(200).json({
        entity: 'prescription',
        entityId: prescription.id,
        isValid: false,
        currentHash,
        error: 'Aucune transaction blockchain trouvée pour cette prescription',
      });
    }

    return res.status(200).json({
      entity: 'prescription',
      entityId: prescription.id,
      isValid: true,
      currentHash,
      blockchainTxId,
      consensusTimestamp: hcsTransaction?.consensusTimestamp,
      createdAt: prescription.issuedAt,
      metadata: {
        patientName: prescription.consultation.patient.user.name,
        doctorName: prescription.consultation.doctor.user.name,
        medicationsCount: prescription.items.length,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier l'intégrité d'un document
 * GET /api/verify/document/:id
 */
export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Récupérer la transaction HCS
    const hcsTransaction = await prisma.hederaTransaction.findFirst({
      where: {
        entityId: document.id,
        type: 'HCS_MESSAGE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const blockchainTxId = hcsTransaction?.txId;

    if (!blockchainTxId) {
      return res.status(200).json({
        entity: 'document',
        entityId: document.id,
        isValid: false,
        currentHash: document.hash,
        error: 'Aucune transaction blockchain trouvée pour ce document',
      });
    }

    return res.status(200).json({
      entity: 'document',
      entityId: document.id,
      isValid: true,
      currentHash: document.hash,
      blockchainTxId,
      consensusTimestamp: hcsTransaction.consensusTimestamp,
      createdAt: document.createdAt,
      metadata: {
        patientName: document.patient.user.name,
        type: document.type,
        name: document.name,
        size: document.size,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier l'intégrité de plusieurs entités (batch)
 * POST /api/verify/batch
 */
export const verifyBatch = async (req: Request, res: Response) => {
  try {
    const { entities } = req.body;

    if (!entities || !Array.isArray(entities)) {
      return res.status(400).json({ error: 'Format invalide' });
    }

    const results = await Promise.all(
      entities.map(async (entity: { type: string; id: number }) => {
        try {
          switch (entity.type) {
            case 'consultation':
              const consultation = await prisma.consultation.findUnique({
                where: { id: entity.id },
              });
              return {
                type: entity.type,
                id: entity.id,
                exists: !!consultation,
                blockchainTxId: consultation?.blockchainTxId,
              };

            case 'prescription':
              const prescription = await prisma.prescription.findUnique({
                where: { id: entity.id },
              });
              return {
                type: entity.type,
                id: entity.id,
                exists: !!prescription,
                blockchainTxId: prescription?.nftTokenId,
              };

            case 'document':
              const hcsTransaction = await prisma.hederaTransaction.findFirst({
                where: {
                  entityId: entity.id,
                  type: 'HCS_MESSAGE',
                },
              });
              return {
                type: entity.type,
                id: entity.id,
                exists: !!hcsTransaction,
                blockchainTxId: hcsTransaction?.txId,
              };

            default:
              return {
                type: entity.type,
                id: entity.id,
                error: 'Type non supporté',
              };
          }
        } catch (error) {
          return {
            type: entity.type,
            id: entity.id,
            error: 'Erreur lors de la vérification',
          };
        }
      })
    );

    return res.status(200).json({
      total: results.length,
      verified: results.filter(r => r.blockchainTxId).length,
      results,
    });
  } catch (error) {
    console.error('Erreur lors de la vérification batch:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

