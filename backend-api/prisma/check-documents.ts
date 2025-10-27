import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des documents dans les demandes de structures...\n');

  const requests = await prisma.healthFacilityRequest.findMany({
    select: {
      id: true,
      facilityName: true,
      status: true,
      documentUrl: true,
      documentType: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`✅ ${requests.length} demande(s) trouvée(s)\n`);

  requests.forEach((req, index) => {
    console.log(`--- Demande #${index + 1} ---`);
    console.log(`  ID: ${req.id}`);
    console.log(`  Structure: ${req.facilityName}`);
    console.log(`  Statut: ${req.status}`);
    console.log(`  Document Type: ${req.documentType || 'Non spécifié'}`);
    
    if (req.documentUrl) {
      const urlLength = req.documentUrl.length;
      const urlStart = req.documentUrl.substring(0, 100);
      const isDataUrl = req.documentUrl.startsWith('data:');
      
      console.log(`  ✅ DOCUMENT PRÉSENT`);
      console.log(`     - Taille: ${urlLength} caractères`);
      console.log(`     - Format: ${isDataUrl ? 'Data URL' : 'Base64 pur'}`);
      console.log(`     - Début: ${urlStart}...`);
      
      if (isDataUrl) {
        const mimeMatch = req.documentUrl.match(/^data:([^;]+);/);
        if (mimeMatch) {
          console.log(`     - MIME Type: ${mimeMatch[1]}`);
        }
      }
    } else {
      console.log(`  ❌ AUCUN DOCUMENT`);
    }
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

