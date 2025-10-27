import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function createKenePointToken() {
  console.log('🪙 Création du token KenePoint (KNP)...\n');

  // Configuration Hedera
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;
  const network = process.env.HEDERA_NETWORK || 'testnet';

  if (!operatorId || !operatorKey) {
    throw new Error('HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY requis dans .env');
  }

  // Initialiser le client
  const client = network === 'testnet'
    ? Client.forTestnet()
    : Client.forMainnet();

  client.setOperator(operatorId, operatorKey);

  try {
    console.log(`📡 Réseau: ${network}`);
    console.log(`👤 Operator: ${operatorId}\n`);

    // Créer le token
    console.log('⏳ Création du token en cours...');

    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName('KenePoint')
      .setTokenSymbol('KNP')
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2) // 0.01 KNP possible
      .setInitialSupply(1_000_000_00) // 1,000,000 KNP (avec 2 decimals)
      .setMaxSupply(10_000_000_00) // 10,000,000 KNP max
      .setSupplyType(TokenSupplyType.Finite)
      .setTreasuryAccountId(operatorId) // Backend = treasury
      .setAdminKey(client.operatorPublicKey!) // Peut modifier le token
      .setSupplyKey(client.operatorPublicKey!) // Peut mint/burn
      .setFreezeKey(client.operatorPublicKey!) // Peut freeze comptes
      .setWipeKey(client.operatorPublicKey!) // Peut wipe comptes
      .setFreezeDefault(false) // Comptes non freezés par défaut
      .setMaxTransactionFee(new Hbar(50)) // Max 50 HBAR pour la tx
      .execute(client);

    console.log('⏳ En attente du receipt...');

    const tokenCreateReceipt = await tokenCreateTx.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId;

    console.log('\n' + '='.repeat(60));
    console.log('✅ Token KenePoint créé avec succès !');
    console.log('='.repeat(60));
    console.log('📝 Token ID:', tokenId?.toString());
    console.log('💰 Supply Initial: 1,000,000.00 KNP');
    console.log('🔢 Decimals: 2');
    console.log('📊 Max Supply: 10,000,000.00 KNP');
    console.log('🏦 Treasury: ', operatorId);
    console.log('🔑 Admin Key: ✅');
    console.log('🔑 Supply Key: ✅');
    console.log('🔑 Freeze Key: ✅');
    console.log('🔑 Wipe Key: ✅');

    // Récupérer le coût de la transaction
    const txRecord = await tokenCreateTx.getRecord(client);
    const cost = txRecord.transactionFee;

    console.log('\n💸 Coût de création:', cost.toString());

    console.log('\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANT: Ajouter dans backend-api/.env');
    console.log('='.repeat(60));
    console.log(`HEDERA_TOKEN_ID=${tokenId?.toString()}`);
    console.log('');

    console.log('\n📋 Vérifier le token sur HashScan:');
    if (network === 'testnet') {
      console.log(`https://hashscan.io/testnet/token/${tokenId?.toString()}`);
    } else {
      console.log(`https://hashscan.io/mainnet/token/${tokenId?.toString()}`);
    }

  } catch (error: any) {
    console.error('\n❌ Erreur lors de la création du token');
    console.error('Message:', error.message);
    
    if (error.status) {
      console.error('Status:', error.status.toString());
    }

    throw error;
  } finally {
    await client.close();
  }
}

// Exécuter
createKenePointToken()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script échoué:', error.message);
    process.exit(1);
  });

