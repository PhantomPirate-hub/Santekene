import {
  Client,
  TokenId,
  AccountId,
  PrivateKey,
  TransferTransaction,
  AccountBalanceQuery,
  TokenInfoQuery,
  Hbar,
  Status,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import { prisma } from './prisma.service.js';
import { hederaCacheService } from './hedera-cache.service.js';
import { hederaRetryService } from './hedera-retry.service.js';

dotenv.config();

/**
 * Interface pour une transaction de transfert HTS
 */
export interface HtsTransferData {
  fromUserId?: number; // Si undefined, c'est le treasury qui envoie
  toUserId: number;
  amount: number; // Montant en KNP (avec decimals: 10.50 = 1050 tinybars)
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Interface pour une récompense
 */
export interface RewardData {
  userId: number;
  amount: number;
  reason: string;
  relatedEntityType?: string; // CONSULTATION, DOCUMENT, etc.
  relatedEntityId?: number;
  metadata?: Record<string, any>;
}

/**
 * Service Hedera Token Service (HTS) pour gérer les KenePoints
 */
class HederaHtsService {
  private client: Client | null = null;
  private tokenId: TokenId | null = null;
  private treasuryId: AccountId | null = null;
  private treasuryKey: PrivateKey | null = null;
  private isConfigured = false;
  private decimals = 2; // KenePoint a 2 decimals

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialise le client Hedera et le token
   */
  private initializeClient(): void {
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    const tokenIdStr = process.env.HEDERA_TOKEN_ID;
    const network = process.env.HEDERA_NETWORK || 'testnet';

    if (!operatorId || !operatorKey || !tokenIdStr) {
      console.warn('⚠️  Hedera HTS non configuré (credentials ou token ID manquants)');
      return;
    }

    try {
      // Client
      if (network === 'testnet') {
        this.client = Client.forTestnet();
      } else if (network === 'mainnet') {
        this.client = Client.forMainnet();
      } else {
        throw new Error(`Réseau Hedera invalide: ${network}`);
      }

      this.client.setOperator(operatorId, operatorKey);

      // Token
      this.tokenId = TokenId.fromString(tokenIdStr);

      // Treasury (backend = treasury)
      this.treasuryId = AccountId.fromString(operatorId);
      this.treasuryKey = PrivateKey.fromString(operatorKey);

      this.isConfigured = true;

      console.log(`✅ Hedera HTS initialisé - Token: ${tokenIdStr}, Treasury: ${operatorId}`);
    } catch (error) {
      console.error('❌ Erreur initialisation Hedera HTS:', error);
    }
  }

  /**
   * Vérifie si HTS est disponible
   */
  isAvailable(): boolean {
    return this.isConfigured && this.client !== null && this.tokenId !== null;
  }

  /**
   * Convertit un montant KNP en tinybars (avec decimals)
   */
  private toTinybars(amount: number): number {
    return Math.round(amount * Math.pow(10, this.decimals));
  }

  /**
   * Convertit des tinybars en montant KNP
   */
  private fromTinybars(tinybars: number): number {
    return tinybars / Math.pow(10, this.decimals);
  }

  /**
   * Récompense un utilisateur (Treasury → User)
   */
  async rewardUser(data: RewardData): Promise<{
    success: boolean;
    txId?: string;
    amount: number;
    error?: string;
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        amount: data.amount,
        error: 'Hedera HTS non disponible',
      };
    }

    try {
      // Vérifier/Créer le wallet de l'utilisateur
      const wallet = await this.ensureUserWallet(data.userId);

      // Créer la transaction de transfert (Treasury → User)
      // NOTE: Dans une vraie implémentation HTS, l'utilisateur devrait avoir un compte Hedera associé.
      // Pour simplifier, on simule le transfert et on met à jour seulement la DB.
      // En production, il faudrait que chaque utilisateur ait un Account ID Hedera.

      // Mise à jour du wallet en DB
      const updatedWallet = await prisma.userWallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: data.amount,
          },
          totalEarned: {
            increment: data.amount,
          },
        },
      });

      // Enregistrer la transaction dans le wallet
      const walletTx = await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: data.amount,
          type: 'REWARD',
          reason: data.reason,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          status: 'SUCCESS',
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      });

      console.log(`✅ Récompense ${data.amount} KNP pour user ${data.userId}: ${data.reason}`);

      return {
        success: true,
        txId: `wallet-tx-${walletTx.id}`,
        amount: data.amount,
      };
    } catch (error: any) {
      console.error(`❌ Erreur récompense user ${data.userId}:`, error);

      return {
        success: false,
        amount: data.amount,
        error: error.message,
      };
    }
  }

  /**
   * Transfère des KNP entre deux utilisateurs
   */
  async transferBetweenUsers(data: HtsTransferData): Promise<{
    success: boolean;
    txId?: string;
    error?: string;
  }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Hedera HTS non disponible',
      };
    }

    if (!data.fromUserId) {
      return { success: false, error: 'fromUserId requis pour transfer' };
    }

    try {
      // Vérifier les wallets
      const fromWallet = await this.ensureUserWallet(data.fromUserId);
      const toWallet = await this.ensureUserWallet(data.toUserId);

      // Vérifier le solde
      if (fromWallet.balance < data.amount) {
        return {
          success: false,
          error: `Solde insuffisant: ${fromWallet.balance} KNP disponibles, ${data.amount} KNP requis`,
        };
      }

      // Effectuer le transfert en DB
      await prisma.$transaction(async (tx) => {
        // Débiter le sender
        await tx.userWallet.update({
          where: { id: fromWallet.id },
          data: {
            balance: {
              decrement: data.amount,
            },
            totalSpent: {
              increment: data.amount,
            },
          },
        });

        // Créditer le receiver
        await tx.userWallet.update({
          where: { id: toWallet.id },
          data: {
            balance: {
              increment: data.amount,
            },
            totalEarned: {
              increment: data.amount,
            },
          },
        });

        // Enregistrer les transactions
        await tx.walletTransaction.create({
          data: {
            walletId: fromWallet.id,
            amount: -data.amount,
            type: 'TRANSFER_SENT',
            reason: `Transfert à user ${data.toUserId}: ${data.reason}`,
            status: 'SUCCESS',
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: toWallet.id,
            amount: data.amount,
            type: 'TRANSFER_RECEIVED',
            reason: `Transfert de user ${data.fromUserId}: ${data.reason}`,
            status: 'SUCCESS',
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          },
        });
      });

      console.log(`✅ Transfert ${data.amount} KNP: user ${data.fromUserId} → user ${data.toUserId}`);

      return {
        success: true,
        txId: `transfer-${Date.now()}`,
      };
    } catch (error: any) {
      console.error(`❌ Erreur transfert:`, error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Dépenser des KNP (pour achats, services, etc.)
   */
  async spendTokens(
    userId: number,
    amount: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      const wallet = await this.ensureUserWallet(userId);

      // Vérifier le solde
      if (wallet.balance < amount) {
        return {
          success: false,
          error: `Solde insuffisant: ${wallet.balance} KNP disponibles, ${amount} KNP requis`,
        };
      }

      // Débiter le wallet
      const updatedWallet = await prisma.userWallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: amount,
          },
          totalSpent: {
            increment: amount,
          },
        },
      });

      // Enregistrer la transaction
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -amount,
          type: 'SPEND',
          reason,
          status: 'SUCCESS',
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      console.log(`✅ Dépense ${amount} KNP pour user ${userId}: ${reason}`);

      return {
        success: true,
        newBalance: updatedWallet.balance,
      };
    } catch (error: any) {
      console.error(`❌ Erreur dépense user ${userId}:`, error);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obtenir le solde d'un utilisateur
   */
  async getUserBalance(userId: number): Promise<{
    balance: number;
    totalEarned: number;
    totalSpent: number;
  }> {
    try {
      const wallet = await this.ensureUserWallet(userId);

      return {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent,
      };
    } catch (error) {
      console.error(`❌ Erreur récupération solde user ${userId}:`, error);

      return {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      };
    }
  }

  /**
   * Obtenir l'historique des transactions d'un utilisateur
   */
  async getUserTransactions(
    userId: number,
    limit = 50,
    offset = 0
  ): Promise<any[]> {
    try {
      const wallet = await prisma.userWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        return [];
      }

      const transactions = await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return transactions.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        reason: tx.reason,
        status: tx.status,
        createdAt: tx.createdAt,
        metadata: tx.metadata ? JSON.parse(tx.metadata) : null,
      }));
    } catch (error) {
      console.error(`❌ Erreur récupération transactions user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Assure qu'un wallet existe pour l'utilisateur
   */
  private async ensureUserWallet(userId: number) {
    let wallet = await prisma.userWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.userWallet.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        },
      });

      console.log(`✅ Wallet créé pour user ${userId}`);
    }

    return wallet;
  }

  /**
   * Obtenir les informations du token KenePoint
   */
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number;
    maxSupply: number;
    treasury: string;
  } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    // Vérifier le cache
    const cacheKey = `hts:tokeninfo:${this.tokenId!.toString()}`;
    const cached = await hederaCacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const query = new TokenInfoQuery().setTokenId(this.tokenId!);

      const retryResult = await hederaRetryService.executeWithRetry(async () => {
        return await query.execute(this.client!);
      }, undefined, 'HTS Token Info Query');

      if (!retryResult.success || !retryResult.data) {
        throw retryResult.error || new Error('Échec de la récupération des informations du token');
      }

      const tokenInfo = retryResult.data;

      const info = {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: this.fromTinybars(parseInt(tokenInfo.totalSupply.toString())),
        maxSupply: tokenInfo.maxSupply
          ? this.fromTinybars(parseInt(tokenInfo.maxSupply.toString()))
          : 0,
        treasury: tokenInfo.treasuryAccountId?.toString() || '',
      };

      // Mettre en cache (1 heure)
      await hederaCacheService.set(cacheKey, JSON.stringify(info), 3600);

      return info;
    } catch (error) {
      console.error('❌ Erreur récupération info token:', error);
      return null;
    }
  }

  /**
   * Obtenir des statistiques globales sur les KenePoints
   */
  async getGlobalStats(): Promise<{
    totalUsers: number;
    totalBalance: number;
    totalEarned: number;
    totalSpent: number;
    averageBalance: number;
  }> {
    try {
      const stats = await prisma.userWallet.aggregate({
        _count: { id: true },
        _sum: {
          balance: true,
          totalEarned: true,
          totalSpent: true,
        },
      });

      const totalUsers = stats._count.id;
      const totalBalance = stats._sum.balance || 0;
      const totalEarned = stats._sum.totalEarned || 0;
      const totalSpent = stats._sum.totalSpent || 0;
      const averageBalance = totalUsers > 0 ? totalBalance / totalUsers : 0;

      return {
        totalUsers,
        totalBalance,
        totalEarned,
        totalSpent,
        averageBalance,
      };
    } catch (error) {
      console.error('❌ Erreur récupération stats globales:', error);
      return {
        totalUsers: 0,
        totalBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
        averageBalance: 0,
      };
    }
  }

  /**
   * Obtenir le Top N des utilisateurs par balance
   */
  async getTopUsers(limit = 10): Promise<
    Array<{
      userId: number;
      userName: string;
      balance: number;
      totalEarned: number;
    }>
  > {
    try {
      const wallets = await prisma.userWallet.findMany({
        orderBy: { balance: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return wallets.map((wallet) => ({
        userId: wallet.userId,
        userName: wallet.user.name || 'Utilisateur',
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
      }));
    } catch (error) {
      console.error('❌ Erreur récupération top users:', error);
      return [];
    }
  }
}

// Export singleton
export const hederaHtsService = new HederaHtsService();

