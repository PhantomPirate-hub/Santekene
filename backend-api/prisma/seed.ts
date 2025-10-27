import { PrismaClient, Role, AppointmentStatus, AllergySeverity } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('1234', 10);

  // --- Création/Mise à jour des Utilisateurs ---
  const adminUser = await prisma.user.upsert({
    where: { email: 'lassinemale1@gmail.com' },
    update: { name: 'Admin User', password: hashedPassword, role: Role.ADMIN },
    create: {
      email: 'lassinemale1@gmail.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Utilisateur admin créé/mis à jour: ${adminUser.email}`);

  const user1 = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: { name: 'Patient One', password: hashedPassword, role: Role.PATIENT, phone: '+223 70 11 22 33' },
    create: {
      email: 'patient1@example.com',
      name: 'Patient One',
      password: hashedPassword,
      role: Role.PATIENT,
      phone: '+223 70 11 22 33',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'patient2@example.com' },
    update: { name: 'Patient Two', password: hashedPassword, role: Role.PATIENT, phone: '+223 70 44 55 66' },
    create: {
      email: 'patient2@example.com',
      name: 'Patient Two',
      password: hashedPassword,
      role: Role.PATIENT,
      phone: '+223 70 44 55 66',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'patient3@example.com' },
    update: { name: 'Patient Three', password: hashedPassword, role: Role.PATIENT, phone: '+223 70 77 88 99' },
    create: {
      email: 'patient3@example.com',
      name: 'Patient Three',
      password: hashedPassword,
      role: Role.PATIENT,
      phone: '+223 70 77 88 99',
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'doctor1@example.com' },
    update: { name: 'Dr. Diallo', password: hashedPassword, role: Role.MEDECIN, phone: '+223 76 12 34 56' },
    create: {
      email: 'doctor1@example.com',
      name: 'Dr. Diallo',
      password: hashedPassword,
      role: Role.MEDECIN,
      phone: '+223 76 12 34 56',
    },
  });

  const user5 = await prisma.user.upsert({
    where: { email: 'doctor2@example.com' },
    update: { name: 'Dr. Traoré', password: hashedPassword, role: Role.MEDECIN, phone: '+223 76 98 76 54' },
    create: {
      email: 'doctor2@example.com',
      name: 'Dr. Traoré',
      password: hashedPassword,
      role: Role.MEDECIN,
      phone: '+223 76 98 76 54',
    },
  });

  console.log('Utilisateurs de base créés/mis à jour.');

  // --- Création des Patients ---
  const patient1 = await prisma.patient.upsert({
    where: { userId: user1.id },
    update: { birthDate: new Date('1995-08-20'), gender: 'Homme', bloodGroup: 'O+' },
    create: {
      userId: user1.id,
      birthDate: new Date('1995-08-20'),
      gender: 'Homme',
      bloodGroup: 'O+',
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { userId: user2.id },
    update: { birthDate: new Date('1989-03-12'), gender: 'Femme', bloodGroup: 'A-' },
    create: {
      userId: user2.id,
      birthDate: new Date('1989-03-12'),
      gender: 'Femme',
      bloodGroup: 'A-',
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { userId: user3.id },
    update: { birthDate: new Date('2000-11-05'), gender: 'Femme', bloodGroup: 'B+' },
    create: {
      userId: user3.id,
      birthDate: new Date('2000-11-05'),
      gender: 'Femme',
      bloodGroup: 'B+',
    },
  });
  console.log('Profils patients créés/mis à jour.');

  // --- Création des Médecins ---
  const doctor1 = await prisma.doctor.upsert({
    where: { userId: user4.id },
    update: { 
      speciality: 'Médecine Générale', 
      licenseNumber: 'MG-ML-001',
      structure: 'Centre de Santé de Bamako',
      location: 'Bamako, Commune III',
      phone: '+223 76 12 34 56',
    },
    create: {
      userId: user4.id,
      speciality: 'Médecine Générale',
      licenseNumber: 'MG-ML-001',
      structure: 'Centre de Santé de Bamako',
      location: 'Bamako, Commune III',
      phone: '+223 76 12 34 56',
    },
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { userId: user5.id },
    update: { 
      speciality: 'Pédiatrie', 
      licenseNumber: 'PED-ML-002',
      structure: 'Hôpital Gabriel Touré',
      location: 'Bamako, Commune I',
      phone: '+223 76 98 76 54',
    },
    create: {
      userId: user5.id,
      speciality: 'Pédiatrie',
      licenseNumber: 'PED-ML-002',
      structure: 'Hôpital Gabriel Touré',
      location: 'Bamako, Commune I',
      phone: '+223 76 98 76 54',
    },
  });
  console.log('Profils médecins créés/mis à jour.');

  // --- Allergies ---
  await prisma.allergy.createMany({
    data: [
      { 
        allergen: 'Pénicilline', 
        reaction: 'Éruption cutanée sévère, démangeaisons intenses, gonflement du visage', 
        severity: 'HIGH',
        patientId: patient1.id 
      },
      { 
        allergen: 'Arachides', 
        reaction: 'Choc anaphylactique, difficulté respiratoire, urticaire généralisée', 
        severity: 'HIGH',
        patientId: patient2.id 
      },
      { 
        allergen: 'Amoxicilline', 
        reaction: 'Nausées, vomissements, diarrhée', 
        severity: 'MEDIUM',
        patientId: patient3.id 
      },
    ],
    skipDuplicates: true,
  });
  console.log('Allergies ajoutées avec descriptions détaillées.');

  // --- Consultations ---
  const consultation1 = await prisma.consultation.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      diagnosis: 'Paludisme simple',
      notes: 'Traitement antipaludique prescrit',
      allergies: 'Allergie à la pénicilline détectée lors de l\'examen',
      aiSummary: 'Fièvre et fatigue détectées par IA',
      triageScore: 0.82,
      blockchainTxId: 'HCS-TX-1A9Z',
    },
  });

  const consultation2 = await prisma.consultation.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor1.id,
      diagnosis: 'Allergie alimentaire',
      notes: 'Éviter arachides et aliments gras',
      allergies: 'Allergie sévère aux arachides et aux fruits à coque',
      aiSummary: 'Réaction cutanée légère',
      triageScore: 0.64,
      blockchainTxId: 'HCS-TX-2B7M',
    },
  });

  const consultation3 = await prisma.consultation.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor2.id,
      diagnosis: 'Toux persistante',
      notes: 'Repos + sirop antitussif',
      aiSummary: 'Symptômes bénins observés',
      triageScore: 0.55,
      blockchainTxId: 'HCS-TX-3C4P',
    },
  });
  console.log('Consultations ajoutées.');

  // --- Ordonnances / Prescriptions ---
  await prisma.prescription.createMany({
    data: [
      { consultationId: consultation1.id, medication: 'Artemether-Lumefantrine', dosage: '2 comprimés 2x/jour', duration: '3 jours', nftTokenId: 'HTS-NFT-0001', hashOnChain: 'HASH-0xA9C' },
      { consultationId: consultation2.id, medication: 'Loratadine', dosage: '1 comprimé/jour', duration: '5 jours', nftTokenId: 'HTS-NFT-0002', hashOnChain: 'HASH-0xB2D' },
      { consultationId: consultation3.id, medication: 'Sirop antitussif', dosage: '10 ml 3x/jour', duration: '7 jours', nftTokenId: 'HTS-NFT-0003', hashOnChain: 'HASH-0xC3E' },
    ],
    skipDuplicates: true,
  });
  console.log('Ordonnances ajoutées.');

  // --- Documents médicaux ---
  await prisma.document.createMany({
    data: [
      { patientId: patient1.id, type: 'Analyse sanguine', url: 'https://hfs.santekene.io/docs/analyse1.pdf', hash: 'HASH-DOC-1' },
      { patientId: patient2.id, type: 'Radio thorax', url: 'https://hfs.santekene.io/docs/radio2.pdf', hash: 'HASH-DOC-2' },
      { patientId: patient3.id, type: 'Ordonnance ancienne', url: 'https://hfs.santekene.io/docs/ordo3.pdf', hash: 'HASH-DOC-3' },
    ],
    skipDuplicates: true,
  });
  console.log('Documents ajoutés.');

  // --- Rendez-vous ---
  await prisma.appointment.createMany({
    data: [
      { patientId: patient1.id, doctorId: doctor1.id, date: new Date(Date.now() + 86400000), reason: 'Contrôle post-traitement', status: AppointmentStatus.CONFIRMED },
      { patientId: patient2.id, doctorId: doctor1.id, date: new Date(Date.now() + 3 * 86400000), reason: 'Suivi allergie', status: AppointmentStatus.PENDING },
      { patientId: patient3.id, doctorId: doctor2.id, date: new Date(Date.now() + 2 * 86400000), reason: 'Consultation générale', status: AppointmentStatus.CONFIRMED },
    ],
    skipDuplicates: true,
  });
  console.log('Rendez-vous ajoutés.');

  // --- KènèPoints ---
  await prisma.kenePoints.createMany({
    data: [
      { patientId: patient1.id, pointsEarned: 100, reason: 'Première consultation validée', txHash: 'HTS-TX-0xAAA' },
      { patientId: patient2.id, pointsEarned: 50, reason: 'Mise à jour du DSE', txHash: 'HTS-TX-0xBBB' },
      { patientId: patient3.id, pointsEarned: 150, reason: 'Téléconsultation complète', txHash: 'HTS-TX-0xCCC' },
    ],
    skipDuplicates: true,
  });
  console.log('KènèPoints ajoutés.');

  // --- Journaux / Audit ---
  await prisma.auditLog.createMany({
    data: [
      { action: 'CONSULTATION_CREATE', userId: doctor1.userId, details: 'Dr. Diallo a créé une consultation pour patient #1', hcsTxId: 'HCS-TX-A1B' },
      { action: 'DOCUMENT_UPLOAD', userId: patient1.userId, details: 'Patient #1 a téléversé un document sur HFS', hcsTxId: 'HCS-TX-A2C' },
      { action: 'ORDONNANCE_SIGNED', userId: doctor1.userId, details: 'NFT ordonnance émise via HTS pour consultation #1', hcsTxId: 'HCS-TX-A3D' },
    ],
    skipDuplicates: true,
  });
  console.log('Journaux d\'audit ajoutés.');

  // --- Admin Profile ---
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
    },
  });
  console.log('Profil admin créé/mis à jour.');
  
  console.log('\n✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('Erreur lors de la création des données de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });