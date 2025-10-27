import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Création de structures de santé approuvées pour les tests...');

  // Créer quelques structures approuvées
  const facilities = [
    {
      facilityName: 'Hôpital Gabriel Touré',
      facilityType: 'Hôpital',
      facilityAddress: 'Rue Kasse Keita',
      facilityCity: 'Bamako',
      facilityPhone: '+223 20 22 27 12',
      facilityEmail: 'contact@gabrieltoure.ml',
      responsibleName: 'Dr. Amadou Diarra',
      responsiblePosition: 'Directeur Général',
      responsiblePhone: '+223 76 12 34 56',
      responsibleEmail: 'a.diarra@gabrieltoure.ml',
      documentType: 'Agrément Ministère de la Santé',
      status: 'APPROVED' as const,
      approvedAt: new Date(),
    },
    {
      facilityName: 'Hôpital du Point G',
      facilityType: 'Hôpital',
      facilityAddress: 'Avenue Van Vollenhoven',
      facilityCity: 'Bamako',
      facilityPhone: '+223 20 22 50 02',
      facilityEmail: 'contact@pointg.ml',
      responsibleName: 'Dr. Fatoumata Keita',
      responsiblePosition: 'Directrice Médicale',
      responsiblePhone: '+223 70 12 34 56',
      responsibleEmail: 'f.keita@pointg.ml',
      documentType: 'Agrément Ministère de la Santé',
      status: 'APPROVED' as const,
      approvedAt: new Date(),
    },
    {
      facilityName: 'Clinique Pasteur',
      facilityType: 'Clinique',
      facilityAddress: 'Avenue de la Marne',
      facilityCity: 'Bamako',
      facilityPhone: '+223 20 22 66 85',
      facilityEmail: 'contact@pasteur.ml',
      responsibleName: 'Dr. Ibrahim Traoré',
      responsiblePosition: 'Directeur',
      responsiblePhone: '+223 66 12 34 56',
      responsibleEmail: 'i.traore@pasteur.ml',
      documentType: 'Licence d\'exploitation',
      status: 'APPROVED' as const,
      approvedAt: new Date(),
    },
    {
      facilityName: 'Centre de Santé de Koulikoro',
      facilityType: 'Centre de santé',
      facilityAddress: 'Centre-ville',
      facilityCity: 'Koulikoro',
      facilityPhone: '+223 21 26 20 15',
      facilityEmail: 'contact@cs-koulikoro.ml',
      responsibleName: 'Dr. Salif Coulibaly',
      responsiblePosition: 'Médecin Chef',
      responsiblePhone: '+223 78 12 34 56',
      responsibleEmail: 's.coulibaly@cs-koulikoro.ml',
      documentType: 'Agrément CSCom',
      status: 'APPROVED' as const,
      approvedAt: new Date(),
    },
  ];

  for (const facility of facilities) {
    const existing = await prisma.healthFacilityRequest.findUnique({
      where: { facilityEmail: facility.facilityEmail },
    });

    if (existing) {
      console.log(`✅ Structure déjà existante: ${facility.facilityName}`);
    } else {
      await prisma.healthFacilityRequest.create({
        data: facility,
      });
      console.log(`✅ Structure créée: ${facility.facilityName}`);
    }
  }

  console.log('✅ Structures de santé créées avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

