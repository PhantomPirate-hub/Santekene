import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  // Hash du mot de passe par défaut
  const hashedPassword = await bcrypt.hash('superadmin', 10);

  // Création du Super Admin UNIQUEMENT
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@santekene.com' },
    update: { 
      name: 'Super Admin Santekene',
      password: hashedPassword,
      role: Role.SUPERADMIN,
      phone: '+223 70 00 00 00',
      isVerified: true,
    },
    create: {
      email: 'superadmin@santekene.com',
      name: 'Super Admin Santekene',
      password: hashedPassword,
      role: Role.SUPERADMIN,
      phone: '+223 70 00 00 00',
      isVerified: true,
    },
  });


  // Création du profil SuperAdmin associé
  const superAdmin = await prisma.superAdmin.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: {
      userId: superAdminUser.id,
    },
  });

}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la création des données de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
