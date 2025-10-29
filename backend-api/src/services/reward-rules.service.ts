import { hederaHtsService, RewardData } from './hedera-hts.service.js';
import { hederaHcsService } from './hedera-hcs.service.js';
import { HcsMessageBuilder } from './hcs-message-builder.service.js';
import { HcsEventType, HcsEntityType } from '../types/hedera-hcs.types.js';
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
 * Modèle "Gain uniquement" - Personne ne dépense, tout le monde gagne
 */
const REWARD_AMOUNTS: Record<RewardAction, number> = {
  [RewardAction.CONSULTATION_COMPLETED]: 150, // Médecin gagne
  [RewardAction.DOCUMENT_UPLOADED]: 20, // Médecin gagne
  [RewardAction.DSE_SHARED]: 150, // Patient gagne
  [RewardAction.APPOINTMENT_COMPLETED]: 100, // Patient gagne (RDV honoré - si consultation créée le jour du RDV ou après)
  [RewardAction.PRESCRIPTION_FOLLOWED]: 25, // Patient gagne
  [RewardAction.FIRST_LOGIN]: 0, // Désactivé - pas de bonus à la création
  [RewardAction.PROFILE_COMPLETED]: 200, // Patient gagne (groupe sanguin + date naissance + localité + taille)
  [RewardAction.REFERRAL_SUCCESS]: 400, // Parrainage
  [RewardAction.FEEDBACK_PROVIDED]: 40, // Avis détaillé
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

        // ✅ Envoyer événement HCS pour traçabilité des KenePoints
        try {
          if (hederaHcsService.isAvailable()) {
            // Récupérer le rôle de l'utilisateur
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { role: true },
            });

            const hcsMessage = new HcsMessageBuilder()
              .setEventType(HcsEventType.POINTS_AWARDED)
              .setEntity(HcsEntityType.KENE_POINTS, userId)
              .setUser(userId, user?.role || 'PATIENT')
              .setDataHash({
                userId,
                amount,
                action,
                reason,
                relatedEntityType,
                relatedEntityId,
                timestamp: new Date().toISOString(),
              })
              .addMetadata('amount', amount)
              .addMetadata('action', action)
              .addMetadata('reason', reason)
              .build();

            await hederaHcsService.submit(hcsMessage, { priority: 6 });
          }
        } catch (hcsError) {
          console.error('Erreur lors de l\'envoi HCS (points awarded):', hcsError);
        }
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
   * Bonus pour profil patient complété
   * Vérifie si le patient a renseigné : groupe sanguin + date naissance + localité + taille
   */
  async rewardProfileCompleted(userId: number): Promise<void> {
    // Vérifier si c'est un patient
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true },
    });

    if (!user || user.role !== 'PATIENT' || !user.patient) {
      return;
    }

    // Vérifier que le profil est bien complété
    const { bloodGroup, birthDate, location, height } = user.patient;
    const isComplete = bloodGroup && birthDate && location && height;

    if (!isComplete) {
      return;
    }

    // Attribuer la récompense (une seule fois)
    await this.reward(userId, RewardAction.PROFILE_COMPLETED);
  }

  /**
   * Vérifier si RDV honoré et récompenser le patient
   * Un RDV est honoré si la consultation est créée le jour du RDV ou après
   */
  async rewardAppointmentHonored(
    patientId: number,
    appointmentId: number,
    consultationDate: Date
  ): Promise<void> {
    // Récupérer le RDV
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return;
    }

    // Vérifier si la consultation est créée le jour du RDV ou après
    const appointmentDate = new Date(appointment.date);
    appointmentDate.setHours(0, 0, 0, 0);
    
    const consultDate = new Date(consultationDate);
    consultDate.setHours(0, 0, 0, 0);

    if (consultDate >= appointmentDate) {
      // RDV honoré ! Récompenser le patient
      await this.reward(
        patientId,
        RewardAction.APPOINTMENT_COMPLETED,
        'Appointment',
        appointmentId
      );
    }
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

