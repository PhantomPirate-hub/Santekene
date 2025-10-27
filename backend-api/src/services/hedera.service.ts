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
const encryptionKey = process.env.AES_ENCRYPTION_KEY;

// Vérifier si Hedera est configuré
const isHederaConfigured = accountIdStr && privateKeyStr && topicIdStr;

let client: Client | null = null;
let accountId: AccountId | null = null;
let privateKey: PrivateKey | null = null;
let topicId: TopicId | null = null;

if (isHederaConfigured) {
  try {
    accountId = AccountId.fromString(accountIdStr!);
    privateKey = PrivateKey.fromString(privateKeyStr!);
    topicId = TopicId.fromString(topicIdStr!);
    
    client = Client.forName(process.env.HEDERA_NETWORK || 'testnet');
    client.setOperator(accountId, privateKey);
  } catch (error) {
    console.warn('⚠️  Erreur lors de la configuration Hedera:', error);
  }
} else {
  console.warn('⚠️  Hedera non configuré. Les fonctionnalités blockchain seront désactivées.');
}

// --- Fonctions utilitaires pour le chiffrement ---
if (!encryptionKey) {
  console.warn('⚠️  AES_ENCRYPTION_KEY non définie. Les fonctionnalités de chiffrement seront limitées.');
}

function encrypt(data: Buffer): string {
  if (!encryptionKey) {
    throw new Error('Clé de chiffrement non configurée');
  }
  return CryptoJS.AES.encrypt(data.toString('base64'), encryptionKey).toString();
}

function decrypt(encryptedData: string): Buffer {
  if (!encryptionKey) {
    throw new Error('Clé de chiffrement non configurée');
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
  return Buffer.from(bytes.toString(CryptoJS.enc.Base64), 'base64');
}

class HederaService {
  /**
   * Soumet un message au topic HCS configuré.
   */
  async submitToHCS(message: string): Promise<string> {
    if (!client || !topicId) {
      throw new Error('Hedera n\'est pas configuré. Veuillez configurer les variables d\'environnement Hedera.');
    }
    
    try {
      const tx = await new TopicMessageSubmitTransaction({
        topicId: topicId,
        message: message,
      }).execute(client);

      const receipt = await tx.getReceipt(client);
      const transactionId = tx.transactionId.toString();
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
    if (!client) {
      throw new Error('Hedera n\'est pas configuré. Veuillez configurer les variables d\'environnement Hedera.');
    }
    
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
    if (!client || !accountId || !privateKey) {
      throw new Error('Hedera n\'est pas configuré. Veuillez configurer les variables d\'environnement Hedera.');
    }
    
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

const hederaServiceInstance = new HederaService();

// Exporter les fonctions individuelles pour une utilisation plus simple
export const submitMessageToHcs = (message: string) => hederaServiceInstance.submitToHCS(message);
export const uploadFileToHfs = (fileContent: Buffer) => hederaServiceInstance.uploadToHFS(fileContent);
export const createFungibleToken = (tokenName: string, tokenSymbol: string, initialSupply?: number) => 
  hederaServiceInstance.createFungibleToken(tokenName, tokenSymbol);

export const hederaService = hederaServiceInstance;