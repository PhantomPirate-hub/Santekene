import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnostic() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║          🔍 DIAGNOSTIC ORDONNANCES - COMPLET 🔍                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Vérifier les patients
    console.log('1️⃣  VÉRIFICATION DES PATIENTS\n');
    const patients = await prisma.patient.findMany({
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    console.log(`   Patients trouvés: ${patients.length}\n`);
    patients.forEach(p => {
      console.log(`   • Patient ID: ${p.id}`);
      console.log(`     User ID: ${p.user.id}`);
      console.log(`     Email: ${p.user.email}`);
      console.log(`     Nom: ${p.user.name}\n`);
    });

    // 2. Vérifier les consultations
    console.log('2️⃣  VÉRIFICATION DES CONSULTATIONS\n');
    const consultations = await prisma.consultation.findMany({
      include: {
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    console.log(`   Consultations trouvées: ${consultations.length}\n`);
    consultations.forEach(c => {
      console.log(`   • Consultation ID: ${c.id}`);
      console.log(`     Patient ID: ${c.patientId} (${c.patient.user.email})`);
      console.log(`     Docteur ID: ${c.doctorId} (Dr. ${c.doctor.user.name})`);
      console.log(`     Date: ${c.date.toLocaleDateString('fr-FR')}`);
      console.log(`     Diagnostic: ${c.diagnosis}\n`);
    });

    // 3. Vérifier les ordonnances
    console.log('3️⃣  VÉRIFICATION DES ORDONNANCES\n');
    const prescriptions = await prisma.prescription.findMany({
      include: {
        consultation: {
          include: {
            patient: {
              include: {
                user: { select: { email: true, name: true } },
              },
            },
            doctor: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    console.log(`   Ordonnances trouvées: ${prescriptions.length}\n`);
    prescriptions.forEach(p => {
      console.log(`   • Ordonnance ID: ${p.id}`);
      console.log(`     Consultation ID: ${p.consultationId}`);
      console.log(`     Patient: ${p.consultation.patient.user.name} (${p.consultation.patient.user.email})`);
      console.log(`     Médecin: Dr. ${p.consultation.doctor.user.name}`);
      console.log(`     Médicament: ${p.medication}`);
      console.log(`     Dosage: ${p.dosage}`);
      console.log(`     Durée: ${p.duration}\n`);
    });

    // 4. Vérifier par patient spécifique (patient1)
    console.log('4️⃣  ORDONNANCES POUR patient1@example.com\n');
    
    const patient1User = await prisma.user.findUnique({
      where: { email: 'patient1@example.com' },
    });

    if (!patient1User) {
      console.log('   ❌ patient1@example.com non trouvé dans la table User\n');
    } else {
      console.log(`   ✅ User trouvé: ID ${patient1User.id}, Email: ${patient1User.email}\n`);

      const patient1 = await prisma.patient.findUnique({
        where: { userId: patient1User.id },
      });

      if (!patient1) {
        console.log('   ❌ Profil patient non trouvé pour ce user\n');
      } else {
        console.log(`   ✅ Patient trouvé: ID ${patient1.id}\n`);

        // Consultations de patient1
        const patient1Consultations = await prisma.consultation.findMany({
          where: { patientId: patient1.id },
          include: {
            prescription: true,
            doctor: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        });

        console.log(`   📋 Consultations de patient1: ${patient1Consultations.length}\n`);

        patient1Consultations.forEach((c, idx) => {
          console.log(`   Consultation ${idx + 1}:`);
          console.log(`     ID: ${c.id}`);
          console.log(`     Date: ${c.date.toLocaleDateString('fr-FR')}`);
          console.log(`     Diagnostic: ${c.diagnosis}`);
          console.log(`     Médecin: Dr. ${c.doctor.user.name}`);
          
          if (c.prescription) {
            console.log(`     ✅ A une ordonnance:`);
            console.log(`        - Médicament: ${c.prescription.medication}`);
            console.log(`        - Dosage: ${c.prescription.dosage}`);
            console.log(`        - Durée: ${c.prescription.duration}`);
          } else {
            console.log(`     ❌ Pas d'ordonnance`);
          }
          console.log('');
        });

        // Test de la requête exacte du controller
        console.log('5️⃣  TEST DE LA REQUÊTE DU CONTROLLER\n');
        
        const consultationsWithPrescriptions = await prisma.consultation.findMany({
          where: { 
            patientId: patient1.id,
            prescription: {
              isNot: null,
            },
          },
          include: {
            doctor: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            prescription: true,
          },
          orderBy: {
            date: 'desc',
          },
        });

        console.log(`   Résultat de la requête: ${consultationsWithPrescriptions.length} consultation(s) avec ordonnance(s)\n`);

        if (consultationsWithPrescriptions.length === 0) {
          console.log('   ❌ PROBLÈME: La requête ne retourne aucune consultation avec ordonnance\n');
          console.log('   Causes possibles:');
          console.log('   - Les prescriptions ne sont pas correctement liées aux consultations');
          console.log('   - La relation Prisma est mal configurée');
          console.log('   - Les données sont incohérentes\n');
        } else {
          console.log('   ✅ La requête fonctionne correctement\n');
          consultationsWithPrescriptions.forEach((c, idx) => {
            console.log(`   Ordonnance ${idx + 1}:`);
            console.log(`     Médicament: ${c.prescription!.medication}`);
            console.log(`     Dosage: ${c.prescription!.dosage}`);
            console.log(`     Durée: ${c.prescription!.duration}`);
            console.log(`     Médecin: Dr. ${c.doctor.user.name}`);
            console.log('');
          });
        }
      }
    }

    // 6. Résumé
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ\n');
    console.log(`   Patients: ${patients.length}`);
    console.log(`   Consultations: ${consultations.length}`);
    console.log(`   Ordonnances: ${prescriptions.length}`);
    console.log(`   Ordonnances pour patient1: ${
      prescriptions.filter(p => p.consultation.patient.user.email === 'patient1@example.com').length
    }`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERREUR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnostic();

