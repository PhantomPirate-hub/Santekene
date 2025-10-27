import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📄 Création d\'une demande de structure avec document de test...\n');

  // Créer un petit document image en base64 (1x1 pixel PNG transparent)
  const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const documentDataUrl = `data:image/png;base64,${tinyPngBase64}`;

  console.log('📝 Document de test créé (1x1 pixel PNG)');
  console.log(`   Taille: ${documentDataUrl.length} caractères\n`);

  // Vérifier si une demande de test existe déjà
  const existing = await prisma.healthFacilityRequest.findUnique({
    where: { facilityEmail: 'test.document@structure.ml' },
  });

  if (existing) {
    console.log('⚠️  Une demande de test existe déjà. Suppression...');
    await prisma.healthFacilityRequest.delete({
      where: { id: existing.id },
    });
  }

  // Créer la demande avec le document
  const facilityRequest = await prisma.healthFacilityRequest.create({
    data: {
      facilityName: 'Centre de Test - Avec Document',
      facilityType: 'Centre de santé',
      facilityAddress: 'Rue de Test',
      facilityCity: 'Bamako',
      facilityPhone: '+223 20 00 00 00',
      facilityEmail: 'test.document@structure.ml',
      responsibleName: 'Dr. Test Document',
      responsiblePosition: 'Directeur de Test',
      responsiblePhone: '+223 70 00 00 00',
      responsibleEmail: 'test.document@structure.ml',
      documentUrl: documentDataUrl,
      documentType: 'Agrément de Test (PNG)',
      status: 'PENDING',
    },
  });

  console.log('✅ Demande de structure créée avec succès !');
  console.log(`   ID: ${facilityRequest.id}`);
  console.log(`   Nom: ${facilityRequest.facilityName}`);
  console.log(`   Document: ${facilityRequest.documentType}`);
  console.log(`   Taille du document: ${facilityRequest.documentUrl?.length || 0} caractères`);
  console.log(`\n✅ Accédez à http://localhost:3000/dashboard/superadmin/facilities pour tester !`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

