import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { Role } from '@prisma/client';
import * as hederaService from '../services/hedera.service.js';
import crypto from 'crypto';

/**
 * Contrôleur pour les documents médicaux
 */

/**
 * Uploader un document médical
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { patientId, type, description } = req.body;

    // Validation
    if (!patientId || !type) {
      return res.status(400).json({
        error: 'Patient et type de document sont requis',
      });
    }

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Contrôle d'accès : Médecin, Admin ou le patient lui-même
    if (currentUser?.role === Role.PATIENT) {
      const userPatient = await prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!userPatient || userPatient.id !== parseInt(patientId)) {
        return res.status(403).json({ error: 'Non autorisé' });
      }
    }

    // Calculer le hash du fichier
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Uploader le fichier sur Hedera File Service (si configuré)
    let fileId = null;
    try {
      fileId = await hederaService.uploadFileToHfs(file.buffer);

      // Enregistrer la transaction Hedera
      await prisma.hederaTransaction.create({
        data: {
          transactionId: fileId,
          type: 'FILE_UPLOAD',
          userId: currentUser.id,
          amount: file.size,
          details: `Document médical uploadé - File ID: ${fileId}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload sur HFS:', error);
      // Continuer sans Hedera si non configuré
      fileId = `local_${Date.now()}_${file.originalname}`;
    }

    // Créer le document dans la base de données
    const document = await prisma.document.create({
      data: {
        patientId: parseInt(patientId),
        type,
        url: fileId,
        hash: fileHash,
        name: file.originalname,
        description: description || '',
        size: file.size,
        mimeType: file.mimetype,
        uploadedBy: currentUser.id,
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
      },
    });

    // Créer une notification pour le patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        type: 'DOCUMENT',
        title: 'Nouveau document médical',
        message: `Un document de type "${type}" a été ajouté à votre dossier.`,
        isRead: false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD_DOCUMENT',
        userId: currentUser.id,
        details: `Document uploadé pour le patient ${patientId} - Type: ${type}, Hash: ${fileHash}`,
      },
    });

    return res.status(201).json({
      message: 'Document uploadé avec succès',
      document,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer un document par ID
 */
export const getDocumentById = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
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
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Contrôle d'accès
    if (currentUser?.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!patient || document.patientId !== patient.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }
    // Médecins, Admin et SuperAdmin peuvent accéder

    return res.status(200).json({ document });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer tous les documents d'un patient
 */
export const getPatientDocuments = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { patientId } = req.params;
    const { type } = req.query;

    // Contrôle d'accès
    if (currentUser?.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!patient || patient.id !== parseInt(patientId)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    const where: any = {
      patientId: parseInt(patientId),
    };

    if (type) {
      where.type = type as string;
    }

    const documents = await prisma.document.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(documents);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour les métadonnées d'un document
 */
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { type, description } = req.body;

    // Seuls Médecin, Admin et SuperAdmin peuvent modifier
    if (currentUser?.role === Role.PATIENT) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: parseInt(id) },
      data: {
        ...(type && { type }),
        ...(description !== undefined && { description }),
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
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_DOCUMENT',
        userId: currentUser.id,
        details: `Document ${id} mis à jour`,
      },
    });

    return res.status(200).json({
      message: 'Document mis à jour avec succès',
      document: updatedDocument,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un document
 */
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    // Seuls Admin et SuperAdmin peuvent supprimer
    if (currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.SUPERADMIN) {
      return res.status(403).json({ error: 'Seuls les administrateurs peuvent supprimer des documents' });
    }

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    await prisma.document.delete({
      where: { id: parseInt(id) },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_DOCUMENT',
        userId: currentUser.id,
        details: `Document ${id} supprimé - Hash: ${document.hash}`,
      },
    });

    return res.status(200).json({
      message: 'Document supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Télécharger un document
 */
export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Contrôle d'accès
    if (currentUser?.role === Role.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { userId: currentUser.id },
      });
      if (!patient || document.patientId !== patient.id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }

    // Enregistrer l'accès dans les logs
    await prisma.auditLog.create({
      data: {
        action: 'DOWNLOAD_DOCUMENT',
        userId: currentUser.id,
        details: `Document ${id} téléchargé`,
      },
    });

    // Si le document est sur Hedera, le récupérer
    if (document.url.startsWith('0.0.')) {
      try {
        const fileContent = await hederaService.getFileFromHfs(document.url);
        res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
        return res.send(fileContent);
      } catch (error) {
        console.error('Erreur lors de la récupération du fichier depuis HFS:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération du fichier' });
      }
    }

    // Sinon, retourner les métadonnées (à adapter selon votre stockage local)
    return res.status(200).json({
      message: 'Document disponible',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        url: document.url,
        hash: document.hash,
        size: document.size,
        mimeType: document.mimeType,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier l'intégrité d'un document
 */
export const verifyDocumentIntegrity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni pour la vérification' });
    }

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Calculer le hash du fichier fourni
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const isValid = fileHash === document.hash;

    return res.status(200).json({
      verified: isValid,
      documentHash: document.hash,
      providedHash: fileHash,
      message: isValid
        ? 'Le document est authentique et n\'a pas été modifié'
        : 'Attention : le document a été modifié ou ne correspond pas',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

