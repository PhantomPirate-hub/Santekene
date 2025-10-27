/**
 * Script de migration des documents existants vers MinIO + Hedera HFS
 *
 * Ce script:
 * 1. Récupère tous les documents de la DB sans fileUrl
 * 2. Pour chaque document:
 *    - Si l'URL est un ancien format HFS (0.0.xxxxx): skip (déjà sur blockchain)
 *    - Si l'URL est local_xxxxx: créer Buffer fictif et uploader
 *    - Créer un certificat HFS
 *    - Soumettre le certificat à la queue
 *    - Mettre à jour le document avec fileUrl
 *
 * Usage:
 * cd backend-api
 * npx ts-node src/scripts/migrate-documents-to-minio.ts
 */

import { PrismaClient } from '@prisma/client';
import { fileStorageService } from '../services/file-storage.service.js';
import { hederaHfsService } from '../services/hedera-hfs.service.js';
import { hederaQueueService } from '../services/hedera-queue.service.js';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function migrateDocuments() {
  console.log('🚀 Début de la migration des documents vers MinIO + Hedera HFS\n');

  try {
    // Récupérer tous les documents sans fileUrl
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { fileUrl: null },
          { fileUrl: '' },
        ],
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log(`📄 ${documents.length} documents à migrer\n`);

    if (documents.length === 0) {
      console.log('✅ Aucun document à migrer');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const document of documents) {
      console.log(`\n--- Document ${document.id} ---`);
      console.log(`📝 Nom: ${document.name || document.title || 'Sans nom'}`);
      console.log(`🔗 URL actuelle: ${document.url}`);

      try {
        // Skip si déjà sur Hedera HFS (ancien format)
        if (document.url.startsWith('0.0.')) {
          console.log('⏭️  Déjà sur Hedera HFS, skip');
          skipCount++;
          continue;
        }

        // AVERTISSEMENT: Ce script ne peut pas récupérer les fichiers locaux
        // Il faudra les migrer manuellement ou adapter le script
        if (document.url.startsWith('local_')) {
          console.warn('⚠️  Fichier local détecté. Migration manuelle requise.');
          console.warn('   Pour migrer ce fichier:');
          console.warn(`   1. Localiser le fichier: ${document.url}`);
          console.warn('   2. L\'uploader manuellement via l\'interface');
          console.warn('   3. Ou modifier ce script pour lire depuis le disque\n');
          skipCount++;
          continue;
        }

        // Générer un fichier factice pour la migration (à adapter selon votre cas)
        console.warn('⚠️  Impossible de récupérer le fichier original.');
        console.warn('   Options:');
        console.warn('   1. Télécharger les fichiers depuis l\'ancien stockage');
        console.warn('   2. Demander aux utilisateurs de ré-uploader');
        console.warn('   3. Marquer ces documents comme "à migrer"\n');

        // Marquer le document comme nécessitant une migration manuelle
        await prisma.document.update({
          where: { id: document.id },
          data: {
            description: `[MIGRATION REQUISE] ${document.description || ''}`,
          },
        });

        skipCount++;
      } catch (error: any) {
        console.error(`❌ Erreur migration document ${document.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n\n📊 RÉSULTATS DE LA MIGRATION:');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`⏭️  Skippés: ${skipCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📄 Total: ${documents.length}`);

    if (skipCount > 0) {
      console.log('\n⚠️  ATTENTION:');
      console.log(`   ${skipCount} documents nécessitent une migration manuelle.`);
      console.log('   Ces documents sont maintenant marqués avec "[MIGRATION REQUISE]".');
      console.log('   Vous pouvez:');
      console.log('   1. Les télécharger depuis l\'ancien stockage');
      console.log('   2. Les ré-uploader via l\'interface');
      console.log('   3. Contacter les utilisateurs pour qu\'ils les ré-uploadent');
    }
  } catch (error) {
    console.error('❌ Erreur globale de migration:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Déconnexion de la base de données');
  }
}

// Exemple de migration avancée (si fichiers accessibles)
async function migrateDocumentWithFile(
  document: any,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
) {
  console.log(`📤 Upload du fichier sur MinIO...`);

  // 1. Upload sur MinIO
  const fileUpload = await fileStorageService.uploadFile(
    fileBuffer,
    fileName,
    mimeType,
    {
      documentId: document.id.toString(),
      patientId: document.patientId.toString(),
      type: document.type,
    }
  );

  console.log(`✅ Fichier uploadé: ${fileUpload.url}`);

  // 2. Créer le certificat HFS
  const certificate = hederaHfsService.createCertificate(
    fileBuffer,
    fileName,
    mimeType,
    fileUpload.url,
    document.uploadedBy || 1, // Default admin
    'ADMIN',
    {
      type: 'DOCUMENT',
      id: document.id,
    }
  );

  console.log(`📜 Certificat créé`);

  // 3. Soumettre à la queue HFS
  await hederaQueueService.addHfsJob(
    {
      certificate,
      documentId: document.id,
      userId: document.uploadedBy || 1,
    },
    {
      priority: 3,
      delay: 2000, // 2 secondes entre chaque
    }
  );

  console.log(`✅ Certificat soumis à la queue HFS`);

  // 4. Mettre à jour le document
  await prisma.document.update({
    where: { id: document.id },
    data: {
      fileUrl: fileUpload.url,
      url: fileUpload.url, // Sera mis à jour par le worker avec le FileId Hedera
      hash: certificate.fileHash,
      size: fileBuffer.length,
      mimeType,
      name: fileName,
    },
  });

  console.log(`✅ Document ${document.id} migré avec succès`);

  return true;
}

// Lancer la migration
migrateDocuments()
  .then(() => {
    console.log('\n✅ Migration terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration échouée:', error);
    process.exit(1);
  });

