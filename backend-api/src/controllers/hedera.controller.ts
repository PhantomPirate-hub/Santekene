import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as hederaService from '../services/hedera.service.ts';

const prisma = new PrismaClient();

/**
 * Contrôleur pour les opérations Hedera
 */
export const hederaController = {
  /**
   * Soumettre un message à Hedera Consensus Service (HCS)
   */
  submitHcsMessage: async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Le message est requis' });
      }

      // Soumettre le message à HCS
      const transactionId = await hederaService.submitMessageToHcs(message);

      // Enregistrer dans les logs d'audit
      const currentUser = (req as any).user;
      await prisma.auditLog.create({
        data: {
          action: 'HCS_MESSAGE_SUBMIT',
          userId: currentUser?.id,
          hcsTxId: transactionId,
          details: `Message soumis à HCS: ${message.substring(0, 50)}...`,
        },
      });

      return res.status(200).json({
        message: 'Message soumis avec succès à HCS',
        transactionId: transactionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur lors de la soumission du message HCS:', error);
      return res.status(500).json({
        error: 'Erreur lors de la soumission du message à HCS',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  },

  /**
   * Uploader un fichier vers Hedera File Service (HFS)
   */
  uploadFileToHFS: async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
      }

      // Upload le fichier à HFS
      const fileId = await hederaService.uploadFileToHfs(file.buffer);
      
      // Calculer un hash simple pour le fichier
      const crypto = await import('crypto');
      const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // Enregistrer le document dans la base de données
      const currentUser = (req as any).user;
      const { patientId, type } = req.body;

      if (patientId && type) {
        await prisma.document.create({
          data: {
            patientId: parseInt(patientId),
            type,
            url: fileId,
            hash: fileHash,
          },
        });
      }

      // Enregistrer dans les logs d'audit
      await prisma.auditLog.create({
        data: {
          action: 'HFS_FILE_UPLOAD',
          userId: currentUser?.id,
          details: `Fichier uploadé sur HFS: ${fileId}`,
        },
      });

      return res.status(200).json({
        message: 'Fichier uploadé avec succès sur HFS',
        fileId: fileId,
        hash: fileHash,
        size: file.size,
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier HFS:', error);
      return res.status(500).json({
        error: 'Erreur lors de l\'upload du fichier sur HFS',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  },

  /**
   * Créer le token KènèPoints (HTS) - Admin uniquement
   */
  createKenePointsToken: async (req: Request, res: Response) => {
    try {
      const { name, symbol, initialSupply } = req.body;

      if (!name || !symbol) {
        return res.status(400).json({
          error: 'Le nom et le symbole du token sont requis',
        });
      }

      // Créer le token sur Hedera
      const tokenId = await hederaService.createFungibleToken(name, symbol);

      // Enregistrer dans les logs d'audit
      const currentUser = (req as any).user;
      await prisma.auditLog.create({
        data: {
          action: 'HTS_TOKEN_CREATE',
          userId: currentUser?.id,
          details: `Token KènèPoints créé: ${tokenId} (${name} - ${symbol})`,
        },
      });

      return res.status(200).json({
        message: 'Token KènèPoints créé avec succès',
        tokenId: tokenId,
        name,
        symbol,
        initialSupply: initialSupply || 1000000,
      });
    } catch (error) {
      console.error('Erreur lors de la création du token HTS:', error);
      return res.status(500).json({
        error: 'Erreur lors de la création du token KènèPoints',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  },
};

