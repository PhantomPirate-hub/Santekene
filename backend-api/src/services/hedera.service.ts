import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
  TopicId,
  FileCreateTransaction,
  TokenCreateTransaction,
  Hbar,
  AccountId,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import * as CryptoJS from 'crypto-js';

dotenv.config();

// Configuration du client Hedera à partir des variables d'environnement
const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;
const topicIdStr = process.env.HEDERA_HCS_TOPIC_ID;

if (!accountIdStr || !privateKeyStr || !topicIdStr) {
  throw new Error('Les variables d\'environnement Hedera (HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, HEDERA_HCS_TOPIC_ID) doivent être définies.');
}

const accountId = AccountId.fromString(accountIdStr);
const privateKey = PrivateKey.fromString(privateKeyStr);
const topicId = TopicId.fromString(topicIdStr);

const client = Client.forName(process.env.HEDERA_NETWORK || 'testnet');
client.setOperator(accountId, privateKey);

// --- Fonctions utilitaires pour le chiffrement ---
const encryptionKey = process.env.AES_ENCRYPTION_KEY;
if (!encryptionKey) {
  throw new Error('La variable d\'environnement AES_ENCRYPTION_KEY doit être définie.');
}

function encrypt(data: Buffer): string {
  return CryptoJS.AES.encrypt(data.toString('base64'), encryptionKey).toString();
}

function decrypt(encryptedData: string): Buffer {
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  return Buffer.from(bytes.toString(CryptoJS.enc.Base64), 'base64');
}

class HederaService {
  /**
   * Soumet un message au topic HCS configuré.
   */
  async submitToHCS(message: string): Promise<string> {
    try {
      const tx = await new TopicMessageSubmitTransaction({
        topicId: topicId,
        message: message,
      }).execute(client);

      const receipt = await tx.getReceipt(client);
      const transactionId = tx.transactionId.toString();

      console.log(`Message soumis avec succès au topic ${topicId}. Transaction ID: ${transactionId}`);
      return transactionId;
    } catch (error) {
      console.error("Erreur lors de la soumission du message à HCS:", error);
      throw new Error('Impossible de soumettre le message à Hedera Consensus Service.');
    }
  }

  /**
   * Chiffre et upload un fichier sur Hedera File Service.
   * @param fileContent Buffer du fichier.
   * @returns L'ID du fichier sur HFS.
   */
  async uploadToHFS(fileContent: Buffer): Promise<string> {
    try {
      const encryptedContent = encrypt(fileContent);
      
      const tx = await new FileCreateTransaction()
        .setKeys([client.operatorPublicKey!]) // Seul le propriétaire peut modifier/supprimer
        .setContents(encryptedContent)
        .setMaxTransactionFee(new Hbar(5)) // Frais maximum pour la création
        .freezeWith(client);

      const submitTx = await tx.execute(client);
      const receipt = await submitTx.getReceipt(client);
      const fileId = receipt.fileId;

      if (!fileId) {
        throw new Error("La création du fichier a échoué, aucun ID de fichier n'a été retourné.");
      }

      console.log(`Fichier uploadé avec succès sur HFS. File ID: ${fileId.toString()}`);
      return fileId.toString();

    } catch (error) {
      console.error("Erreur lors de l'upload sur HFS:", error);
      throw new Error('Impossible d\'uploader le fichier sur Hedera File Service.');
    }
  }

  // TODO: Implémenter les fonctions pour HTS (minting)
  /**
   * Crée un nouveau token fongible (comme KènèPoints).
   * @param tokenName Nom du token.
   * @param tokenSymbol Symbole du token.
   * @returns L'ID du nouveau token.
   */
  async createFungibleToken(tokenName: string, tokenSymbol: string): Promise<string> {
    try {
      const tx = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setDecimals(0) // Pour des points, pas de décimales
        .setInitialSupply(1000000) // Offre initiale
        .setTreasuryAccountId(accountId)
        .setAdminKey(client.operatorPublicKey!)
        .setFreezeKey(client.operatorPublicKey!)
        .setWipeKey(client.operatorPublicKey!)
        .setSupplyKey(client.operatorPublicKey!)
        .setMaxTransactionFee(new Hbar(30)) // Frais élevés pour la création de token
        .freezeWith(client);

      const signTx = await tx.sign(privateKey);
      const submitTx = await signTx.execute(client);
      const receipt = await submitTx.getReceipt(client);
      const tokenId = receipt.tokenId;

      if (!tokenId) {
        throw new Error("La création du token a échoué.");
      }

      console.log(`Token fongible créé avec succès. Token ID: ${tokenId.toString()}`);
      return tokenId.toString();

    } catch (error) {
      console.error("Erreur lors de la création du token fongible:", error);
      throw new Error('Impossible de créer le token sur Hedera Token Service.');
    }
  }
}

export const hederaService = new HederaService();