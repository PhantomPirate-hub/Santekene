require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkHFSStatus() {
  console.log('\n🔍 VÉRIFICATION HFS (Hedera File Service)\n');
  console.log('═'.repeat(60));

  // 1. Vérifier les variables d'environnement
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;

  console.log('\n📋 Configuration:');
  console.log(`   Operator ID: ${operatorId || '❌ NON CONFIGURÉ'}`);
  console.log(`   Operator Key: ${operatorKey ? '✅ Configuré' : '❌ NON CONFIGURÉ'}`);

  if (!operatorId || !operatorKey) {
    console.log('\n⚠️  HFS non configuré ! Ajoutez ces variables dans .env');
    console.log('   HEDERA_OPERATOR_ID=0.0.XXXXXXX');
    console.log('   HEDERA_OPERATOR_KEY=302e020100...');
    return;
  }

  // 2. Vérifier les documents avec HFS dans la DB
  try {
    const documentsWithHFS = await prisma.document.findMany({
      where: {
        hfsFileId: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        hfsFileId: true,
        hfsHash: true,
        size: true,
        createdAt: true,
      },
    });

    console.log(`\n📁 Documents sur HFS: ${documentsWithHFS.length}`);

    if (documentsWithHFS.length === 0) {
      console.log('   ⚠️  Aucun document uploadé sur HFS pour le moment');
      console.log('   💡 Uploadez un document pour tester HFS');
    } else {
      console.log('\n   Derniers documents sur HFS:');
      console.log('   ' + '─'.repeat(58));
      documentsWithHFS.forEach((doc, index) => {
        console.log(`\n   ${index + 1}. ${doc.name}`);
        console.log(`      📄 File ID: ${doc.hfsFileId}`);
        console.log(`      🔗 HashScan: https://hashscan.io/testnet/file/${doc.hfsFileId}`);
        console.log(`      🔐 Hash: ${doc.hfsHash?.substring(0, 16)}...`);
        console.log(`      📊 Taille: ${(doc.size / 1024).toFixed(2)} KB`);
        console.log(`      📅 Date: ${new Date(doc.createdAt).toLocaleString('fr-FR')}`);
      });

      console.log('\n   ' + '─'.repeat(58));
      console.log('\n   💡 Copiez un lien HashScan ci-dessus pour voir le fichier !');
    }

    // 3. Statistiques
    const totalDocuments = await prisma.document.count();
    const documentsWithoutHFS = totalDocuments - documentsWithHFS.length;

    console.log('\n📊 Statistiques:');
    console.log(`   Total documents: ${totalDocuments}`);
    console.log(`   Avec HFS: ${documentsWithHFS.length} (${((documentsWithHFS.length / totalDocuments) * 100).toFixed(1)}%)`);
    console.log(`   Sans HFS: ${documentsWithoutHFS} (local uniquement)`);

    // 4. Lien compte Hedera
    console.log('\n🔗 Liens utiles:');
    console.log(`   Compte: https://hashscan.io/testnet/account/${operatorId}`);
    console.log(`   Topic HCS: https://hashscan.io/testnet/topic/${process.env.HEDERA_TOPIC_ID || 'NON_CONFIGURÉ'}`);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

checkHFSStatus();

