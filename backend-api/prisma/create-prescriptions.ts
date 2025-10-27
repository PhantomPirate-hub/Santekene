import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createPrescriptions() {
  try {
    console.log('🔍 Création d\'ordonnances de test...');

    // Récupérer les patients
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    console.log(`📋 Patients trouvés: ${patients.length}`);

    if (patients.length === 0) {
      console.log('❌ Aucun patient trouvé. Exécutez d\'abord le seed principal.');
      return;
    }

    // Récupérer les médecins
    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    console.log(`👨‍⚕️ Médecins trouvés: ${doctors.length}`);

    if (doctors.length === 0) {
      console.log('❌ Aucun médecin trouvé. Exécutez d\'abord le seed principal.');
      return;
    }

    // Pour chaque patient, créer une consultation avec ordonnance
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const doctor = doctors[i % doctors.length]; // Alterner entre les médecins

      console.log(`\n🔄 Création consultation pour ${patient.user.email}...`);

      // Vérifier si le patient a déjà une consultation
      const existingConsultation = await prisma.consultation.findFirst({
        where: { patientId: patient.id },
        include: { prescription: true },
      });

      if (existingConsultation && existingConsultation.prescription) {
        console.log(`✅ ${patient.user.email} a déjà une ordonnance`);
        continue;
      }

      // Créer une consultation
      const consultation = await prisma.consultation.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          date: new Date(),
          diagnosis: i === 0
            ? 'Paludisme - Fièvre et frissons'
            : i === 1
            ? 'Allergie saisonnière - Rhinite allergique'
            : 'Toux persistante - Infection respiratoire',
          notes: `Consultation du ${new Date().toLocaleDateString('fr-FR')}. Patient présentant des symptômes depuis 3 jours.`,
          blockchainTxId: `HCS-TX-${Date.now()}-${i}`,
        },
      });

      console.log(`✅ Consultation créée: ID ${consultation.id}`);

      // Créer l'ordonnance associée
      const prescription = await prisma.prescription.create({
        data: {
          consultationId: consultation.id,
          medication: i === 0
            ? 'Artemether-Lumefantrine (Coartem)'
            : i === 1
            ? 'Loratadine (Clarityne) 10mg'
            : 'Sirop antitussif Codéine',
          dosage: i === 0
            ? '2 comprimés'
            : i === 1
            ? '1 comprimé'
            : '10 ml',
          duration: i === 0
            ? '3 jours'
            : i === 1
            ? '5 jours'
            : '7 jours',
          nftTokenId: `HTS-NFT-${Date.now()}-${i}`,
          hashOnChain: `HASH-0x${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        },
      });

      console.log(`💊 Ordonnance créée: ID ${prescription.id}`);
      console.log(`   Médicament: ${prescription.medication}`);
      console.log(`   Dosage: ${prescription.dosage}`);
      console.log(`   Durée: ${prescription.duration}`);
      console.log(`   Médecin: Dr. ${doctor.user.name}`);
      console.log(`   Patient: ${patient.user.name}`);
    }

    // Afficher le résumé
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ DES ORDONNANCES CRÉÉES');
    console.log('══════════════════════════════════════════════════════════════\n');

    const allConsultations = await prisma.consultation.findMany({
      include: {
        patient: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        prescription: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    for (const consult of allConsultations) {
      if (consult.prescription) {
        console.log(`📋 Patient: ${consult.patient.user.name} (${consult.patient.user.email})`);
        console.log(`   👨‍⚕️ Médecin: Dr. ${consult.doctor.user.name}`);
        console.log(`   📅 Date: ${consult.date.toLocaleDateString('fr-FR')}`);
        console.log(`   🩺 Diagnostic: ${consult.diagnosis}`);
        console.log(`   💊 Médicament: ${consult.prescription.medication}`);
        console.log(`   📏 Dosage: ${consult.prescription.dosage}`);
        console.log(`   ⏰ Durée: ${consult.prescription.duration}`);
        console.log('');
      }
    }

    const totalPrescriptions = await prisma.prescription.count();
    console.log(`✅ TOTAL ORDONNANCES DANS LA BASE: ${totalPrescriptions}`);
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la création des ordonnances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPrescriptions()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

