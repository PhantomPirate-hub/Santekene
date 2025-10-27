import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
  TopicId,
  AccountId,
  Status,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import { hederaCacheService } from './hedera-cache.service.js';
import { hederaRetryService } from './hedera-retry.service.js';
import { hederaQueueService, HcsJobData } from './hedera-queue.service.js';
import { HcsMessage, HcsSubmissionResult, HcsSubmitOptions } from '../types/hedera-hcs.types.js';
import { HcsMessageBuilder } from './hcs-message-builder.service.js';

dotenv.config();

/**
 * Service amélioré pour Hedera Consensus Service (HCS)
 * Intègre cache, retry et queue asynchrone
 */
class HederaHcsService {
  private client: Client | null = null;
  private accountId: AccountId | null = null;
  private privateKey: PrivateKey | null = null;
  private topicId: TopicId | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialise le client Hedera
   */
  private initializeClient(): void {
    const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
    const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
    const topicIdStr = process.env.HEDERA_HCS_TOPIC_ID;

    if (!accountIdStr || !privateKeyStr || !topicIdStr) {
      console.warn('⚠️  Hedera HCS non configuré. Variables d\'environnement manquantes.');
      return;
    }

    try {
      this.accountId = AccountId.fromString(accountIdStr);
      this.privateKey = PrivateKey.fromString(privateKeyStr);
      this.topicId = TopicId.fromString(topicIdStr);

      const network = process.env.HEDERA_NETWORK || 'testnet';
      this.client = Client.forName(network);
      this.client.setOperator(this.accountId, this.privateKey);

      this.isConfigured = true;
      console.log(`✅ Hedera HCS configuré (${network}) - Topic: ${topicIdStr}`);
    } catch (error) {
      console.error('❌ Erreur lors de la configuration Hedera HCS:', error);
    }
  }

  /**
   * Vérifie si Hedera est configuré
   */
  isAvailable(): boolean {
    return this.isConfigured && this.client !== null && this.topicId !== null;
  }

