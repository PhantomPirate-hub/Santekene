import { Request, Response } from 'express';
import { hederaHcsService } from '../services/hedera-hcs.service.js';
import { hederaHfsService } from '../services/hedera-hfs.service.js';
import { hederaHtsService } from '../services/hedera-hts.service.js';
import { HcsMessageBuilder } from '../services/hcs-message-builder.service.js';
import { HcsEventType, HcsEntityType } from '../types/hedera-hcs.types.js';

/**
 * Vérifier l'état des services Hedera (diagnostic)
 */
export const checkHederaStatus = async (req: Request, res: Response) => {
  try {
    const hcsStatus = hederaHcsService.getStats();
    const hfsStatus = hederaHfsService.getStats();
    const htsStatus = hederaHtsService.getStats();

    return res.status(200).json({
      status: 'ok',
      services: {
        hcs: {
          available: hcsStatus.isAvailable,
          operatorId: hcsStatus.operatorId,
          topicId: hcsStatus.topicId,
        },
        hfs: {
          available: hfsStatus.isAvailable,
          operatorId: hfsStatus.operatorId,
        },
        hts: {
          available: htsStatus.isAvailable,
          operatorId: htsStatus.operatorId,
          tokenId: htsStatus.tokenId,
        },
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Erreur vérification status Hedera:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Soumettre un message sur HCS
 */
export const submitHcsMessage = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { action, payload } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action requise' });
    }

    if (!hederaHcsService.isAvailable()) {
      return res.status(503).json({ error: 'Service HCS non disponible' });
    }

    const message = new HcsMessageBuilder()
      .setEventType(action as HcsEventType)
      .setEntity(HcsEntityType.PATIENT, userId)
      .setUser(userId, currentUser.role || 'PATIENT')
      .setDataHash(payload || {})
      .build();

    const result = await hederaHcsService.submit(message, { priority: 5 });

    return res.status(200).json({
      success: true,
      message: 'Message HCS soumis avec succès',
      transactionId: result.transactionId,
      consensusTimestamp: result.consensusTimestamp,
    });
  } catch (error: any) {
    console.error('Erreur soumission HCS:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Upload un fichier sur HFS
 */
export const uploadFileToHFS = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Fichier requis' });
    }

    if (!hederaHfsService.isAvailable()) {
      return res.status(503).json({ error: 'Service HFS non disponible' });
    }

    const { patientId, fileType, description } = req.body;

    const result = await hederaHfsService.createFile(req.file.buffer, {
      fileName: req.file.originalname,
      fileType: fileType || 'DOCUMENT',
      patientId: patientId ? parseInt(patientId) : 0,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      description,
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Fichier uploadé sur HFS avec succès',
        fileId: result.fileId,
        hash: result.hash,
        size: result.size,
        cost: result.cost,
      });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error: any) {
    console.error('Erreur upload HFS:', error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Créer le token KenePoints (Admin uniquement)
 */
export const createKenePointsToken = async (req: Request, res: Response) => {
  try {
    return res.status(501).json({
      error: 'Non implémenté',
      message: 'Utilisez le script create-kenepoint-token.ts pour créer le token',
    });
  } catch (error: any) {
    console.error('Erreur création token:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Export groupé pour compatibilité avec les routes
export const hederaController = {
  checkHederaStatus,
  submitHcsMessage,
  uploadFileToHFS,
  createKenePointsToken,
};

export default hederaController;
