import { Request, Response } from 'express';
import { hederaService } from '../services/hedera.service.ts';
import { prisma } from '../services/prisma.service.ts';
import * as CryptoJS from 'crypto-js';

class HederaController {
  async submitHcsMessage(req: Request, res: Response) {
    const { action, payload } = req.body;
    const user = req.user;

    if (!action || !payload) {
      return res.status(400).json({ message: 'Les champs "action" et "payload" sont requis.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    try {
      const auditMessage = JSON.stringify({
        userId: user.id,
        userRole: user.role,
        action,
        payload,
        timestamp: new Date().toISOString(),
      });

      const transactionId = await hederaService.submitToHCS(auditMessage);

      await prisma.auditLog.create({
        data: {
          action,
          userId: user.id,
          details: JSON.stringify(payload),
          hcsTxId: transactionId,
        },
      });

      res.status(201).json({ 
        message: 'Action enregistrée avec succès sur la blockchain.', 
        transactionId 
      });

    } catch (error) {
      console.error("Erreur dans le contrôleur Hedera:", error);
      res.status(500).json({ message: 'Erreur interne du serveur lors de l\'enregistrement de l\'action.' });
    }
  }

  async uploadFileToHFS(req: Request, res: Response) {
    const user = req.user;
    const file = req.file;

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier n\'a été uploadé.' });
    }

    try {
      const fileId = await hederaService.uploadToHFS(file.buffer);

      const document = await prisma.document.create({
        data: {
          patientId: user.id, // Assumes the user is the patient
          type: file.mimetype,
          url: `hfs://${fileId}`,
          hash: CryptoJS.SHA256(file.buffer.toString('base64')).toString(),
        },
      });

      res.status(201).json({ 
        message: 'Fichier uploadé avec succès sur HFS.', 
        fileId: fileId,
        documentId: document.id
      });

    } catch (error) {
      console.error("Erreur lors de l\'upload HFS:", error);
      res.status(500).json({ message: 'Erreur interne du serveur lors de l\'upload du fichier.' });
    }
  }

  async createKenePointsToken(req: Request, res: Response) {
    try {
      const tokenId = await hederaService.createFungibleToken("KenePoints", "KENE");

      // Idéalement, stocker ce Token ID dans une table de configuration en BDD
      console.log("KenePoints Token ID:", tokenId);

      res.status(201).json({ 
        message: 'Token KènèPoints créé avec succès.', 
        tokenId: tokenId
      });

    } catch (error) {
      console.error("Erreur lors de la création du token KènèPoints:", error);
      res.status(500).json({ message: 'Erreur interne du serveur.' });
    }
  }
}

export const hederaController = new HederaController();