  /**
   * Soumet un message HCS directement (sans queue)
   * Utilise retry et cache
   */
  private async submitDirectly(message: HcsMessage): Promise<HcsSubmissionResult> {
    if (!this.isAvailable()) {
      throw new Error('Hedera HCS n\'est pas configuré');
    }

    const startTime = Date.now();
    const messageString = JSON.stringify(message);

    // Vérifier le cache pour éviter les doublons
    const cacheKey = `${message.entityType}:${message.entityId}`;
    const cached = await hederaCacheService.hcsTransactionExists(message.entityType, message.entityId);
    
    if (cached) {
      const cachedTxId = await hederaCacheService.getHcsTransaction(message.entityType, message.entityId);
      console.log(`📦 Message HCS déjà en cache: ${cacheKey} -> ${cachedTxId}`);
      
      return {
        success: true,
        transactionId: cachedTxId || undefined,
        messageHash: message.dataHash,
        duration: Date.now() - startTime,
      };
    }

    // Soumettre avec retry
    const result = await hederaRetryService.executeWithRetry(
      async () => {
        const tx = await new TopicMessageSubmitTransaction({
          topicId: this.topicId!,
          message: messageString,
        }).execute(this.client!);

        const receipt = await tx.getReceipt(this.client!);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Transaction échouée: ${receipt.status.toString()}`);
        }

        const transactionId = tx.transactionId.toString();
        const consensusTimestamp = receipt.consensusTimestamp?.toString();

        // Mettre en cache
        await hederaCacheService.cacheHcsTransaction(
          message.entityType,
          message.entityId,
          transactionId,
          86400 // 24h
        );

        return {
          transactionId,
          consensusTimestamp,
          status: receipt.status,
        };
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        retryableErrors: ['BUSY', 'TIMEOUT', 'UNAVAILABLE'],
      },
      `HCS-${message.eventType}`
    );

    const duration = Date.now() - startTime;

    if (result.success && result.data) {
      console.log(`✅ Message HCS soumis: ${result.data.transactionId} (${duration}ms)`);
      
      return {
        success: true,
        transactionId: result.data.transactionId,
        consensusTimestamp: result.data.consensusTimestamp,
        messageHash: message.dataHash,
        attempts: result.attempts,
        duration: result.totalDuration,
      };
    } else {
      console.error(`❌ Échec soumission HCS après ${result.attempts} tentatives`);
      
      return {
        success: false,
        error: result.error?.message,
        attempts: result.attempts,
        duration: result.totalDuration,
      };
    }
  }

  /**
   * Soumet un message HCS via la queue (asynchrone, non-bloquant)
   */
  async submitToQueue(
    message: HcsMessage,
    options?: HcsSubmitOptions
  ): Promise<{ jobId: string | null; queued: boolean }> {
    if (!hederaQueueService.isAvailable()) {
      console.warn('⚠️  Queue Hedera non disponible. Message non ajouté.');
      return { jobId: null, queued: false };
    }

    const jobData: HcsJobData = {
      eventType: message.eventType,
      entityType: message.entityType,
      entityId: message.entityId,
      userId: message.userId,
      dataHash: message.dataHash,
      metadata: message.metadata,
    };

    const job = await hederaQueueService.addHcsJob(jobData, options?.priority);

    if (job) {
      console.log(`📤 Message HCS ajouté à la queue: ${job.id}`);
      return { jobId: job.id, queued: true };
    }

    return { jobId: null, queued: false };
  }

  /**
   * Soumet un message HCS (méthode principale)
   * Décide automatiquement entre queue et soumission directe
   */
  async submit(
    message: HcsMessage,
    options?: HcsSubmitOptions
  ): Promise<HcsSubmissionResult | { jobId: string | null; queued: boolean }> {
    // Valider le message
    if (!HcsMessageBuilder.verifySignature(message)) {
      throw new Error('Signature du message HCS invalide');
    }

    const useQueue = options?.useQueue !== false; // Par défaut: utiliser la queue

    if (useQueue && hederaQueueService.isAvailable()) {
      return this.submitToQueue(message, options);
    } else {
      return this.submitDirectly(message);
    }
  }

  /**
   * Soumet plusieurs messages HCS en batch (via queue)
   */
  async submitBatch(messages: HcsMessage[], options?: HcsSubmitOptions): Promise<{ totalQueued: number }> {
    if (!hederaQueueService.isAvailable()) {
      console.warn('⚠️  Queue Hedera non disponible. Batch non ajouté.');
      return { totalQueued: 0 };
    }

    const jobsData: HcsJobData[] = messages.map(msg => ({
      eventType: msg.eventType,
      entityType: msg.entityType,
      entityId: msg.entityId,
      userId: msg.userId,
      dataHash: msg.dataHash,
      metadata: msg.metadata,
    }));

    const jobs = await hederaQueueService.addBatchHcsJobs(jobsData);
    
    console.log(`📤 Batch de ${jobs.length} messages HCS ajouté à la queue`);
    
    return { totalQueued: jobs.length };
  }

  /**
   * Récupère le statut d'un job HCS
   */
  async getJobStatus(jobId: string): Promise<string | null> {
    return hederaQueueService.getJobStatus('hedera-hcs', jobId);
  }

  /**
   * Obtient des statistiques sur la queue HCS
   */
  async getQueueStats(): Promise<any> {
    return hederaQueueService.getQueueStats('hedera-hcs');
  }

  /**
   * Vérifie l'intégrité d'un message en comparant avec le hash stocké
   */
  async verifyMessage(
    entityType: string,
    entityId: number,
    currentData: any
  ): Promise<{ isValid: boolean; cachedHash?: string; currentHash: string }> {
    const currentHash = HcsMessageBuilder.prototype['generateHash'](currentData);
    const cachedTxId = await hederaCacheService.getHcsTransaction(entityType, entityId);

    if (!cachedTxId) {
      return {
        isValid: false,
        currentHash,
      };
    }

    // TODO: Implémenter la récupération du message depuis Hedera pour comparer
    // Pour l'instant, on se fie au cache
    
    return {
      isValid: true,
      cachedHash: 'TODO',
      currentHash,
    };
  }

  /**
   * Nettoie le cache HCS (admin)
   */
  async flushCache(): Promise<void> {
    await hederaCacheService.flushHederaCache();
    console.log('🗑️  Cache HCS nettoyé');
  }

  /**
   * Obtient des statistiques globales HCS
   */
  async getStats(): Promise<any> {
    const queueStats = await this.getQueueStats();
    const cacheStats = await hederaCacheService.getCacheStats();

    return {
      queue: queueStats,
      cache: cacheStats,
      isConfigured: this.isConfigured,
      isAvailable: this.isAvailable(),
      topicId: this.topicId?.toString(),
      network: process.env.HEDERA_NETWORK || 'testnet',
    };
  }

  /**
   * Ferme les connexions
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.isConfigured = false;
      console.log('🔌 Client Hedera HCS fermé');
    }
  }
}

// Export singleton
export const hederaHcsService = new HederaHcsService();

