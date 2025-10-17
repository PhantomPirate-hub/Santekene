import { Client, TopicCreateTransaction, PrivateKey, AccountId, Hbar } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config({ path: './.env' });

async function main() {
  try {
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      console.error('❌ Configurez HEDERA_ACCOUNT_ID et HEDERA_PRIVATE_KEY dans .env');
      process.exit(1);
    }

    const client = Client.forName(process.env.HEDERA_NETWORK || 'testnet');
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    );

    const tx = await new TopicCreateTransaction()
      .setMaxTransactionFee(new Hbar(1)) // Frais de transaction maximum
      .execute(client);

    console.log("⏳ Création du topic en cours...");

    const receipt = await tx.getReceipt(client);
    const topicId = receipt.topicId;

    if (topicId) {
        console.log('🆕 Topic créé avec succès !');
        console.log('➡️  ID du Topic:', topicId.toString());
        console.log('\n📋 Veuillez ajouter la ligne suivante à votre fichier .env:');
        console.log(`HEDERA_HCS_TOPIC_ID=${topicId.toString()}`);
    } else {
        console.error("❌ La création du topic a échoué, aucun ID de topic n'a été retourné.");
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création du topic:', error);
    process.exit(1);
  }
  process.exit(0);
}

main();
