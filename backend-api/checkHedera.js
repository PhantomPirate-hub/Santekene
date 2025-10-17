import { Client, AccountId, PrivateKey, AccountBalanceQuery } from "@hashgraph/sdk";
import dotenv from "dotenv";
dotenv.config({ path: './.env' });

async function checkAccount() {
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

    const balance = await new AccountBalanceQuery()
        .setAccountId(accountId)
        .execute(client);
        
    console.log('✅ Compte Hedera actif :', accountId);
    console.log('💰 Solde :', balance.hbars.toString());
  } catch (error) {
    console.error('❌ Erreur Hedera :', error.message);
    process.exit(1);
  }
  process.exit(0);
}

checkAccount();
