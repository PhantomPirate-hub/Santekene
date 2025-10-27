import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des liaisons Admin-Structure...\n');

  // Récupérer tous les admins avec leurs structures
  const admins = await prisma.admin.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
        },
      },
      facilityRequest: {
        select: {
          id: true,
          facilityName: true,
          facilityType: true,
          facilityCity: true,
          status: true,
        },
      },
    },
  });

  if (admins.length === 0) {
    console.log('❌ Aucun admin trouvé dans la base de données.\n');
    return;
  }

  console.log(`✅ ${admins.length} admin(s) trouvé(s):\n`);

  admins.forEach((admin, index) => {
    console.log(`--- Admin #${index + 1} ---`);
    console.log(`  User ID: ${admin.user.id}`);
    console.log(`  Nom: ${admin.user.name}`);
    console.log(`  Email: ${admin.user.email}`);
    console.log(`  Vérifié: ${admin.user.isVerified ? '✅ Oui' : '❌ Non'}`);
    
    if (admin.facilityRequest) {
      console.log(`  ✅ STRUCTURE LIÉE:`);
      console.log(`    - ID: ${admin.facilityRequest.id}`);
      console.log(`    - Nom: ${admin.facilityRequest.facilityName}`);
      console.log(`    - Type: ${admin.facilityRequest.facilityType}`);
      console.log(`    - Ville: ${admin.facilityRequest.facilityCity}`);
      console.log(`    - Statut: ${admin.facilityRequest.status}`);
    } else {
      console.log(`  ❌ AUCUNE STRUCTURE LIÉE (facilityRequestId: ${admin.facilityRequestId})`);
    }
    console.log('');
  });

  // Vérifier aussi les structures sans admin lié
  const orphanFacilities = await prisma.healthFacilityRequest.findMany({
    where: {
      admin: null,
    },
    select: {
      id: true,
      facilityName: true,
      status: true,
      createdAt: true,
    },
  });

  if (orphanFacilities.length > 0) {
    console.log(`⚠️ ${orphanFacilities.length} structure(s) sans admin lié:\n`);
    orphanFacilities.forEach((facility) => {
      console.log(`  - ${facility.facilityName} (ID: ${facility.id}, Statut: ${facility.status})`);
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

