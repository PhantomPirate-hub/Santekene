import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';
import { hederaQueueService, HcsJobData, HederaJobType } from '../services/hedera-queue.service.js';
import { hederaHcsService } from '../services/hedera-hcs.service.js';
import { HcsMessageBuilder } from '../services/hcs-message-builder.service.js';
import { HcsEventType, HcsEntityType } from '../types/hedera-hcs.types.js';
import { prisma } from '../services/prisma.service.js';

dotenv.config();

/**
 * Worker pour traiter les jobs HCS de la queue
 * Traite les messages HCS de manière asynchrone avec retry automatique
 */
class HederaHcsWorker {
  private worker: Worker<HcsJobData> | null = null;
  private connection: Redis | null = null;
  private isRunning = false;

  constructor() {
    this.initializeConnection();
    this.startWorker();
  }

  /**
   * Initialise la connexion Redis
   */
  private initializeConnection(): void {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;

    try {
      this.connection = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: null,
      });

      this.connection.on('connect', () => {
        console.log('✅ Redis connecté pour Hedera HCS Worker');
      });

      this.connection.on('error', (error) => {
        console.error('❌ Redis error (HCS Worker):', error.message);
      });

    } catch (error) {
      console.error('❌ Impossible de connecter Redis pour HCS Worker:', error);
    }
  }

  /**
   * Démarre le worker
   */
  private startWorker(): void {
    if (!this.connection) {
      console.error('❌ Impossible de démarrer le worker HCS sans connexion Redis');
      return;
    }

    if (!hederaHcsService.isAvailable()) {
      console.warn('⚠️  Hedera HCS non configuré. Worker désactivé.');
      return;
    }

    try {
      this.worker = new Worker<HcsJobData>(
        'hedera-hcs',
        async (job: Job<HcsJobData>) => {
          return this.processHcsJob(job);
        },
        {
          connection: this.connection,
          concurrency: 5, // Traiter jusqu'à 5 jobs en parallèle
          limiter: {
            max: 10, // Max 10 jobs
            duration: 1000, // Par seconde
          },
        }
      );

      // Événements du worker
      this.worker.on('completed', (job, result) => {
        console.log(`✅ [HCS Worker] Job ${job.id} complété:`, result);
      });

      this.worker.on('failed', (job, error) => {
        console.error(`❌ [HCS Worker] Job ${job?.id} échoué:`, error.message);
      });

      this.worker.on('error', (error) => {
        console.error('❌ [HCS Worker] Erreur:', error.message);
      });

      // Enregistrer le worker auprès du service de queue
      hederaQueueService.registerWorker('hedera-hcs', this.worker);

      this.isRunning = true;
      console.log('✅ Hedera HCS Worker démarré (concurrency: 5)');

    } catch (error) {
      console.error('❌ Erreur lors du démarrage du worker HCS:', error);
    }
  }

  /**
   * Traite un job HCS
   */
  private async processHcsJob(job: Job<HcsJobData>): Promise<{ success: boolean; txId?: string; error?: string }> {
    const { eventType, entityType, entityId, userId, dataHash, metadata } = job.data;

    console.log(`🔄 [HCS Worker] Traitement job ${job.id}: ${eventType} (${entityType}:${entityId})`);

    try {
      // Construire le message HCS
      const message = new HcsMessageBuilder()
        .setEventType(eventType as HcsEventType)
        .setUser(userId, metadata?.userRole || 'PATIENT')
        .setEntity(entityType as HcsEntityType, entityId)
        .setDirectHash(dataHash)
        .setMetadata(metadata || {})
        .build();

      // Soumettre directement (sans queue pour éviter boucle infinie)
      const result = await hederaHcsService['submitDirectly'](message);

      if (result.success && result.transactionId) {
        // Mettre à jour la base de données avec le txId
        await this.updateEntityWithTxId(entityType, entityId, result.transactionId);

        // Enregistrer dans la table HederaTransaction
        await prisma.hederaTransaction.create({
          data: {
            txId: result.transactionId,
            type: 'HCS_MESSAGE',
            userId,
            entityId,
            topicId: process.env.HEDERA_HCS_TOPIC_ID!,
            status: 'SUCCESS',
            consensusTimestamp: result.consensusTimestamp || null,
            cost: 0.0001, // Coût estimé d'un message HCS
            metadata: JSON.stringify(metadata),
          },
        });

        console.log(`✅ [HCS Worker] Message soumis: ${result.transactionId}`);

        return {
          success: true,
          txId: result.transactionId,
        };
      } else {
        throw new Error(result.error || 'Échec soumission HCS');
      }

    } catch (error: any) {
      console.error(`❌ [HCS Worker] Erreur traitement job ${job.id}:`, error.message);

      // Enregistrer l'échec dans HederaTransaction
      try {
        await prisma.hederaTransaction.create({
          data: {
            txId: `FAILED-${Date.now()}`,
            type: 'HCS_MESSAGE',
            userId,
            entityId,
            status: 'FAILED',
            metadata: JSON.stringify({ error: error.message, ...metadata }),
          },
        });
      } catch (dbError) {
        console.error('Erreur lors de l\'enregistrement de l\'échec:', dbError);
      }

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Met à jour l'entité avec le transaction ID
   */
  private async updateEntityWithTxId(entityType: string, entityId: number, txId: string): Promise<void> {
    try {
      switch (entityType) {
        case HcsEntityType.CONSULTATION:
          await prisma.consultation.update({
            where: { id: entityId },
            data: { blockchainTxId: txId },
          });
          break;

        case HcsEntityType.PRESCRIPTION:
          await prisma.prescription.update({
            where: { id: entityId },
            data: { nftTokenId: txId }, // Ou créer un champ blockchainTxId
          });
          break;

        case HcsEntityType.APPOINTMENT:
          // Ajouter un champ blockchainTxId dans Appointment si nécessaire
          console.log(`📝 Appointment ${entityId} -> txId: ${txId} (non persisté)`);
          break;

        default:
          console.log(`📝 Entité ${entityType}:${entityId} -> txId: ${txId} (type non géré)`);
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'entité ${entityType}:${entityId}:`, error);
    }
  }

  /**
   * Vérifie si le worker est en cours d'exécution
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Arrête le worker
   */
  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      console.log('🛑 Hedera HCS Worker arrêté');
    }

    if (this.connection) {
      await this.connection.quit();
      console.log('🔌 Redis déconnecté (HCS Worker)');
    }

    this.isRunning = false;
  }

  /**
   * Obtient des statistiques sur le worker
   */
  async getStats(): Promise<any> {
    if (!this.worker) {
      return { active: false };
    }

    return {
      active: this.isRunning,
      concurrency: 5,
      queueName: 'hedera-hcs',
    };
  }
}

// Créer une instance singleton du worker
let hederaHcsWorkerInstance: HederaHcsWorker | null = null;

/**
 * Initialise le worker HCS (à appeler au démarrage du serveur)
 */
export function initializeHcsWorker(): HederaHcsWorker {
  if (!hederaHcsWorkerInstance) {
    hederaHcsWorkerInstance = new HederaHcsWorker();
  }
  return hederaHcsWorkerInstance;
}

/**
 * Obtient l'instance du worker
 */
export function getHcsWorker(): HederaHcsWorker | null {
  return hederaHcsWorkerInstance;
}

/**
 * Arrête le worker
 */
export async function stopHcsWorker(): Promise<void> {
  if (hederaHcsWorkerInstance) {
    await hederaHcsWorkerInstance.stop();
    hederaHcsWorkerInstance = null;
  }
}

