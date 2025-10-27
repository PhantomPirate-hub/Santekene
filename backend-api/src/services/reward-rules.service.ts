import { hederaHtsService, RewardData } from './hedera-hts.service.js';
import { prisma } from './prisma.service.js';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Types d'actions récompensables
 */
export enum RewardAction {
  CONSULTATION_COMPLETED = 'CONSULTATION_COMPLETED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DSE_SHARED = 'DSE_SHARED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  PRESCRIPTION_FOLLOWED = 'PRESCRIPTION_FOLLOWED',
  FIRST_LOGIN = 'FIRST_LOGIN',
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  REFERRAL_SUCCESS = 'REFERRAL_SUCCESS',
  FEEDBACK_PROVIDED = 'FEEDBACK_PROVIDED',
}

/**
 * Configuration des récompenses (montants en KNP)
 */
const REWARD_AMOUNTS: Record<RewardAction, number> = {
  [RewardAction.CONSULTATION_COMPLETED]: parseFloat(process.env.KNP_REWARD_CONSULTATION || '20'),
  [RewardAction.DOCUMENT_UPLOADED]: parseFloat(process.env.KNP_REWARD_DOCUMENT_UPLOAD || '5'),
  [RewardAction.DSE_SHARED]: parseFloat(process.env.KNP_REWARD_DSE_SHARE || '10'),
  [RewardAction.APPOINTMENT_COMPLETED]: parseFloat(process.env.KNP_REWARD_APPOINTMENT_COMPLETED || '15'),
  [RewardAction.PRESCRIPTION_FOLLOWED]: parseFloat(process.env.KNP_REWARD_PRESCRIPTION_FOLLOWED || '10'),
  [RewardAction.FIRST_LOGIN]: 50, // Bonus unique
  [RewardAction.PROFILE_COMPLETED]: 30, // Bonus unique
  [RewardAction.REFERRAL_SUCCESS]: 25, // Par parrainage
  [RewardAction.FEEDBACK_PROVIDED]: 5, // Par feedback
};

/**
 * Messages de récompense personnalisés
 */
const REWARD_MESSAGES: Record<RewardAction, string> = {
  [RewardAction.CONSULTATION_COMPLETED]: 'Récompense pour consultation complétée',
  [RewardAction.DOCUMENT_UPLOADED]: 'Récompense pour document médical uploadé',
  [RewardAction.DSE_SHARED]: 'Récompense pour partage de votre DSE',
  [RewardAction.APPOINTMENT_COMPLETED]: 'Récompense pour rendez-vous honoré',
  [RewardAction.PRESCRIPTION_FOLLOWED]: 'Récompense pour suivi de prescription',
  [RewardAction.FIRST_LOGIN]: 'Bonus de bienvenue',
  [RewardAction.PROFILE_COMPLETED]: 'Bonus pour profil complété',
  [RewardAction.REFERRAL_SUCCESS]: 'Récompense pour parrainage réussi',
  [RewardAction.FEEDBACK_PROVIDED]: 'Récompense pour feedback fourni',
};

/**
 * Service de gestion des règles de récompenses KenePoints
 */
class RewardRulesService {
  /**
   * Attribue une récompense à un utilisateur
   */
  async reward(
    userId: number,
    action: RewardAction,
    relatedEntityType?: string,
    relatedEntityId?: number,
    customMetadata?: Record<string, any>
  ): Promise<{ success: boolean; amount: number; message?: string }> {
    try {
      // Vérifier si l'action est déjà récompensée (éviter double récompense)
      const isDuplicate = await this.checkDuplicateReward(
        userId,
        action,
        relatedEntityType,
        relatedEntityId
      );

      if (isDuplicate) {
        console.warn(`⚠️  Tentative de double récompense: user ${userId}, action ${action}`);
        return {
          success: false,
          amount: 0,
          message: 'Cette action a déjà été récompensée',
        };
      }

      // Récupérer le montant de la récompense
      const amount = REWARD_AMOUNTS[action];
      const reason = REWARD_MESSAGES[action];

      if (!amount || amount <= 0) {
        console.warn(`⚠️  Montant de récompense invalide pour action ${action}`);
        return {
          success: false,
          amount: 0,
          message: 'Montant de récompense invalide',
        };
      }

      // Attribuer la récompense via HTS service
      const rewardData: RewardData = {
        userId,
        amount,
        reason,
        relatedEntityType,
        relatedEntityId,
        metadata: {
          action,
          timestamp: new Date().toISOString(),
          ...customMetadata,
        },
      };

      const result = await hederaHtsService.rewardUser(rewardData);

      if (result.success) {
        console.log(`🎁 Récompense attribuée: ${amount} KNP à user ${userId} pour ${action}`);
      }

      return {
        success: result.success,
        amount,
        message: result.error || reason,
      };
    } catch (error: any) {
      console.error(`❌ Erreur attribution récompense:`, error);
      return {
        success: false,
        amount: 0,
        message: error.message,
      };
    }
  }

