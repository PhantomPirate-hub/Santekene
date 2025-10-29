import {
  Client,
  FileCreateTransaction,
  FileAppendTransaction,
  FileContentsQuery,
  Hbar,
  Status,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
import { hederaCacheService } from './hedera-cache.service.js';
import { hederaRetryService } from './hedera-retry.service.js';
import { prisma } from './prisma.service.js';

dotenv.config();

/**
 * Interface pour un certificat de fichier
 * Ce certificat est stocké sur Hedera HFS et contient les métadonnées + hash du fichier
 */
export interface FileCertificate {
  version: string; // Version du certificat (e.g., "1.0")
  timestamp: string; // ISO 8601
  fileHash: string; // SHA-256 du fichier
  fileName: string; // Nom original du fichier
  fileSize: number; // Taille en octets
  mimeType: string; // Type MIME
  uploadedBy: {
    userId: number;
    role: string; // PATIENT, MEDECIN, ADMIN, SUPERADMIN
  };
  relatedEntity?: {
    type: string; // CONSULTATION, PRESCRIPTION, DSE
    id: number;
  };
  storageUrl: string; // URL MinIO/S3/Local
  signature: string; // HMAC du certificat
}

/**
 * Service Hedera File Service (HFS)
 * Gère les certificats de fichiers sur la blockchain
 */
class HederaHfsService {
  private client: Client | null = null;
  private isConfigured = false;
  private hmacSecret: string;

  constructor() {
    this.hmacSecret = process.env.HEDERA_HMAC_SECRET || 'default-hmac-secret';
    this.initializeClient();
  }

  /**
   * Initialise le client Hedera
   */
  private initializeClient(): void {
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    const network = process.env.HEDERA_NETWORK || 'testnet';

    if (!operatorId || !operatorKey) {
      console.warn('⚠️  Hedera HFS non configuré (credentials manquants)');
      return;
    }

    try {
      if (network === 'testnet') {
        this.client = Client.forTestnet();
      } else if (network === 'mainnet') {
        this.client = Client.forMainnet();
      } else {
        throw new Error(`Réseau Hedera invalide: ${network}`);
      }

      this.client.setOperator(operatorId, operatorKey);
      this.isConfigured = true;

      console.log(`✅ Hedera HFS initialisé - Réseau: ${network}, Operator: ${operatorId}`);
    } catch (error) {
      console.error('❌ Erreur initialisation Hedera HFS:', error);
    }
  }

  /**
   * Vérifie si HFS est disponible
   */
  isAvailable(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Calcule le hash SHA-256 d'un buffer
   */
  private calculateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Génère la signature HMAC d'un certificat
   */
  private signCertificate(certificate: Omit<FileCertificate, 'signature'>): string {
    const data = JSON.stringify(certificate);
    return crypto.createHmac('sha256', this.hmacSecret).update(data).digest('hex');
  }

  /**
   * Crée un certificat de fichier
   */
  createCertificate(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    storageUrl: string,
    userId: number,
    userRole: string,
    relatedEntity?: { type: string; id: number }
  ): FileCertificate {
    const fileHash = this.calculateFileHash(fileBuffer);

    const certificateData: Omit<FileCertificate, 'signature'> = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      fileHash,
      fileName,
      fileSize: fileBuffer.length,
      mimeType,
      uploadedBy: {
        userId,
        role: userRole,
      },
      relatedEntity,
      storageUrl,
    };

    const signature = this.signCertificate(certificateData);

    return {
      ...certificateData,
      signature,
    };
  }

  /**
   * Stocke un certificat sur Hedera HFS
   * @returns FileId du certificat
   */
  async storeCertificate(
    certificate: FileCertificate,
    useQueue: boolean = true
  ): Promise<{ fileId: string; txId: string; cost: number }> {
    if (!this.isAvailable()) {
      throw new Error('Hedera HFS non disponible');
    }

    // Vérifier si déjà en cache
    const cacheKey = `hfs:cert:${certificate.fileHash}`;
    const cached = await hederaCacheService.get(cacheKey);

    if (cached) {
      console.log(`✅ Certificat déjà stocké (cache): ${cached.fileId}`);
      return JSON.parse(cached);
    }

    try {
      const certificateJson = JSON.stringify(certificate, null, 2);
      const certificateBuffer = Buffer.from(certificateJson, 'utf-8');

      // Soumettre la transaction avec retry
      const retryResult = await hederaRetryService.executeWithRetry(async () => {
        // Pour les fichiers > 4KB, utiliser FileAppendTransaction
        if (certificateBuffer.length > 4096) {
          return this.storeChunkedCertificate(certificateBuffer);
        } else {
          return this.storeSingleCertificate(certificateBuffer);
        }
      }, undefined, 'HFS Certificate Storage');

      if (!retryResult.success || !retryResult.data) {
        throw retryResult.error || new Error('Échec du stockage du certificat');
      }

      const result = retryResult.data;

      // Mettre en cache
      await hederaCacheService.set(cacheKey, JSON.stringify(result), 86400); // 24h

      console.log(
        `✅ Certificat stocké sur HFS - FileId: ${result.fileId}, Coût: ${result.cost} HBAR`
      );

      return result;
    } catch (error) {
      console.error('❌ Erreur stockage certificat HFS:', error);
      throw new Error('Impossible de stocker le certificat sur Hedera HFS');
    }
  }

  /**
   * Stocke un petit certificat (<4KB)
   */
  private async storeSingleCertificate(
    certificateBuffer: Buffer
  ): Promise<{ fileId: string; txId: string; cost: number }> {
    if (!this.client) {
      throw new Error('Client Hedera non initialisé');
    }

    const transaction = new FileCreateTransaction()
      .setKeys([this.client.operatorPublicKey!])
      .setContents(certificateBuffer)
      .setMaxTransactionFee(new Hbar(2));

    const txResponse = await transaction.execute(this.client);
    const receipt = await txResponse.getReceipt(this.client);

    if (receipt.status !== Status.Success) {
      throw new Error(`Échec création fichier HFS: ${receipt.status}`);
    }

    const fileId = receipt.fileId!.toString();
    const txId = txResponse.transactionId.toString();
    // Note: transactionFee n'est plus disponible dans SDK récent
    const cost = 0; // Coût estimé, nécessite un TransactionRecordQuery pour obtenir le coût réel

    return { fileId, txId, cost };
  }

  /**
   * Stocke un certificat volumineux (>4KB) en chunks
   */
  private async storeChunkedCertificate(
    certificateBuffer: Buffer
  ): Promise<{ fileId: string; txId: string; cost: number }> {
    if (!this.client) {
      throw new Error('Client Hedera non initialisé');
    }

    const chunkSize = 4096;
    const firstChunk = certificateBuffer.slice(0, chunkSize);

    // Créer le fichier avec le premier chunk
    const createTransaction = new FileCreateTransaction()
      .setKeys([this.client.operatorPublicKey!])
      .setContents(firstChunk)
      .setMaxTransactionFee(new Hbar(2));

    const createResponse = await createTransaction.execute(this.client);
    const createReceipt = await createResponse.getReceipt(this.client);

    if (createReceipt.status !== Status.Success) {
      throw new Error(`Échec création fichier HFS: ${createReceipt.status}`);
    }

    const fileId = createReceipt.fileId!;
    // Note: transactionFee n'est plus disponible dans SDK récent
    let totalCost = 0; // Coût estimé

    // Ajouter les chunks restants
    let offset = chunkSize;
    while (offset < certificateBuffer.length) {
      const chunk = certificateBuffer.slice(offset, offset + chunkSize);

      const appendTransaction = new FileAppendTransaction()
        .setFileId(fileId)
        .setContents(chunk)
        .setMaxTransactionFee(new Hbar(2));

      const appendResponse = await appendTransaction.execute(this.client);
      const appendReceipt = await appendResponse.getReceipt(this.client);

      if (appendReceipt.status !== Status.Success) {
        throw new Error(`Échec ajout chunk HFS: ${appendReceipt.status}`);
      }

      // totalCost += ... (transaction fee non disponible dans SDK récent)
      offset += chunkSize;
    }

    return {
      fileId: fileId.toString(),
      txId: createResponse.transactionId.toString(),
      cost: totalCost,
    };
  }

  /**
   * Récupère un certificat depuis Hedera HFS
   */
  async retrieveCertificate(fileId: string): Promise<FileCertificate> {
    if (!this.isAvailable()) {
      throw new Error('Hedera HFS non disponible');
    }

    // Vérifier le cache
    const cacheKey = `hfs:retrieve:${fileId}`;
    const cached = await hederaCacheService.get(cacheKey);

    if (cached) {
      console.log(`✅ Certificat récupéré depuis le cache: ${fileId}`);
      return JSON.parse(cached);
    }

    try {
      const query = new FileContentsQuery().setFileId(fileId);

      const retryResult = await hederaRetryService.executeWithRetry(async () => {
        return await query.execute(this.client!);
      }, undefined, 'HFS Certificate Retrieval');

      if (!retryResult.success || !retryResult.data) {
        throw retryResult.error || new Error('Échec de la récupération du certificat');
      }

      const contents = retryResult.data;
      const certificateJson = contents.toString('utf-8');
      const certificate: FileCertificate = JSON.parse(certificateJson);

      // Mettre en cache
      await hederaCacheService.set(cacheKey, certificateJson, 3600); // 1h

      console.log(`✅ Certificat récupéré depuis HFS: ${fileId}`);

      return certificate;
    } catch (error) {
      console.error('❌ Erreur récupération certificat HFS:', error);
      throw new Error('Impossible de récupérer le certificat depuis Hedera HFS');
    }
  }

  /**
   * Vérifie l'intégrité d'un fichier avec son certificat
   */
  async verifyFileIntegrity(
    fileBuffer: Buffer,
    certificateFileId: string
  ): Promise<{
    isValid: boolean;
    currentHash: string;
    certificateHash: string;
    certificate: FileCertificate;
  }> {
    try {
      const certificate = await this.retrieveCertificate(certificateFileId);
      const currentHash = this.calculateFileHash(fileBuffer);
      const isValid = currentHash === certificate.fileHash;

      return {
        isValid,
        currentHash,
        certificateHash: certificate.fileHash,
        certificate,
      };
    } catch (error) {
      console.error('❌ Erreur vérification intégrité:', error);
      throw new Error('Impossible de vérifier l\'intégrité du fichier');
    }
  }

  /**
   * Enregistre une transaction HFS dans la DB
   */
  async logTransaction(
    txId: string,
    fileId: string,
    userId: number | null,
    entityId: number | null,
    cost: number,
    type: 'HFS_UPLOAD' | 'HFS_DOWNLOAD' = 'HFS_UPLOAD',
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.hederaTransaction.create({
        data: {
          txId,
          type,
          userId,
          entityId,
          fileId,
          status: 'SUCCESS',
          cost,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      console.log(`✅ Transaction HFS enregistrée: ${txId}`);
    } catch (error) {
      console.error('Erreur enregistrement transaction HFS:', error);
    }
  }

  /**
   * Obtient les statistiques HFS
   */
  async getStats(): Promise<{
    totalCertificates: number;
    totalCost: number;
    averageCost: number;
  }> {
    try {
      const transactions = await prisma.hederaTransaction.findMany({
        where: {
          type: 'HFS_UPLOAD',
          status: 'SUCCESS',
        },
      });

      const totalCertificates = transactions.length;
      const totalCost = transactions.reduce((sum, tx) => sum + (tx.cost || 0), 0);
      const averageCost = totalCertificates > 0 ? totalCost / totalCertificates : 0;

      return {
        totalCertificates,
        totalCost,
        averageCost,
      };
    } catch (error) {
      console.error('Erreur récupération stats HFS:', error);
      return { totalCertificates: 0, totalCost: 0, averageCost: 0 };
    }
  }
}

// Export singleton
export const hederaHfsService = new HederaHfsService();

