/**
 * Types et interfaces pour Hedera Consensus Service (HCS)
 */

/**
 * Types d'événements HCS
 */
export enum HcsEventType {
  // Consultations
  CONSULTATION_CREATED = 'CONSULTATION_CREATED',
  CONSULTATION_UPDATED = 'CONSULTATION_UPDATED',
  CONSULTATION_DELETED = 'CONSULTATION_DELETED',
  
  // Prescriptions
  PRESCRIPTION_ISSUED = 'PRESCRIPTION_ISSUED',
  PRESCRIPTION_UPDATED = 'PRESCRIPTION_UPDATED',
  PRESCRIPTION_DELIVERED = 'PRESCRIPTION_DELIVERED',
  
  // Documents / Analyses
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  ANALYSIS_UPLOADED = 'ANALYSIS_UPLOADED',
  
  // DSE (Dossier de Santé Électronique)
  DSE_CREATED = 'DSE_CREATED',
  DSE_UPDATED = 'DSE_UPDATED',
  DSE_ACCESS_REQUESTED = 'DSE_ACCESS_REQUESTED',
  DSE_ACCESS_GRANTED = 'DSE_ACCESS_GRANTED',
  DSE_ACCESS_DENIED = 'DSE_ACCESS_DENIED',
  
  // Rendez-vous
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_ACCEPTED = 'APPOINTMENT_ACCEPTED',
  APPOINTMENT_REJECTED = 'APPOINTMENT_REJECTED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  
  // KènèPoints (HTS)
  POINTS_AWARDED = 'POINTS_AWARDED',
  POINTS_REDEEMED = 'POINTS_REDEEMED',
  POINTS_TRANSFERRED = 'POINTS_TRANSFERRED',
  
  // Admin
  USER_VERIFIED = 'USER_VERIFIED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  FACILITY_APPROVED = 'FACILITY_APPROVED',
  FACILITY_REJECTED = 'FACILITY_REJECTED',
  
  // Autres
  DATA_EXPORT_REQUESTED = 'DATA_EXPORT_REQUESTED',
  DATA_ANONYMIZED = 'DATA_ANONYMIZED',
}

/**
 * Types d'entités
 */
export enum HcsEntityType {
  CONSULTATION = 'consultation',
  PRESCRIPTION = 'prescription',
  DOCUMENT = 'document',
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  APPOINTMENT = 'appointment',
  DSE_ACCESS = 'dse_access',
  KENE_POINTS = 'kene_points',
  FACILITY = 'facility',
}

/**
 * Interface du message HCS standardisé
 */
export interface HcsMessage {
  /** Version du format de message (pour compatibilité future) */
  version: string;
  
  /** Type d'événement */
  eventType: HcsEventType;
  
  /** Timestamp Unix (millisecondes) */
  timestamp: number;
  
  /** ID de l'utilisateur qui a déclenché l'action */
  userId: number;
  
  /** Rôle de l'utilisateur */
  userRole: 'PATIENT' | 'MEDECIN' | 'ADMIN' | 'SUPERADMIN';
  
  /** Type d'entité concernée */
  entityType: HcsEntityType;
  
  /** ID de l'entité concernée */
  entityId: number;
  
  /** Hash SHA-256 des données sensibles (pas les données elles-mêmes) */
  dataHash: string;
  
  /** Métadonnées non sensibles (optionnel) */
  metadata?: {
    doctorId?: number;
    patientId?: number;
    appointmentId?: number;
    action?: string;
    reason?: string;
    amount?: number;
    facilityId?: number;
    [key: string]: any;
  };
  
  /** Signature HMAC du message (pour vérification d'intégrité) */
  signature?: string;
  
  /** Environnement (pour distinguer testnet/mainnet/dev) */
  environment?: 'development' | 'testnet' | 'mainnet';
}

/**
 * Interface du résultat après soumission HCS
 */
export interface HcsSubmissionResult {
  /** Succès ou échec */
  success: boolean;
  
  /** Transaction ID Hedera */
  transactionId?: string;
  
  /** Consensus timestamp */
  consensusTimestamp?: string;
  
  /** Hash du message soumis */
  messageHash?: string;
  
  /** Coût de la transaction en HBAR */
  cost?: number;
  
  /** Erreur si échec */
  error?: string;
  
  /** Nombre de tentatives */
  attempts?: number;
  
  /** Durée totale (ms) */
  duration?: number;
}

/**
 * Interface pour la vérification de message HCS
 */
export interface HcsVerificationResult {
  /** L'entité est-elle valide ? */
  isValid: boolean;
  
  /** Hash actuel des données */
  currentHash: string;
  
  /** Hash enregistré sur la blockchain */
  blockchainHash?: string;
  
  /** Transaction ID HCS */
  hcsTransactionId?: string;
  
  /** Consensus timestamp */
  consensusTimestamp?: string;
  
  /** Date de création de l'entité */
  createdAt: Date;
  
  /** Message d'erreur si invalide */
  error?: string;
}

/**
 * Interface pour les options de soumission HCS
 */
export interface HcsSubmitOptions {
  /** Priorité du job (1-10, 10 = haute priorité) */
  priority?: number;
  
  /** Délai avant exécution (ms) */
  delay?: number;
  
  /** Forcer la soumission même si existe dans le cache */
  forceSubmit?: boolean;
  
  /** Utiliser la queue ou soumission directe */
  useQueue?: boolean;
  
  /** Activer le retry */
  enableRetry?: boolean;
  
  /** Nombre maximum de tentatives */
  maxRetries?: number;
}

/**
 * Interface pour le batch de messages HCS
 */
export interface HcsBatchSubmission {
  /** Messages à soumettre */
  messages: HcsMessage[];
  
  /** Options communes */
  options?: HcsSubmitOptions;
}

/**
 * Interface pour les statistiques HCS
 */
export interface HcsStatistics {
  /** Nombre total de messages soumis */
  totalMessages: number;
  
  /** Nombre de messages par type d'événement */
  messagesByEventType: Record<string, number>;
  
  /** Nombre de messages par type d'entité */
  messagesByEntityType: Record<string, number>;
  
  /** Coût total en HBAR */
  totalCost: number;
  
  /** Nombre d'échecs */
  failures: number;
  
  /** Taux de succès (%) */
  successRate: number;
  
  /** Temps de réponse moyen (ms) */
  avgResponseTime: number;
  
  /** Dernière soumission */
  lastSubmission?: Date;
}

/**
 * Interface pour le listener HCS
 */
export interface HcsTopicMessage {
  /** Consensus timestamp */
  consensusTimestamp: Date;
  
  /** Message content (JSON) */
  message: HcsMessage;
  
  /** Sequence number */
  sequenceNumber: number;
  
  /** Topic ID */
  topicId: string;
}

/**
 * Type guard pour vérifier si un objet est un HcsMessage valide
 */
export function isValidHcsMessage(obj: any): obj is HcsMessage {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.version === 'string' &&
    typeof obj.eventType === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.userId === 'number' &&
    typeof obj.userRole === 'string' &&
    typeof obj.entityType === 'string' &&
    typeof obj.entityId === 'number' &&
    typeof obj.dataHash === 'string'
  );
}