  /**
   * Vérifie si une action a déjà été récompensée (éviter doublons)
   */
  private async checkDuplicateReward(
    userId: number,
    action: RewardAction,
    relatedEntityType?: string,
    relatedEntityId?: number
  ): Promise<boolean> {
    try {
      // Pour certaines actions uniques, vérifier si déjà récompensé
      if (action === RewardAction.FIRST_LOGIN || action === RewardAction.PROFILE_COMPLETED) {
        const wallet = await prisma.userWallet.findUnique({
          where: { userId },
          include: {
            transactions: {
              where: {
                reason: REWARD_MESSAGES[action],
                status: 'SUCCESS',
              },
              take: 1,
            },
          },
        });

        return wallet ? wallet.transactions.length > 0 : false;
      }

      // Pour les actions liées à une entité, vérifier si déjà récompensé pour cette entité
      if (relatedEntityType && relatedEntityId) {
        const wallet = await prisma.userWallet.findUnique({
          where: { userId },
          include: {
            transactions: {
              where: {
                relatedEntityType,
                relatedEntityId,
                status: 'SUCCESS',
              },
              take: 1,
            },
          },
        });

        return wallet ? wallet.transactions.length > 0 : false;
      }

      return false;
    } catch (error) {
      console.error('Erreur vérification duplicate reward:', error);
      return false; // En cas d'erreur, autoriser la récompense
    }
  }

  /**
   * Récompense automatique pour consultation complétée
   */
  async rewardConsultationCompleted(
    patientId: number,
    consultationId: number
  ): Promise<void> {
    await this.reward(
      patientId,
      RewardAction.CONSULTATION_COMPLETED,
      'CONSULTATION',
      consultationId
    );
  }

  /**
   * Récompense automatique pour document uploadé
   */
  async rewardDocumentUploaded(userId: number, documentId: number): Promise<void> {
    await this.reward(userId, RewardAction.DOCUMENT_UPLOADED, 'DOCUMENT', documentId);
  }

  /**
   * Récompense automatique pour DSE partagé
   */
  async rewardDseShared(patientId: number, accessRequestId: number): Promise<void> {
    await this.reward(
      patientId,
      RewardAction.DSE_SHARED,
      'DSE_ACCESS_REQUEST',
      accessRequestId
    );
  }

  /**
   * Récompense automatique pour RDV complété
   */
  async rewardAppointmentCompleted(
    patientId: number,
    appointmentId: number
  ): Promise<void> {
    await this.reward(
      patientId,
      RewardAction.APPOINTMENT_COMPLETED,
      'APPOINTMENT',
      appointmentId
    );
  }

  /**
   * Récompense automatique pour prescription suivie
   */
  async rewardPrescriptionFollowed(
    patientId: number,
    prescriptionId: number
  ): Promise<void> {
    await this.reward(
      patientId,
      RewardAction.PRESCRIPTION_FOLLOWED,
      'PRESCRIPTION',
      prescriptionId
    );
  }

  /**
   * Bonus de bienvenue (première connexion)
   */
  async rewardFirstLogin(userId: number): Promise<void> {
    await this.reward(userId, RewardAction.FIRST_LOGIN);
  }

  /**
   * Bonus pour profil complété
   */
  async rewardProfileCompleted(userId: number): Promise<void> {
    await this.reward(userId, RewardAction.PROFILE_COMPLETED);
  }

  /**
   * Obtenir les règles de récompenses (pour affichage)
   */
  getRewardRules(): Array<{
    action: string;
    amount: number;
    description: string;
  }> {
    return Object.entries(REWARD_AMOUNTS).map(([action, amount]) => ({
      action,
      amount,
      description: REWARD_MESSAGES[action as RewardAction],
    }));
  }

  /**
   * Obtenir le montant d'une récompense
   */
  getRewardAmount(action: RewardAction): number {
    return REWARD_AMOUNTS[action] || 0;
  }

  /**
   * Statistiques de récompenses par action
   */
  async getRewardStatsByAction(): Promise<
    Array<{
      action: string;
      count: number;
      totalAmount: number;
    }>
  > {
    try {
      // Grouper les transactions par metadata.action
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          type: 'REWARD',
          status: 'SUCCESS',
        },
        select: {
          amount: true,
          metadata: true,
        },
      });

      // Grouper manuellement par action
      const statsByAction: Record<
        string,
        { action: string; count: number; totalAmount: number }
      > = {};

      for (const tx of transactions) {
        let action = 'UNKNOWN';

        if (tx.metadata) {
          try {
            const metadata = JSON.parse(tx.metadata);
            action = metadata.action || 'UNKNOWN';
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        if (!statsByAction[action]) {
          statsByAction[action] = { action, count: 0, totalAmount: 0 };
        }

        statsByAction[action].count += 1;
        statsByAction[action].totalAmount += tx.amount;
      }

      return Object.values(statsByAction);
    } catch (error) {
      console.error('Erreur récupération stats récompenses:', error);
      return [];
    }
  }
}

// Export singleton
export const rewardRulesService = new RewardRulesService();

