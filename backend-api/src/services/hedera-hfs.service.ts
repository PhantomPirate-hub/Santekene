/**
 * Service Hedera File Service (HFS)
 * Stockage immuable de documents médicaux sensibles
 */

import {
  Client,
  FileCreateTransaction,
  FileAppendTransaction,
  FileContentsQuery,
  FileId,
  Hbar,
  PrivateKey,
} from '@hashgraph/sdk';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Interface pour le résultat de création de fichier
 */
export interface HfsFileResult {
  success: boolean;
  fileId?: string;
  transactionId?: string;
  hash?: string;
  size?: number;
  cost?: number;
  error?: string;
}

/**
 * Interface pour les métadonnées de fichier
 */
export interface HfsFileMetadata {
  fileName: string;
  fileType: string;
  patientId: number;
  doctorId?: number;
  uploadedBy: number;
  uploadedAt: string;
  description?: string;
}

/**
 * Service HFS
 */
class HederaHfsService {
  private client: Client | null = null;
  private operatorId: string | null = null;
  private operatorKey: PrivateKey | null = null;
  private isInitialized = false;

  /**
   * Initialiser le client Hedera
   */
  async initialize(): Promise<void> {
    try {
      const operatorIdStr = process.env.HEDERA_OPERATOR_ID;
      const operatorKeyStr = process.env.HEDERA_OPERATOR_KEY;

      if (!operatorIdStr || !operatorKeyStr) {
        console.warn('⚠️  HFS non configuré: Variables HEDERA_OPERATOR_ID/KEY manquantes');
        return;
      }

      // Créer le client pour testnet
      this.client = Client.forTestnet();

      // Configurer l'opérateur
      this.operatorKey = PrivateKey.fromStringDer(operatorKeyStr);
      this.client.setOperator(operatorIdStr, this.operatorKey);

      this.operatorId = operatorIdStr;
      this.isInitialized = true;

      console.log('✅ Service HFS initialisé');
      console.log(`   Operator ID: ${this.operatorId}`);
    } catch (error) {
      console.error('❌ Erreur initialisation HFS:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Vérifier si le service est disponible
   */
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Calculer le hash SHA-256 d'un fichier
   */
  private calculateHash(content: Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Créer un fichier sur HFS
   * @param content Contenu du fichier (Buffer)
   * @param metadata Métadonnées du fichier
   * @returns Résultat avec fileId
   */
  async createFile(
    content: Buffer,
    metadata: HfsFileMetadata
  ): Promise<HfsFileResult> {
    try {
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'Service HFS non disponible',
        };
      }

      const startTime = Date.now();

      // Calculer le hash du fichier
      const hash = this.calculateHash(content);

      // Préparer le mémo avec métadonnées (max 100 caractères)
      const memo = `SantéKènè: ${metadata.fileName.substring(0, 50)}`;

      // HFS limite: 5KB par transaction
      const maxChunkSize = 5 * 1024; // 5KB
      const fileSize = content.length;

      let fileId: FileId;

      if (fileSize <= maxChunkSize) {
        // Fichier petit : une seule transaction
        const fileCreateTx = new FileCreateTransaction()
          .setContents(content)
          .setKeys([this.operatorKey!])
          .setFileMemo(memo)
          .setMaxTransactionFee(new Hbar(2));

        const fileCreateSubmit = await fileCreateTx.execute(this.client!);
        const fileCreateRx = await fileCreateSubmit.getReceipt(this.client!);
        fileId = fileCreateRx.fileId!;
      } else {
        // Fichier volumineux : créer puis append
        const firstChunk = content.slice(0, maxChunkSize);

        // Créer le fichier avec le premier morceau
        const fileCreateTx = new FileCreateTransaction()
          .setContents(firstChunk)
          .setKeys([this.operatorKey!])
          .setFileMemo(memo)
          .setMaxTransactionFee(new Hbar(2));

        const fileCreateSubmit = await fileCreateTx.execute(this.client!);
        const fileCreateRx = await fileCreateSubmit.getReceipt(this.client!);
        fileId = fileCreateRx.fileId!;

        // Append les morceaux restants
        let offset = maxChunkSize;
        while (offset < fileSize) {
          const chunk = content.slice(offset, offset + maxChunkSize);
          
          const fileAppendTx = new FileAppendTransaction()
            .setFileId(fileId)
            .setContents(chunk)
            .setMaxTransactionFee(new Hbar(2));

          await fileAppendTx.execute(this.client!);
          
          offset += maxChunkSize;
        }
      }

      const duration = Date.now() - startTime;

      console.log(`✅ Fichier HFS créé: ${fileId.toString()}`);
      console.log(`   Hash: ${hash}`);
      console.log(`   Taille: ${fileSize} bytes`);
      console.log(`   Durée: ${duration}ms`);

      return {
        success: true,
        fileId: fileId.toString(),
        transactionId: fileId.toString(),
        hash,
        size: fileSize,
        cost: 0.01, // Estimation
      };
    } catch (error: any) {
      console.error('❌ Erreur création fichier HFS:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue',
      };
    }
  }

  /**
   * Récupérer le contenu d'un fichier depuis HFS
   * @param fileId ID du fichier Hedera
   * @returns Contenu du fichier (Buffer)
   */
  async getFileContents(fileId: string): Promise<Buffer | null> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Service HFS non disponible');
      }

      const query = new FileContentsQuery()
        .setFileId(FileId.fromString(fileId));

      const contents = await query.execute(this.client!);

      console.log(`✅ Fichier HFS récupéré: ${fileId}`);
      console.log(`   Taille: ${contents.length} bytes`);

      return contents;
    } catch (error: any) {
      console.error(`❌ Erreur récupération fichier HFS ${fileId}:`, error);
      return null;
    }
  }

  /**
   * Vérifier l'intégrité d'un fichier
   * @param fileId ID du fichier Hedera
   * @param expectedHash Hash attendu
   * @returns True si le hash correspond
   */
  async verifyFileIntegrity(
    fileId: string,
    expectedHash: string
  ): Promise<boolean> {
    try {
      const contents = await this.getFileContents(fileId);

      if (!contents) {
        return false;
      }

      const actualHash = this.calculateHash(contents);

      const isValid = actualHash === expectedHash;

      if (isValid) {
        console.log(`✅ Intégrité fichier HFS vérifiée: ${fileId}`);
      } else {
        console.error(`❌ Intégrité fichier HFS compromise: ${fileId}`);
        console.error(`   Hash attendu: ${expectedHash}`);
        console.error(`   Hash actuel: ${actualHash}`);
      }

      return isValid;
    } catch (error) {
      console.error(`❌ Erreur vérification intégrité HFS ${fileId}:`, error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques du service HFS
   */
  getStats() {
    return {
      isAvailable: this.isAvailable(),
      operatorId: this.operatorId,
    };
  }
}

// Export singleton
export const hederaHfsService = new HederaHfsService();

// Auto-initialisation
hederaHfsService.initialize().catch((error) => {
  console.error('Erreur auto-initialisation HFS:', error);
});
