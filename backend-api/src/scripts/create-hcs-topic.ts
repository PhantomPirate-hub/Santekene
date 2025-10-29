/**
 * Script pour créer un nouveau Topic HCS sur Hedera Testnet
 * 
 * Usage:
 * npx ts-node src/scripts/create-hcs-topic.ts
 */

import { Client, TopicCreateTransaction, PrivateKey } from '@hashgraph/sdk';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function createHcsTopic() {
  console.log('🚀 Création du Topic HCS sur Hedera Testnet...\n');

  // Vérifier les variables d'environnement
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';

  if (!operatorId || !operatorKey) {
    console.error('❌ Erreur: HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY doivent être définis dans le fichier .env');
    console.log('\n📋 Guide rapide:');
    console.log('1. Créez un compte sur https://portal.hedera.com/');
    console.log('2. Récupérez votre Account ID et Private Key');
    console.log('3. Ajoutez-les dans backend-api/.env:');
    console.log('   HEDERA_OPERATOR_ID="0.0.XXXXXXX"');
    console.log('   HEDERA_OPERATOR_KEY="302e020100..."');
    process.exit(1);
  }

  try {
    // Créer le client Hedera
    const client = network === 'mainnet'
      ? Client.forMainnet()
      : Client.forTestnet();

    client.setOperator(operatorId, PrivateKey.fromStringDer(operatorKey));

    console.log(`📡 Connecté au réseau: ${network.toUpperCase()}`);
    console.log(`👤 Operator Account: ${operatorId}\n`);

    // Créer le topic
    console.log('⏳ Création du topic en cours...');

    const transaction = new TopicCreateTransaction()
      .setTopicMemo('Santekene - Medical Data Audit Trail')
      .setAdminKey(client.operatorPublicKey!)
      .setSubmitKey(client.operatorPublicKey!)
      .freezeWith(client);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    if (!topicId) {
      throw new Error('Topic ID non reçu dans le receipt');
    }

    console.log('\n✅ Topic HCS créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📋 Topic ID: ${topicId.toString()}`);
    console.log(`🔗 Explorer: https://hashscan.io/${network}/topic/${topicId.toString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('⚠️  IMPORTANT: Ajoutez ce Topic ID dans votre fichier .env:');
    console.log(`HEDERA_TOPIC_ID="${topicId.toString()}"\n`);

    console.log('📝 Prochaines étapes:');
    console.log('1. Copiez le Topic ID ci-dessus');
    console.log('2. Ouvrez backend-api/.env');
    console.log('3. Ajoutez ou modifiez la ligne: HEDERA_TOPIC_ID="..."');
    console.log('4. Redémarrez le serveur backend\n');

    // Fermer le client
    client.close();

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la création du topic:');
    
    if (error.message?.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
      console.error('💰 Solde insuffisant sur votre compte Hedera.');
      console.log('\n📋 Solution:');
      console.log('1. Allez sur https://portal.hedera.com/');
      console.log('2. Connectez-vous avec votre compte');
      console.log('3. Cliquez sur "Testnet" > "Add Testnet HBAR"');
      console.log('4. Vous recevrez 10,000 HBAR gratuits');
    } else if (error.message?.includes('INVALID_SIGNATURE')) {
      console.error('🔑 Clé privée invalide ou ne correspond pas à l\'Account ID.');
      console.log('\n📋 Solution:');
      console.log('1. Vérifiez que HEDERA_OPERATOR_KEY est au format DER (commence par "302e020100...")');
      console.log('2. Vérifiez que la clé correspond bien à votre Account ID');
    } else {
      console.error(error.message || error);
    }
    
    process.exit(1);
  }
}

// Exécuter le script
createHcsTopic();

