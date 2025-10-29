import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Types de jobs Hedera
 */
export enum HederaJobType {
  HCS_MESSAGE = 'hcs-message',
  HFS_UPLOAD = 'hfs-upload',
  HTS_MINT = 'hts-mint',
  HTS_TRANSFER = 'hts-transfer',
  BATCH_HCS = 'batch-hcs',
}

/**
 * Données du job HCS
 */
export interface HcsJobData {
  eventType: string;
  entityType: string;
  entityId: number;
  userId: number;
  dataHash: string;
  metadata?: Record<string, any>;
}

/**
 * Données du job HFS
 */
export interface HfsJobData {
  fileHash: string;
  fileContent: Buffer;
  patientId?: number;
  documentType?: string;
  metadata?: Record<string, any>;
}

/**
 * Données du job HTS (mint)
 */
export interface HtsMintJobData {
  userId: number;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Données du job HTS (transfer)
 */
export interface HtsTransferJobData {
  fromUserId: number;
  toUserId: number;
  amount: number;
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Service de queue pour les transactions Hedera
 * Permet d'exécuter les transactions de manière asynchrone et résiliente
 */
class HederaQueueService {
  private connection: Redis | null = null;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeConnection();
  }

  /**
   * Initialise la connexion Redis pour BullMQ
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
        maxRetriesPerRequest: null, // BullMQ requirement
      });

      this.connection.on('connect', () => {
        console.log('✅ Redis connecté pour Hedera Queue Service (BullMQ)');
        this.isInitialized = true;
      });

      this.connection.on('error', (error) => {
        console.error('❌ Redis error (Hedera Queue):', error.message);
        this.isInitialized = false;
      });

    } catch (error) {
      console.error('❌ Impossible de se connecter à Redis pour la queue Hedera:', error);
      this.connection = null;
    }
  }

  /**
   * Obtient ou crée une queue
   */
  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      if (!this.connection) {
        throw new Error('Redis connection is not available');
      }

      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000, // 2 secondes
          },
          removeOnComplete: 100, // Garder les 100 derniers jobs complétés
          removeOnFail: 500, // Garder les 500 derniers jobs échoués
        },
      });

      this.queues.set(name, queue);

      // Créer les QueueEvents pour monitoring
      const queueEvents = new QueueEvents(name, {
        connection: this.connection,
      });

      queueEvents.on('completed', ({ jobId }) => {
        console.log(`✅ Job ${jobId} complété dans la queue ${name}`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ Job ${jobId} échoué dans la queue ${name}: ${failedReason}`);
      });

      this.queueEvents.set(name, queueEvents);
    }

    return this.queues.get(name)!;
  }

  /**
   * Vérifie si la queue est disponible
   */
  isAvailable(): boolean {
    return this.connection !== null && this.isInitialized;
  }

  /**
   * Ajoute un job HCS à la queue
   */
  async addHcsJob(data: HcsJobData, priority?: number): Promise<Job<HcsJobData> | null> {
    if (!this.isAvailable()) {
      console.warn('⚠️  Queue Hedera non disponible. Job HCS non ajouté.');
      return null;
    }

    try {
      const queue = this.getQueue('hedera-hcs');
      const job = await queue.add(HederaJobType.HCS_MESSAGE, data, {
        priority: priority || 5,
      });

      console.log(`📤 Job HCS ajouté à la queue: ${job.id} (${data.eventType})`);
      return job;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du job HCS:', error);
      return null;
    }
  }

  /**
   * Ajoute un job HFS à la queue (avec options)
   */
  async addHfsJob(data: any, options?: { priority?: number; delay?: number }): Promise<Job<any> | null> {
    if (!this.isAvailable()) {
      console.warn('⚠️  Queue Hedera non disponible. Job HFS non ajouté.');
      return null;
    }

    try {
      const queue = this.getQueue('hfsQueue'); // Utiliser le nom correct de la queue
      const job = await queue.add(HederaJobType.HFS_UPLOAD, data, {
        priority: options?.priority || 3,
        delay: options?.delay || 0,
      });

      console.log(`📤 Job HFS ajouté à la queue: ${job.id}`);
      return job;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du job HFS:', error);
      return null;
    }
  }

  /**
   * Ajoute un job HTS (mint) à la queue
   */
  async addHtsMintJob(data: HtsMintJobData, priority?: number): Promise<Job<HtsMintJobData> | null> {
    if (!this.isAvailable()) {
      console.warn('⚠️  Queue Hedera non disponible. Job HTS mint non ajouté.');
      return null;
    }

    try {
      const queue = this.getQueue('hedera-hts');
      const job = await queue.add(HederaJobType.HTS_MINT, data, {
        priority: priority || 5,
      });

      console.log(`📤 Job HTS mint ajouté à la queue: ${job.id} (${data.amount} points pour user ${data.userId})`);
      return job;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du job HTS mint:', error);
      return null;
    }
  }

  /**
   * Ajoute un job HTS (transfer) à la queue
   */
  async addHtsTransferJob(data: HtsTransferJobData, priority?: number): Promise<Job<HtsTransferJobData> | null> {
    if (!this.isAvailable()) {
      console.warn('⚠️  Queue Hedera non disponible. Job HTS transfer non ajouté.');
      return null;
    }

    try {
      const queue = this.getQueue('hedera-hts');
      const job = await queue.add(HederaJobType.HTS_TRANSFER, data, {
        priority: priority || 5,
      });

      console.log(`📤 Job HTS transfer ajouté: ${job.id} (${data.amount} points: ${data.fromUserId} → ${data.toUserId})`);
      return job;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du job HTS transfer:', error);
      return null;
    }
  }

  /**
   * Ajoute plusieurs jobs HCS en batch
   */
  async addBatchHcsJobs(dataArray: HcsJobData[]): Promise<Job<HcsJobData>[]> {
    if (!this.isAvailable()) {
      console.warn('⚠️  Queue Hedera non disponible. Batch HCS non ajouté.');
      return [];
    }

    try {
      const queue = this.getQueue('hedera-hcs');
      const jobs = await queue.addBulk(
        dataArray.map((data, index) => ({
          name: HederaJobType.BATCH_HCS,
          data,
          opts: {
            priority: 3,
            jobId: `batch-hcs-${Date.now()}-${index}`,
          },
        }))
      );

      console.log(`📤 Batch de ${jobs.length} jobs HCS ajouté à la queue`);
      return jobs;
    } catch (error) {
      console.error('Erreur lors de l\'ajout du batch HCS:', error);
      return [];
    }
  }

  /**
   * Récupère l'état d'un job
   */
  async getJobStatus(queueName: string, jobId: string): Promise<string | null> {
    if (!this.isAvailable()) return null;

    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      
      if (!job) return null;

      return await job.getState();
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du job:', error);
      return null;
    }
  }

  /**
   * Obtient des statistiques sur une queue
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    if (!this.isAvailable()) return null;

    try {
      const queue = this.getQueue(queueName);
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return { waiting, active, completed, failed, delayed };
    } catch (error) {
      console.error('Erreur lors de la récupération des stats de la queue:', error);
      return null;
    }
  }

  /**
   * Obtient des statistiques globales sur toutes les queues Hedera
   */
  async getAllQueuesStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};
    const queueNames = ['hedera-hcs', 'hedera-hfs', 'hedera-hts'];

    for (const name of queueNames) {
      stats[name] = await this.getQueueStats(name);
    }

    return stats;
  }

  /**
   * Nettoie les anciens jobs d'une queue
   */
  async cleanQueue(queueName: string, grace: number = 86400000): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const queue = this.getQueue(queueName);
      await queue.clean(grace, 100, 'completed');
      await queue.clean(grace, 100, 'failed');
      console.log(`🧹 Queue ${queueName} nettoyée (jobs > ${grace}ms)`);
    } catch (error) {
      console.error(`Erreur lors du nettoyage de la queue ${queueName}:`, error);
    }
  }

  /**
   * Pause une queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const queue = this.getQueue(queueName);
      await queue.pause();
      console.log(`⏸️  Queue ${queueName} mise en pause`);
    } catch (error) {
      console.error(`Erreur lors de la mise en pause de la queue ${queueName}:`, error);
    }
  }

  /**
   * Reprend une queue en pause
   */
  async resumeQueue(queueName: string): Promise<void> {
    if (!this.isAvailable()) return;

    try {
      const queue = this.getQueue(queueName);
      await queue.resume();
      console.log(`▶️  Queue ${queueName} reprise`);
    } catch (error) {
      console.error(`Erreur lors de la reprise de la queue ${queueName}:`, error);
    }
  }

  /**
   * Ferme toutes les connexions
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Arrêt du Hedera Queue Service...');

    // Fermer les workers
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      console.log(`🔌 Worker ${name} fermé`);
    }

    // Fermer les queue events
    for (const [name, queueEvents] of this.queueEvents.entries()) {
      await queueEvents.close();
      console.log(`🔌 QueueEvents ${name} fermé`);
    }

    // Fermer les queues
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      console.log(`🔌 Queue ${name} fermée`);
    }

    // Fermer la connexion Redis
    if (this.connection) {
      await this.connection.quit();
      console.log('🔌 Redis déconnecté (Hedera Queue)');
    }

    this.isInitialized = false;
  }

  /**
   * Enregistre un worker pour traiter les jobs
   * (Sera appelé depuis hedera-worker.service.ts)
   */
  registerWorker(queueName: string, worker: Worker): void {
    this.workers.set(queueName, worker);
    console.log(`✅ Worker enregistré pour la queue: ${queueName}`);
  }
}

// Export singleton
export const hederaQueueService = new HederaQueueService();

