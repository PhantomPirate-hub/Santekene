import { Worker, Job } from 'bullmq';
import { hederaHfsService, FileCertificate } from '../services/hedera-hfs.service.js';
import { prisma } from '../services/prisma.service.js';
import { hederaCacheService } from '../services/hedera-cache.service.js';

/**
 * Interface pour les jobs HFS
 */
interface HfsCertificateJob {
  certificate: FileCertificate;
  documentId: number;
  userId: number;
}

/**
 * Worker pour traiter les certificats HFS de manière asynchrone
 */
export function initializeHfsWorker(): Worker<HfsCertificateJob> {
  const worker = new Worker<HfsCertificateJob>(
    'hfsQueue',
    async (job: Job<HfsCertificateJob>) => {
      const { certificate, documentId, userId } = job.data;

      console.log(`🔨 [HFS Worker] Traitement certificat pour document ${documentId}...`);

      try {
        // Soumettre le certificat à Hedera HFS
        const result = await hederaHfsService.storeCertificate(certificate, false);

        // Mettre à jour le document avec le fileId Hedera
        await prisma.document.update({
          where: { id: documentId },
          data: {
            fileUrl: result.fileId, // Stocker le FileId Hedera
          },
        });

        // Enregistrer la transaction dans la DB
        await hederaHfsService.logTransaction(
          result.txId,
          result.fileId,
          userId,
          documentId,
          result.cost,
          'HFS_UPLOAD',
          {
            fileName: certificate.fileName,
            fileSize: certificate.fileSize,
            mimeType: certificate.mimeType,
            fileHash: certificate.fileHash,
          }
        );

        // Mettre en cache le certificat
        await hederaCacheService.cacheHfsFile(certificate.fileHash, result.fileId);

        console.log(
          `✅ [HFS Worker] Certificat document ${documentId} stocké: ${result.fileId}`
        );

        return {
          success: true,
          fileId: result.fileId,
          txId: result.txId,
          cost: result.cost,
        };
      } catch (error: any) {
        console.error(`❌ [HFS Worker] Erreur document ${documentId}:`, error);

        // Enregistrer l'échec dans la DB
        await prisma.hederaTransaction.create({
          data: {
            txId: `failed-${Date.now()}`,
            type: 'HFS_UPLOAD',
            userId,
            entityId: documentId,
            status: 'FAILED',
            cost: 0,
            metadata: JSON.stringify({
              error: error.message,
              certificate: certificate.fileName,
            }),
          },
        });

        throw error; // BullMQ va automatiquement réessayer
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      concurrency: 3, // Traiter 3 certificats en parallèle max
      limiter: {
        max: 10, // Max 10 jobs par...
        duration: 60000, // ...60 secondes (pour éviter rate limiting Hedera)
      },
    }
  );

  // Événements du worker
  worker.on('completed', (job) => {
    console.log(`✅ [HFS Worker] Job ${job.id} complété`);
  });

  worker.on('failed', (job, error) => {
    console.error(`❌ [HFS Worker] Job ${job?.id} échoué:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('❌ [HFS Worker] Erreur globale:', error);
  });

  console.log('✅ Hedera HFS Worker démarré');

  return worker;
}

/**
 * Arrêt propre du worker HFS
 */
export async function stopHfsWorker(worker?: Worker): Promise<void> {
  if (worker) {
    console.log('🛑 Arrêt du HFS Worker...');
    await worker.close();
    console.log('✅ HFS Worker arrêté');
  }
}

