import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { Role } from '@prisma/client';
import crypto from 'crypto';
import { hederaHcsService } from '../services/hedera-hcs.service.js';
import { HcsMessageBuilder } from '../services/hcs-message-builder.service.js';
import { fileStorageService } from '../services/file-storage.service.js';
import { hederaHfsService } from '../services/hedera-hfs.service.js';
import { hederaQueueService } from '../services/hedera-queue.service.js';
import { rewardRulesService } from '../services/reward-rules.service.js';

/**
 * Contrôleur pour les documents médicaux
 */

/**
 * Uploader un document médical (STOCKAGE HYBRIDE MinIO + Hedera HFS)
 */
export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const { patientId, type, description, consultationId } = req.body;

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

    // =============== PHASE 1 : UPLOAD SUR MinIO/S3 ===============
    console.log(`📤 Upload document: ${file.originalname} (${file.size} bytes)`);

    const fileUpload = await fileStorageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      {
        patientId: patientId.toString(),
        type,
        uploadedBy: currentUser.id.toString(),
      }
    );

    console.log(`✅ Fichier uploadé sur ${fileUpload.url}`);

    // =============== PHASE 2 : CRÉER LE CERTIFICAT HFS ===============
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const certificate = hederaHfsService.createCertificate(
      file.buffer,
      file.originalname,
      file.mimetype,
      fileUpload.url, // URL MinIO/Local
      currentUser.id,
      currentUser.role,
      {
        type: 'DOCUMENT',
        id: 0, // Sera mis à jour après création du document
      }
    );

    console.log(`📜 Certificat créé - Hash: ${certificate.fileHash}`);

    // =============== PHASE 3 : CRÉER LE DOCUMENT EN DB ===============
    const document = await prisma.document.create({
      data: {
        patientId: parseInt(patientId),
        consultationId: consultationId ? parseInt(consultationId) : null, // Lier à la consultation si fourni
        type,
        url: fileUpload.url, // URL MinIO (sera mis à jour avec FileId Hedera via worker)
        fileUrl: fileUpload.url, // URL MinIO permanente
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

    console.log(`✅ Document créé en DB: ID ${document.id}`);

    // =============== PHASE 4 : SOUMETTRE CERTIFICAT À HEDERA (ASYNC) ===============
    try {
      // Mettre à jour l'entityId du certificat
      certificate.relatedEntity = {
        type: 'DOCUMENT',
        id: document.id,
      };

      // Soumettre le certificat via queue HFS (non-bloquant)
      await hederaQueueService.addHfsJob(
        {
          certificate,
          documentId: document.id,
          userId: currentUser.id,
        },
        {
          priority: 6,
          delay: 1000, // 1 seconde de délai pour éviter rate limiting
        }
      );

      console.log(`✅ Certificat HFS soumis à la queue pour document ${document.id}`);
    } catch (hfsError) {
      console.error('⚠️  Erreur soumission certificat HFS (non-bloquant):', hfsError);
    }

    // =============== PHASE 5 : HCS (ÉVÉNEMENT UPLOAD) ===============
    try {
      const hcsMessage = HcsMessageBuilder.forDocumentUploaded(
        currentUser.id,
        currentUser.role as 'PATIENT' | 'MEDECIN',
        document.id,
        fileHash,
        parseInt(patientId),
        type
      );

      // Soumettre via queue (non-bloquant)
      await hederaHcsService.submit(hcsMessage, { useQueue: true, priority: 6 });

      console.log(`✅ Document ${document.id} (${type}) soumis à HCS`);
    } catch (hcsError) {
      console.error('⚠️  Erreur HCS (non-bloquant):', hcsError);
    }

    // =============== PHASE 6 : NOTIFICATION & AUDIT ===============
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        type: 'DOCUMENT',
        title: 'Nouveau document médical',
        message: `Un document de type "${type}" a été ajouté à votre dossier.`,
        isRead: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPLOAD_DOCUMENT',
        userId: currentUser.id,
        details: `Document uploadé pour le patient ${patientId} - Type: ${type}, Hash: ${fileHash}`,
      },
    });

    // 🎁 Récompense KenePoints : Document uploadé
    try {
      await rewardRulesService.rewardDocumentUploaded(
        currentUser.id,
        document.id
      );
      console.log(`✅ Récompense attribuée à l'utilisateur ${currentUser.id} pour document ${document.id}`);
    } catch (rewardError) {
      // Ne pas bloquer l'upload si la récompense échoue
      console.error('⚠️  Erreur récompense (non-bloquant):', rewardError);
    }

    return res.status(201).json({
      message: 'Document uploadé avec succès',
      document,
      storage: {
        type: fileStorageService.isAvailable() ? 'MinIO/S3' : 'Local',
        url: fileUpload.url,
        size: fileUpload.size,
      },
      blockchain: {
        hfsQueued: true,
        hcsQueued: true,
        fileHash,
      },
    });
  } catch (error) {
    console.error('❌ Erreur upload document:', error);
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
 * Télécharger un document (HYBRIDE MinIO/Local)
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

    try {
      // Récupérer le fichier depuis le stockage (MinIO ou local)
      const fileUrl = document.fileUrl || document.url;
      const fileBuffer = await fileStorageService.downloadFile(fileUrl);

      // Vérifier l'intégrité du fichier avec le hash stocké
      const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      if (currentHash !== document.hash) {
        console.warn(`⚠️  Intégrité compromise pour document ${id}: hash ne correspond pas`);
        // On continue quand même mais on log l'avertissement
      }

      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
      res.setHeader('Content-Length', fileBuffer.length.toString());
      res.setHeader('X-File-Hash', document.hash); // Hash original pour vérification cliente

      return res.send(fileBuffer);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du fichier:', error);
      return res.status(500).json({
        error: 'Erreur lors de la récupération du fichier',
        message: 'Le fichier est peut-être corrompu ou inaccessible',
      });
    }
  } catch (error) {
    console.error('❌ Erreur download document:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier l'intégrité d'un document (AVEC CERTIFICAT HEDERA HFS)
 */
export const verifyDocumentIntegrity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { downloadFromStorage } = req.query; // Option pour télécharger depuis stockage

    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    let fileBuffer: Buffer;

    // Si un fichier est fourni dans la requête, l'utiliser
    if (req.file) {
      fileBuffer = req.file.buffer;
    }
    // Sinon, télécharger depuis le stockage
    else if (downloadFromStorage === 'true') {
      const fileUrl = document.fileUrl || document.url;
      fileBuffer = await fileStorageService.downloadFile(fileUrl);
    } else {
      return res.status(400).json({
        error: 'Aucun fichier fourni pour la vérification',
        hint: 'Uploadez un fichier ou utilisez ?downloadFromStorage=true',
      });
    }

    // ===== VÉRIFICATION NIVEAU 1 : HASH DB =====
    const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const dbHashValid = currentHash === document.hash;

    // ===== VÉRIFICATION NIVEAU 2 : CERTIFICAT HEDERA HFS =====
    let hfsVerification: any = null;

    // Récupérer le FileId Hedera depuis url (si commence par 0.0.)
    if (document.url.startsWith('0.0.')) {
      try {
        const hfsFileId = document.url;
        hfsVerification = await hederaHfsService.verifyFileIntegrity(fileBuffer, hfsFileId);

        console.log(`✅ Vérification HFS pour document ${id}: ${hfsVerification.isValid}`);
      } catch (hfsError) {
        console.error('⚠️  Erreur vérification HFS:', hfsError);
        hfsVerification = {
          error: 'Certificat HFS non accessible',
          details: (hfsError as Error).message,
        };
      }
    }

    // ===== RÉSULTAT GLOBAL =====
    const isFullyValid = dbHashValid && (hfsVerification?.isValid !== false);

    return res.status(200).json({
      verified: isFullyValid,
      verification: {
        database: {
          valid: dbHashValid,
          storedHash: document.hash,
          currentHash,
        },
        blockchain: hfsVerification
          ? {
              available: true,
              valid: hfsVerification.isValid,
              certificateHash: hfsVerification.certificateHash,
              certificate: hfsVerification.certificate,
            }
          : {
              available: false,
              reason: 'Document uploadé avant intégration HFS',
            },
      },
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        uploadedAt: document.createdAt,
        uploadedBy: document.uploadedBy,
      },
      message: isFullyValid
        ? '✅ Le document est authentique et n\'a pas été modifié'
        : '⚠️  Attention : le document a été modifié ou ne correspond pas aux enregistrements',
    });
  } catch (error) {
    console.error('❌ Erreur vérification document:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

