import { PrismaClient, Role, AppointmentStatus, NotificationType, HederaTransactionType, AllergySeverity } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('1234', 10);

  console.log('🌱 Démarrage du seed amélioré...\n');

  // ========================================
  // USERS
  // ========================================
  
  // Super Admin
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@santekene.io' },
    update: { name: 'Super Administrator', password: hashedPassword, role: Role.SUPERADMIN },
    create: {
      email: 'superadmin@santekene.io',
      name: 'Super Administrator',
      password: hashedPassword,
      role: Role.SUPERADMIN,
      isVerified: true,
    },
  });
  console.log(`✅ SuperAdmin créé: ${superAdminUser.email}`);

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'lassinemale1@gmail.com' },
    update: { name: 'Admin Principal', password: hashedPassword, role: Role.ADMIN },
    create: {
      email: 'lassinemale1@gmail.com',
      name: 'Admin Principal',
      password: hashedPassword,
      role: Role.ADMIN,
      isVerified: true,
    },
  });
  console.log(`✅ Admin créé: ${adminUser.email}`);

  // Patients
  const patient1User = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: { name: 'Mamadou Keita', password: hashedPassword, role: Role.PATIENT },
    create: {
      email: 'patient1@example.com',
      name: 'Mamadou Keita',
      password: hashedPassword,
      role: Role.PATIENT,
      phone: '+223 70 12 34 56',
      isVerified: true,
    },
  });

  const patient2User = await prisma.user.upsert({
    where: { email: 'patient2@example.com' },
    update: { name: 'Aissatou Diop', password: hashedPassword, role: Role.PATIENT },
    create: {
      email: 'patient2@example.com',
      name: 'Aissatou Diop',
      password: hashedPassword,
      role: Role.PATIENT,
      phone: '+223 70 23 45 67',
      isVerified: true,
    },
  });

  const patient3User = await prisma.user.upsert({
    where: { email: 'patient3@example.com' },
    update: { name: 'Fatoumata Sow', password: hashedPassword, role: Role.PATIENT },
    create: {
      email: 'patient3@example.com',
      name: 'Fatoumata Sow',
      password: hashedPassword,
      role: Role.PATIENT,
      phone: '+223 70 34 56 78',
      isVerified: true,
    },
  });
  console.log(`✅ 3 Patients créés`);

  // Doctors
  const doctor1User = await prisma.user.upsert({
    where: { email: 'doctor1@example.com' },
    update: { name: 'Dr. Amadou Diallo', password: hashedPassword, role: Role.MEDECIN },
    create: {
      email: 'doctor1@example.com',
      name: 'Dr. Amadou Diallo',
      password: hashedPassword,
      role: Role.MEDECIN,
      phone: '+223 76 11 22 33',
      isVerified: true,
    },
  });

  const doctor2User = await prisma.user.upsert({
    where: { email: 'doctor2@example.com' },
    update: { name: 'Dr. Mariam Traoré', password: hashedPassword, role: Role.MEDECIN },
    create: {
      email: 'doctor2@example.com',
      name: 'Dr. Mariam Traoré',
      password: hashedPassword,
      role: Role.MEDECIN,
      phone: '+223 76 22 33 44',
      isVerified: true,
    },
  });
  console.log(`✅ 2 Médecins créés\n`);

  // ========================================
  // PROFILES
  // ========================================

  // SuperAdmin Profile
  await prisma.superAdmin.upsert({
    where: { userId: superAdminUser.id },
    update: {},
    create: {
      userId: superAdminUser.id,
      permissions: JSON.stringify({
        manageTokens: true,
        manageAllCenters: true,
        viewAllAudits: true,
        governanceAccess: true,
      }),
    },
  });
  console.log('✅ Profil SuperAdmin créé');

  // Admin Profile
  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
    },
  });
  console.log('✅ Profil Admin créé');

  // Patient Profiles
  const patient1 = await prisma.patient.upsert({
    where: { userId: patient1User.id },
    update: { birthDate: new Date('1995-08-20'), gender: 'Homme', bloodGroup: 'O+' },
    create: {
      userId: patient1User.id,
      birthDate: new Date('1995-08-20'),
      gender: 'Homme',
      bloodGroup: 'O+',
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { userId: patient2User.id },
    update: { birthDate: new Date('1989-03-12'), gender: 'Femme', bloodGroup: 'A-' },
    create: {
      userId: patient2User.id,
      birthDate: new Date('1989-03-12'),
      gender: 'Femme',
      bloodGroup: 'A-',
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { userId: patient3User.id },
    update: { birthDate: new Date('2000-11-05'), gender: 'Femme', bloodGroup: 'B+' },
    create: {
      userId: patient3User.id,
      birthDate: new Date('2000-11-05'),
      gender: 'Femme',
      bloodGroup: 'B+',
    },
  });
  console.log('✅ 3 Profils Patient créés');

  // Doctor Profiles
  const doctor1 = await prisma.doctor.upsert({
    where: { userId: doctor1User.id },
    update: { speciality: 'Médecine Générale', licenseNumber: 'MG-ML-001' },
    create: {
      userId: doctor1User.id,
      speciality: 'Médecine Générale',
      licenseNumber: 'MG-ML-001',
    },
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { userId: doctor2User.id },
    update: { speciality: 'Pédiatrie', licenseNumber: 'PED-ML-002' },
    create: {
      userId: doctor2User.id,
      speciality: 'Pédiatrie',
      licenseNumber: 'PED-ML-002',
    },
  });
  console.log('✅ 2 Profils Médecin créés\n');

  // ========================================
  // HEALTH CENTERS
  // ========================================
  
  await prisma.healthCenter.createMany({
    data: [
      {
        name: 'Hôpital du Point G',
        address: 'Avenue Van Vollenhoven',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6587,
        longitude: -7.9895,
        phone: '+223 20 22 27 12',
        email: 'contact@hopitalpointg.ml',
        website: 'https://hopitalpointg.ml',
      },
      {
        name: 'Hôpital Gabriel Touré',
        address: 'Boulevard du Peuple',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6463,
        longitude: -8.0041,
        phone: '+223 20 22 27 02',
        email: 'contact@gabrieltoure.ml',
      },
      {
        name: 'Centre de Santé Kènè - Bamako',
        address: 'Avenue Modibo Keita',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6392,
        longitude: -8.0029,
        phone: '+223 20 22 33 44',
        email: 'contact.bamako@santekene.ml',
      },
      {
        name: 'Clinique Pasteur',
        address: 'Quartier Hippodrome',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6512,
        longitude: -7.9952,
        phone: '+223 20 21 45 67',
        email: 'contact@pasteur.ml',
      },
      {
        name: 'Centre Hospitalier Universitaire (CHU)',
        address: 'Avenue Kasse Keita',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6421,
        longitude: -7.9978,
        phone: '+223 20 22 35 88',
        email: 'contact@chu-bamako.ml',
      },
      {
        name: 'Hôpital Régional de Sikasso',
        address: 'Route de Koutiala',
        city: 'Sikasso',
        country: 'Mali',
        latitude: 11.3175,
        longitude: -5.6670,
        phone: '+223 21 62 11 22',
        email: 'contact@hr-sikasso.ml',
      },
      {
        name: 'Centre de Santé de Kayes',
        address: 'Avenue Soundiata Keita',
        city: 'Kayes',
        country: 'Mali',
        latitude: 14.4512,
        longitude: -11.4445,
        phone: '+223 21 52 21 45',
        email: 'contact@cs-kayes.ml',
      },
      {
        name: 'Hôpital de Ségou',
        address: 'Route Nationale 6',
        city: 'Ségou',
        country: 'Mali',
        latitude: 13.4317,
        longitude: -6.2633,
        phone: '+223 21 32 04 56',
        email: 'contact@hopital-segou.ml',
      },
      {
        name: 'Centre de Santé de Mopti',
        address: 'Boulevard de l\'Indépendance',
        city: 'Mopti',
        country: 'Mali',
        latitude: 14.4843,
        longitude: -4.1960,
        phone: '+223 21 43 02 78',
        email: 'contact@cs-mopti.ml',
      },
      {
        name: 'Clinique Arc-en-Ciel',
        address: 'ACI 2000',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6234,
        longitude: -7.9894,
        phone: '+223 20 29 45 67',
        email: 'contact@arcenciel.ml',
      },
      {
        name: 'Centre de Santé Communautaire Korofina',
        address: 'Quartier Korofina',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6189,
        longitude: -8.0142,
        phone: '+223 20 22 78 90',
        email: 'cscom.korofina@santekene.ml',
      },
      {
        name: 'Hôpital du Mali',
        address: 'Hamdallaye ACI',
        city: 'Bamako',
        country: 'Mali',
        latitude: 12.6158,
        longitude: -7.9567,
        phone: '+223 20 29 14 25',
        email: 'contact@hopitaldumali.ml',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 12 Centres de santé créés\n');

  // ========================================
  // MEDICAL DATA
  // ========================================

  // Allergies avec descriptions détaillées
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
        allergen: 'Latex', 
        reaction: 'Démangeaisons localisées, rougeurs au point de contact', 
        severity: 'MEDIUM',
        patientId: patient2.id 
      },
      { 
        allergen: 'Amoxicilline', 
        reaction: 'Nausées, vomissements, diarrhée', 
        severity: 'MEDIUM',
        patientId: patient3.id 
      },
      { 
        allergen: 'Poussière', 
        reaction: 'Rhinite allergique, éternuements fréquents, congestion nasale', 
        severity: 'LOW',
        patientId: patient3.id 
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Allergies ajoutées avec descriptions détaillées');

  // Consultations
  const consultation1 = await prisma.consultation.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      diagnosis: 'Paludisme simple',
      notes: 'Traitement antipaludique prescrit. Repos recommandé.',
      aiSummary: 'Fièvre élevée et fatigue détectées par IA. Score de gravité: modéré.',
      triageScore: 0.82,
      blockchainTxId: 'HCS-TX-1A9Z2E',
    },
  });

  const consultation2 = await prisma.consultation.create({
    data: {
      patientId: patient2.id,
      doctorId: doctor1.id,
      diagnosis: 'Réaction allergique alimentaire',
      notes: 'Éviter strictement arachides et fruits à coque.',
      aiSummary: 'Réaction cutanée et gonflement léger observés.',
      triageScore: 0.64,
      blockchainTxId: 'HCS-TX-2B7M3N',
    },
  });

  const consultation3 = await prisma.consultation.create({
    data: {
      patientId: patient3.id,
      doctorId: doctor2.id,
      diagnosis: 'Toux persistante - Bronchite légère',
      notes: 'Repos, hydratation, sirop antitussif.',
      aiSummary: 'Symptômes respiratoires bénins. Pas de fièvre.',
      triageScore: 0.55,
      blockchainTxId: 'HCS-TX-3C4P5Q',
    },
  });
  console.log('✅ 3 Consultations ajoutées');

  // Prescriptions with NFT
  await prisma.prescription.createMany({
    data: [
      { 
        consultationId: consultation1.id, 
        medication: 'Artemether-Lumefantrine + Paracétamol', 
        dosage: '2 comprimés 2x/jour + 1g si fièvre', 
        duration: '3 jours',
        nftTokenId: 'HTS-NFT-PRESC-0001',
        hashOnChain: 'HASH-0xA9C3F2D',
      },
      { 
        consultationId: consultation2.id, 
        medication: 'Loratadine (antihistaminique)', 
        dosage: '10mg 1x/jour',
        duration: '5 jours',
        nftTokenId: 'HTS-NFT-PRESC-0002',
        hashOnChain: 'HASH-0xB2D7E1A',
      },
      { 
        consultationId: consultation3.id, 
        medication: 'Sirop antitussif Carbocistéine', 
        dosage: '10ml 3x/jour',
        duration: '7 jours',
        nftTokenId: 'HTS-NFT-PRESC-0003',
        hashOnChain: 'HASH-0xC3E9A5B',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 3 Prescriptions NFT ajoutées');

  // Documents médicaux
  await prisma.document.createMany({
    data: [
      { patientId: patient1.id, type: 'Analyse sanguine', url: 'hfs://QmX7b3...', hash: 'HASH-DOC-SANG-001' },
      { patientId: patient1.id, type: 'Test paludisme', url: 'hfs://QmY8c4...', hash: 'HASH-DOC-TEST-002' },
      { patientId: patient2.id, type: 'Radio thorax', url: 'hfs://QmZ9d5...', hash: 'HASH-DOC-RADIO-003' },
      { patientId: patient3.id, type: 'Ordonnance précédente', url: 'hfs://QmA1e6...', hash: 'HASH-DOC-ORD-004' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 4 Documents médicaux ajoutés');

  // Appointments
  await prisma.appointment.createMany({
    data: [
      { 
        patientId: patient1.id, 
        doctorId: doctor1.id, 
        date: new Date(Date.now() + 86400000), // +1 jour
        reason: 'Contrôle post-traitement paludisme',
        status: AppointmentStatus.CONFIRMED,
      },
      { 
        patientId: patient2.id, 
        doctorId: doctor1.id, 
        date: new Date(Date.now() + 3 * 86400000), // +3 jours
        reason: 'Suivi allergie alimentaire',
        status: AppointmentStatus.PENDING,
      },
      { 
        patientId: patient3.id, 
        doctorId: doctor2.id, 
        date: new Date(Date.now() + 2 * 86400000), // +2 jours
        reason: 'Consultation pédiatrique générale',
        status: AppointmentStatus.CONFIRMED,
      },
      { 
        patientId: patient1.id, 
        doctorId: doctor2.id, 
        date: new Date(Date.now() + 7 * 86400000), // +7 jours
        reason: 'Vaccination rappel',
        status: AppointmentStatus.PENDING,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 4 Rendez-vous ajoutés\n');

  // ========================================
  // GAMIFICATION & E-LEARNING
  // ========================================

  // KènèPoints
  await prisma.kenePoints.createMany({
    data: [
      { patientId: patient1.id, pointsEarned: 100, reason: 'Première consultation complétée', txHash: 'HTS-TX-KP-0xAAA111' },
      { patientId: patient1.id, pointsEarned: 50, reason: 'Mise à jour profil santé', txHash: 'HTS-TX-KP-0xAAA222' },
      { patientId: patient2.id, pointsEarned: 75, reason: 'Document médical téléversé', txHash: 'HTS-TX-KP-0xBBB111' },
      { patientId: patient3.id, pointsEarned: 150, reason: 'Cours e-learning complété', txHash: 'HTS-TX-KP-0xCCC111' },
      { patientId: patient3.id, pointsEarned: 200, reason: 'Certification NFT obtenue', txHash: 'HTS-TX-KP-0xCCC222' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ KènèPoints distribués');

  // E-Learning Courses
  const course1 = await prisma.eLearningCourse.create({
    data: {
      title: 'Prévention du Paludisme',
      description: 'Apprenez les gestes essentiels pour prévenir le paludisme au quotidien.',
      content: 'Contenu détaillé du cours sur la prévention du paludisme...',
      duration: 30,
      difficulty: 'Débutant',
      category: 'Prévention',
      imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309',
      pointsReward: 100,
    },
  });

  const course2 = await prisma.eLearningCourse.create({
    data: {
      title: 'Gestes de Premiers Secours',
      description: 'Les gestes qui sauvent : formation aux premiers secours.',
      content: 'Contenu du cours premiers secours...',
      duration: 45,
      difficulty: 'Intermédiaire',
      category: 'Urgence',
      imageUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde',
      pointsReward: 150,
    },
  });

  const course3 = await prisma.eLearningCourse.create({
    data: {
      title: 'Nutrition et Santé',
      description: 'Les bases d\'une alimentation équilibrée pour une vie saine.',
      content: 'Contenu du cours nutrition...',
      duration: 25,
      difficulty: 'Débutant',
      category: 'Nutrition',
      imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
      pointsReward: 80,
    },
  });
  console.log('✅ 3 Cours e-learning créés');

  // User Course Progress
  await prisma.userCourse.createMany({
    data: [
      { userId: patient1User.id, courseId: course1.id, progress: 100, completed: true, completedAt: new Date() },
      { userId: patient2User.id, courseId: course1.id, progress: 65, completed: false },
      { userId: patient3User.id, courseId: course2.id, progress: 100, completed: true, completedAt: new Date() },
      { userId: patient1User.id, courseId: course3.id, progress: 40, completed: false },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Progressions e-learning enregistrées');

  // NFT Certifications
  await prisma.nFTCertification.createMany({
    data: [
      {
        userId: patient1User.id,
        courseId: course1.id,
        nftTokenId: 'HTS-NFT-CERT-0001',
        nftMetadata: JSON.stringify({
          name: 'Certification Prévention Paludisme',
          description: 'Validé le ' + new Date().toLocaleDateString('fr-FR'),
          image: 'ipfs://QmCert001...',
        }),
        txHash: 'HTS-TX-CERT-0x1A2B3C',
        ipfsHash: 'QmCert001abc123',
      },
      {
        userId: patient3User.id,
        courseId: course2.id,
        nftTokenId: 'HTS-NFT-CERT-0002',
        nftMetadata: JSON.stringify({
          name: 'Certification Premiers Secours',
          description: 'Validé le ' + new Date().toLocaleDateString('fr-FR'),
          image: 'ipfs://QmCert002...',
        }),
        txHash: 'HTS-TX-CERT-0x4D5E6F',
        ipfsHash: 'QmCert002def456',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 2 Certifications NFT émises\n');

  // ========================================
  // NOTIFICATIONS
  // ========================================

  await prisma.notification.createMany({
    data: [
      {
        userId: patient1User.id,
        title: 'Rendez-vous confirmé',
        message: 'Votre rendez-vous de contrôle avec Dr. Diallo est confirmé pour demain.',
        type: NotificationType.APPOINTMENT,
      },
      {
        userId: patient1User.id,
        title: 'KènèPoints gagnés !',
        message: 'Vous avez gagné 100 KP pour votre consultation.',
        type: NotificationType.KENEPOINTS,
        isRead: true,
      },
      {
        userId: patient2User.id,
        title: 'Nouvelle ordonnance',
        message: 'Dr. Diallo vous a prescrit un traitement. Consultez votre DSE.',
        type: NotificationType.PRESCRIPTION,
      },
      {
        userId: doctor1User.id,
        title: 'Nouveau rendez-vous',
        message: 'Rendez-vous avec Aissatou Diop prévu dans 3 jours.',
        type: NotificationType.APPOINTMENT,
      },
      {
        userId: patient3User.id,
        title: 'Félicitations !',
        message: 'Vous avez obtenu votre certification Premiers Secours NFT !',
        type: NotificationType.SUCCESS,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Notifications créées');

  // ========================================
  // BLOCKCHAIN / HEDERA
  // ========================================

  await prisma.hederaTransaction.createMany({
    data: [
      {
        txId: 'HCS-TX-1A9Z2E',
        type: HederaTransactionType.HCS_MESSAGE,
        userId: doctor1User.id,
        entityId: consultation1.id,
        topicId: '0.0.12345',
        status: 'SUCCESS',
        consensusTimestamp: '2024-10-25T10:30:00Z',
        memo: 'Consultation paludisme - Patient #1',
        cost: 0.0001,
      },
      {
        txId: 'HTS-NFT-PRESC-0001',
        type: HederaTransactionType.HTS_MINT_NFT,
        userId: doctor1User.id,
        entityId: consultation1.id,
        tokenId: '0.0.67890',
        status: 'SUCCESS',
        consensusTimestamp: '2024-10-25T10:31:00Z',
        memo: 'Prescription NFT - Consultation #1',
        cost: 0.05,
        metadata: JSON.stringify({ prescription: 'Artemether-Lumefantrine' }),
      },
      {
        txId: 'HTS-TX-KP-0xAAA111',
        type: HederaTransactionType.HTS_TRANSFER_FT,
        userId: patient1User.id,
        tokenId: '0.0.11111',
        amount: 100,
        status: 'SUCCESS',
        consensusTimestamp: '2024-10-25T10:32:00Z',
        memo: 'KènèPoints - Première consultation',
        cost: 0.0001,
      },
      {
        txId: 'HTS-TX-CERT-0x1A2B3C',
        type: HederaTransactionType.HTS_MINT_NFT,
        userId: patient1User.id,
        entityId: course1.id,
        tokenId: '0.0.22222',
        status: 'SUCCESS',
        consensusTimestamp: '2024-10-25T11:00:00Z',
        memo: 'Certification NFT - Prévention Paludisme',
        cost: 0.05,
        metadata: JSON.stringify({ course: 'Prévention du Paludisme', completed: true }),
      },
      {
        txId: 'HFS-UPLOAD-DOC-001',
        type: HederaTransactionType.HFS_UPLOAD,
        userId: patient1User.id,
        fileId: '0.0.33333',
        status: 'SUCCESS',
        consensusTimestamp: '2024-10-25T09:15:00Z',
        memo: 'Upload analyse sanguine',
        cost: 0.01,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ 5 Transactions Hedera enregistrées');

  // ========================================
  // AUDIT LOG
  // ========================================

  await prisma.auditLog.createMany({
    data: [
      { 
        action: 'USER_LOGIN', 
        userId: patient1User.id, 
        details: 'Connexion réussie depuis IP 192.168.1.10',
        hcsTxId: 'HCS-AUDIT-0x001',
      },
      { 
        action: 'CONSULTATION_CREATE', 
        userId: doctor1User.id, 
        details: 'Dr. Diallo a créé une consultation pour Mamadou Keita',
        hcsTxId: 'HCS-AUDIT-0x002',
      },
      { 
        action: 'PRESCRIPTION_SIGNED', 
        userId: doctor1User.id, 
        details: 'NFT ordonnance émise via HTS pour consultation #1',
        hcsTxId: 'HCS-AUDIT-0x003',
      },
      { 
        action: 'DOCUMENT_UPLOAD', 
        userId: patient1User.id, 
        details: 'Document analyse sanguine téléversé sur HFS',
        hcsTxId: 'HCS-AUDIT-0x004',
      },
      { 
        action: 'KENEPOINTS_EARNED', 
        userId: patient1User.id, 
        details: '100 KP gagnés - Première consultation',
        hcsTxId: 'HCS-AUDIT-0x005',
      },
      { 
        action: 'NFT_CERTIFICATION_MINTED', 
        userId: patient1User.id, 
        details: 'Certification Prévention Paludisme obtenue',
        hcsTxId: 'HCS-AUDIT-0x006',
      },
      { 
        action: 'ADMIN_USER_CREATE', 
        userId: adminUser.id, 
        details: 'Admin a créé un nouveau compte médecin',
        hcsTxId: 'HCS-AUDIT-0x007',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Logs d\'audit créés\n');

  // ========================================
  // COMMUNAUTÉ (Posts, Commentaires, Likes)
  // ========================================

  // Créer des posts de communauté
  const post1 = await prisma.communityPost.create({
    data: {
      authorId: patient1User.id,
      title: 'Comment gérer le stress au quotidien ?',
      content: `Bonjour à tous,

Je cherche des conseils pour mieux gérer mon stress au travail. J'ai essayé la méditation mais je n'arrive pas à m'y tenir régulièrement. Avez-vous des astuces qui ont marché pour vous ?

Merci d'avance pour vos retours ! 🙏`,
      category: 'Bien-être',
      published: true,
    },
  });

  const post2 = await prisma.communityPost.create({
    data: {
      authorId: doctor1User.id,
      title: 'L\'importance de l\'hydratation pendant la saison sèche',
      content: `Chers membres de la communauté,

Avec la saison sèche qui approche, je tenais à vous rappeler l'importance de bien s'hydrater. Voici quelques recommandations :

• Buvez au moins 2 litres d'eau par jour
• Évitez les boissons sucrées
• Mangez des fruits riches en eau (pastèque, orange)
• Portez un chapeau en sortant

Prenez soin de vous ! 💧`,
      category: 'Santé',
      published: true,
    },
  });

  const post3 = await prisma.communityPost.create({
    data: {
      authorId: patient2User.id,
      title: 'Mes astuces pour une alimentation équilibrée',
      content: `Salut la communauté !

Je voulais partager avec vous quelques astuces qui m'ont aidée à mieux manger :

1. Préparer mes repas le dimanche pour toute la semaine
2. Toujours avoir des fruits et légumes frais
3. Limiter la consommation d'aliments transformés
4. Boire de l'eau avant chaque repas

N'hésitez pas à partager vos propres astuces ! 🥗`,
      category: 'Nutrition',
      published: true,
    },
  });

  const post4 = await prisma.communityPost.create({
    data: {
      authorId: patient3User.id,
      title: 'Mon parcours de perte de poids - Témoignage',
      content: `Bonjour à tous,

Je voulais partager mon témoignage car cela pourrait encourager certains d'entre vous. Il y a 6 mois, j'ai décidé de prendre ma santé en main. J'ai perdu 10kg en combinant :

• Une alimentation équilibrée (merci aux conseils du Dr Diallo !)
• 30 minutes de marche par jour
• Beaucoup de patience et de persévérance

Le plus important : ne pas se décourager ! Chaque petit pas compte. 💪

Si vous avez des questions, n'hésitez pas !`,
      category: 'Témoignage',
      published: true,
    },
  });

  const post5 = await prisma.communityPost.create({
    data: {
      authorId: doctor2User.id,
      title: 'Questions fréquentes sur la vaccination des enfants',
      content: `Bonjour chers parents,

Je reçois souvent les mêmes questions sur la vaccination. Voici quelques réponses :

**Q: À quel âge commencer ?**
R: Dès la naissance avec le BCG et l'hépatite B.

**Q: Y a-t-il des effets secondaires ?**
R: Légères fièvres et rougeurs sont normales. Cela montre que le vaccin agit.

**Q: Quels vaccins sont obligatoires ?**
R: Consultez le calendrier vaccinal national.

N'hésitez pas si vous avez d'autres questions ! 💉`,
      category: 'Question',
      published: true,
    },
  });

  const post6 = await prisma.communityPost.create({
    data: {
      authorId: patient1User.id,
      title: 'Reprise du sport après une longue pause - Conseils ?',
      content: `Salut les sportifs !

Après 2 ans sans faire de sport (Covid, travail, etc.), je veux reprendre. Mais je ne sais pas par où commencer pour éviter les blessures.

Quels sports recommandez-vous pour redémarrer en douceur ? Combien de fois par semaine ?

Merci ! 🏃`,
      category: 'Sport',
      published: true,
    },
  });

  console.log('✅ 6 Posts de communauté créés\n');

  // Créer des likes sur les posts
  await prisma.communityLike.createMany({
    data: [
      { postId: post1.id, userId: patient2User.id },
      { postId: post1.id, userId: patient3User.id },
      { postId: post1.id, userId: doctor1User.id },
      { postId: post2.id, userId: patient1User.id },
      { postId: post2.id, userId: patient2User.id },
      { postId: post2.id, userId: patient3User.id },
      { postId: post3.id, userId: patient1User.id },
      { postId: post3.id, userId: doctor1User.id },
      { postId: post4.id, userId: patient1User.id },
      { postId: post4.id, userId: patient2User.id },
      { postId: post4.id, userId: doctor1User.id },
      { postId: post4.id, userId: doctor2User.id },
      { postId: post5.id, userId: patient1User.id },
      { postId: post5.id, userId: patient2User.id },
      { postId: post6.id, userId: patient2User.id },
      { postId: post6.id, userId: doctor1User.id },
    ],
    skipDuplicates: true,
  });

  // Mettre à jour les compteurs de likes
  await prisma.communityPost.update({ where: { id: post1.id }, data: { likesCount: 3 } });
  await prisma.communityPost.update({ where: { id: post2.id }, data: { likesCount: 3 } });
  await prisma.communityPost.update({ where: { id: post3.id }, data: { likesCount: 2 } });
  await prisma.communityPost.update({ where: { id: post4.id }, data: { likesCount: 4 } });
  await prisma.communityPost.update({ where: { id: post5.id }, data: { likesCount: 2 } });
  await prisma.communityPost.update({ where: { id: post6.id }, data: { likesCount: 2 } });

  console.log('✅ 16 Likes créés\n');

  // Créer des commentaires
  await prisma.communityComment.createMany({
    data: [
      {
        postId: post1.id,
        authorId: doctor1User.id,
        content: 'Bonjour Mamadou, essayez de commencer par 5 minutes de respiration profonde chaque matin. C\'est un bon début !',
      },
      {
        postId: post1.id,
        authorId: patient2User.id,
        content: 'J\'ai eu le même problème. Ce qui m\'a aidé c\'est de faire du yoga le soir avant de dormir. Il y a plein de vidéos gratuites sur YouTube 😊',
      },
      {
        postId: post2.id,
        authorId: patient1User.id,
        content: 'Merci Docteur pour ces conseils ! Je vais faire plus attention à mon hydratation.',
      },
      {
        postId: post3.id,
        authorId: patient3User.id,
        content: 'Super astuces ! La préparation des repas le dimanche est vraiment une bonne idée. Je vais essayer !',
      },
      {
        postId: post4.id,
        authorId: doctor1User.id,
        content: 'Bravo Fatoumata ! C\'est un excellent résultat. Continue comme ça ! 👏',
      },
      {
        postId: post4.id,
        authorId: patient1User.id,
        content: 'Très inspirant ! Combien de temps ça t\'a pris pour voir les premiers résultats ?',
      },
      {
        postId: post4.id,
        authorId: patient2User.id,
        content: 'Félicitations ! Ton parcours me motive à commencer moi aussi 💪',
      },
      {
        postId: post5.id,
        authorId: patient1User.id,
        content: 'Merci Docteur ! Très clair comme explications.',
      },
      {
        postId: post6.id,
        authorId: doctor1User.id,
        content: 'Je recommande la marche rapide ou la natation pour reprendre en douceur. Commence par 2-3 fois par semaine.',
      },
      {
        postId: post6.id,
        authorId: patient3User.id,
        content: 'J\'étais dans le même cas ! J\'ai commencé par du vélo et maintenant je fais du jogging. Vas-y progressivement 🚴',
      },
    ],
    skipDuplicates: true,
  });

  // Mettre à jour les compteurs de commentaires
  await prisma.communityPost.update({ where: { id: post1.id }, data: { commentsCount: 2 } });
  await prisma.communityPost.update({ where: { id: post2.id }, data: { commentsCount: 1 } });
  await prisma.communityPost.update({ where: { id: post3.id }, data: { commentsCount: 1 } });
  await prisma.communityPost.update({ where: { id: post4.id }, data: { commentsCount: 3 } });
  await prisma.communityPost.update({ where: { id: post5.id }, data: { commentsCount: 1 } });
  await prisma.communityPost.update({ where: { id: post6.id }, data: { commentsCount: 2 } });

  console.log('✅ 10 Commentaires créés\n');

  // ========================================
  // MESSAGES (Chat/Téléconsultation)
  // ========================================

  await prisma.message.createMany({
    data: [
      {
        senderId: patient1User.id,
        receiverId: doctor1User.id,
        content: 'Bonjour Docteur, j\'ai une question sur mon traitement antipaludique.',
        isRead: true,
      },
      {
        senderId: doctor1User.id,
        receiverId: patient1User.id,
        content: 'Bonjour Mamadou, bien sûr. Quelle est votre question ?',
        isRead: true,
      },
      {
        senderId: patient1User.id,
        receiverId: doctor1User.id,
        content: 'Est-ce que je peux prendre le médicament après le repas ?',
        isRead: false,
      },
      {
        senderId: patient2User.id,
        receiverId: doctor1User.id,
        content: 'Docteur, j\'ai toujours des démangeaisons. Que faire ?',
        isRead: false,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Messages créés\n');

  // ========================================
  // SUMMARY
  // ========================================

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ SEED AMÉLIORÉ TERMINÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('📊 Données créées :');
  console.log('  • 1 SuperAdmin');
  console.log('  • 1 Admin');
  console.log('  • 2 Médecins');
  console.log('  • 3 Patients');
  console.log('  • 12 Centres de santé');
  console.log('  • 4 Allergies');
  console.log('  • 3 Consultations');
  console.log('  • 3 Prescriptions NFT');
  console.log('  • 4 Documents médicaux');
  console.log('  • 4 Rendez-vous');
  console.log('  • 5 Transactions KènèPoints');
  console.log('  • 3 Cours e-learning');
  console.log('  • 4 Progressions cours');
  console.log('  • 2 Certifications NFT');
  console.log('  • 5 Notifications');
  console.log('  • 5 Transactions Hedera');
  console.log('  • 7 Logs d\'audit');
  console.log('  • 6 Posts communauté');
  console.log('  • 16 Likes');
  console.log('  • 10 Commentaires');
  console.log('  • 4 Messages\n');

  console.log('🔐 Comptes de test (mot de passe: 1234) :');
  console.log('  • superadmin@santekene.io - SuperAdmin');
  console.log('  • lassinemale1@gmail.com - Admin');
  console.log('  • doctor1@example.com - Dr. Diallo (Médecine Générale)');
  console.log('  • doctor2@example.com - Dr. Traoré (Pédiatrie)');
  console.log('  • patient1@example.com - Mamadou Keita');
  console.log('  • patient2@example.com - Aissatou Diop');
  console.log('  • patient3@example.com - Fatoumata Sow\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

