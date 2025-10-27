import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des utilisateurs ADMIN...\n');

  // Récupérer tous les utilisateurs avec le rôle ADMIN
  const adminUsers = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      createdAt: true,
      admin: {
        select: {
          id: true,
          facilityRequestId: true,
        },
      },
    },
  });

  if (adminUsers.length === 0) {
    console.log('❌ Aucun utilisateur avec le rôle ADMIN trouvé.\n');
    return;
  }

  console.log(`✅ ${adminUsers.length} utilisateur(s) ADMIN trouvé(s):\n`);

  adminUsers.forEach((user, index) => {
    console.log(`--- Utilisateur ADMIN #${index + 1} ---`);
    console.log(`  User ID: ${user.id}`);
    console.log(`  Nom: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Téléphone: ${user.phone}`);
    console.log(`  Vérifié: ${user.isVerified ? '✅ Oui' : '❌ Non'}`);
    console.log(`  Créé le: ${user.createdAt.toLocaleString()}`);
    
    if (user.admin) {
      console.log(`  ✅ PROFIL ADMIN EXISTE (ID: ${user.admin.id})`);
      console.log(`     Facility Request ID: ${user.admin.facilityRequestId || '❌ NULL'}`);
    } else {
      console.log(`  ❌ AUCUN PROFIL ADMIN LIÉ - PROBLÈME!`);
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

