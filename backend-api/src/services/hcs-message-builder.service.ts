import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import {
  HcsMessage,
  HcsEventType,
  HcsEntityType,
} from '../types/hedera-hcs.types.js';

dotenv.config();

/**
 * Builder pour créer des messages HCS standardisés
 * Utilise le pattern Factory pour simplifier la création de messages
 */
class HcsMessageBuilder {
  private message: Partial<HcsMessage> = {};
  private readonly version = '1.0';
  private readonly environment = (process.env.NODE_ENV || 'development') as 'development' | 'testnet' | 'mainnet';
  private readonly hmacSecret = process.env.HCS_HMAC_SECRET || 'default-secret-change-me';

  constructor() {
    // Initialiser avec des valeurs par défaut
    this.message = {
      version: this.version,
      timestamp: Date.now(),
      environment: this.environment,
    };
  }

  /**
   * Définit le type d'événement
   */
  setEventType(eventType: HcsEventType): this {
    this.message.eventType = eventType;
    return this;
  }

  /**
   * Définit l'utilisateur
   */
  setUser(userId: number, userRole: 'PATIENT' | 'MEDECIN' | 'ADMIN' | 'SUPERADMIN'): this {
    this.message.userId = userId;
    this.message.userRole = userRole;
    return this;
  }

  /**
   * Définit l'entité concernée
   */
  setEntity(entityType: HcsEntityType, entityId: number): this {
    this.message.entityType = entityType;
    this.message.entityId = entityId;
    return this;
  }

  /**
   * Définit le hash des données
   */
  setDataHash(data: any): this {
    this.message.dataHash = this.generateHash(data);
    return this;
  }

  /**
   * Définit le hash directement (si déjà calculé)
   */
  setDirectHash(hash: string): this {
    this.message.dataHash = hash;
    return this;
  }

  /**
   * Ajoute des métadonnées
   */
  setMetadata(metadata: Record<string, any>): this {
    this.message.metadata = { ...this.message.metadata, ...metadata };
    return this;
  }

  /**
   * Ajoute une métadonnée spécifique
   */
  addMetadata(key: string, value: any): this {
    if (!this.message.metadata) {
      this.message.metadata = {};
    }
    this.message.metadata[key] = value;
    return this;
  }

  /**
   * Génère un hash SHA-256 à partir de données
   */
  private generateHash(data: any): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Génère une signature HMAC pour le message
   */
  private generateSignature(message: Partial<HcsMessage>): string {
    // Créer une représentation canonique du message (sans la signature)
    const { signature, ...messageWithoutSignature } = message as any;
    const canonicalMessage = JSON.stringify(messageWithoutSignature, Object.keys(messageWithoutSignature).sort());
    
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(canonicalMessage)
      .digest('hex');
  }

  /**
   * Valide le message avant de le construire
   */
  private validate(): void {
    const required = ['eventType', 'userId', 'userRole', 'entityType', 'entityId', 'dataHash'];
    const missing = required.filter(field => !this.message[field as keyof HcsMessage]);
    
    if (missing.length > 0) {
      throw new Error(`Champs requis manquants pour le message HCS: ${missing.join(', ')}`);
    }
  }

  /**
   * Construit le message final avec signature
   */
  build(): HcsMessage {
    this.validate();
    
    // Générer la signature
    this.message.signature = this.generateSignature(this.message);
    
    return this.message as HcsMessage;
  }

  /**
   * Construit et retourne le message en JSON string
   */
  buildAsString(): string {
    return JSON.stringify(this.build());
  }

  /**
   * Réinitialise le builder pour créer un nouveau message
   */
  reset(): this {
    this.message = {
      version: this.version,
      timestamp: Date.now(),
      environment: this.environment,
    };
    return this;
  }

  // ==================== MÉTHODES FACTORY ====================

  /**
   * Crée un message pour une consultation créée
   */
  static forConsultationCreated(
    userId: number,
    userRole: 'MEDECIN',
    consultationId: number,
    consultationData: any,
    patientId: number,
    doctorId: number
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.CONSULTATION_CREATED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.CONSULTATION, consultationId)
      .setDataHash(consultationData)
      .setMetadata({ patientId, doctorId })
      .build();
  }

  /**
   * Crée un message pour une consultation modifiée
   */
  static forConsultationUpdated(
    userId: number,
    userRole: 'MEDECIN',
    consultationId: number,
    consultationData: any,
    patientId: number,
    doctorId: number
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.CONSULTATION_UPDATED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.CONSULTATION, consultationId)
      .setDataHash(consultationData)
      .setMetadata({ patientId, doctorId })
      .build();
  }

  /**
   * Crée un message pour une prescription émise
   */
  static forPrescriptionIssued(
    userId: number,
    userRole: 'MEDECIN',
    prescriptionId: number,
    prescriptionData: any,
    patientId: number,
    consultationId: number
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.PRESCRIPTION_ISSUED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.PRESCRIPTION, prescriptionId)
      .setDataHash(prescriptionData)
      .setMetadata({ patientId, consultationId })
      .build();
  }

  /**
   * Crée un message pour un document uploadé
   */
  static forDocumentUploaded(
    userId: number,
    userRole: 'PATIENT' | 'MEDECIN',
    documentId: number,
    documentHash: string,
    patientId: number,
    documentType: string
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.DOCUMENT_UPLOADED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.DOCUMENT, documentId)
      .setDirectHash(documentHash)
      .setMetadata({ patientId, documentType })
      .build();
  }

  /**
   * Crée un message pour un accès DSE demandé
   */
  static forDseAccessRequested(
    userId: number,
    userRole: 'MEDECIN',
    requestId: number,
    patientId: number,
    reason: string
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.DSE_ACCESS_REQUESTED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.DSE_ACCESS, requestId)
      .setDataHash({ requestId, patientId, reason })
      .setMetadata({ patientId, reason })
      .build();
  }

  /**
   * Crée un message pour un accès DSE accordé
   */
  static forDseAccessGranted(
    userId: number,
    userRole: 'PATIENT',
    requestId: number,
    doctorId: number,
    patientId: number
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.DSE_ACCESS_GRANTED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.DSE_ACCESS, requestId)
      .setDataHash({ requestId, doctorId, patientId })
      .setMetadata({ doctorId, patientId })
      .build();
  }

  /**
   * Crée un message pour un rendez-vous créé
   */
  static forAppointmentCreated(
    userId: number,
    userRole: 'PATIENT',
    appointmentId: number,
    appointmentData: any,
    doctorId: number,
    patientId: number
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.APPOINTMENT_CREATED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.APPOINTMENT, appointmentId)
      .setDataHash(appointmentData)
      .setMetadata({ doctorId, patientId })
      .build();
  }

  /**
   * Crée un message pour un rendez-vous accepté
   */
  static forAppointmentAccepted(
    userId: number,
    userRole: 'MEDECIN',
    appointmentId: number,
    appointmentData: any,
    patientId: number
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.APPOINTMENT_ACCEPTED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.APPOINTMENT, appointmentId)
      .setDataHash(appointmentData)
      .setMetadata({ patientId })
      .build();
  }

  /**
   * Crée un message pour des points KènèPoints attribués
   */
  static forPointsAwarded(
    userId: number,
    userRole: 'PATIENT',
    amount: number,
    reason: string
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.POINTS_AWARDED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.KENE_POINTS, userId)
      .setDataHash({ userId, amount, reason, timestamp: Date.now() })
      .setMetadata({ amount, reason })
      .build();
  }

  /**
   * Crée un message pour une structure approuvée
   */
  static forFacilityApproved(
    userId: number,
    userRole: 'SUPERADMIN',
    facilityId: number,
    facilityData: any
  ): HcsMessage {
    return new HcsMessageBuilder()
      .setEventType(HcsEventType.FACILITY_APPROVED)
      .setUser(userId, userRole)
      .setEntity(HcsEntityType.FACILITY, facilityId)
      .setDataHash(facilityData)
      .setMetadata({ facilityId })
      .build();
  }

  /**
   * Vérifie la signature d'un message HCS
   */
  static verifySignature(message: HcsMessage): boolean {
    try {
      const { signature, ...messageWithoutSignature } = message;
      const canonicalMessage = JSON.stringify(
        messageWithoutSignature,
        Object.keys(messageWithoutSignature).sort()
      );
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.HCS_HMAC_SECRET || 'default-secret-change-me')
        .update(canonicalMessage)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Erreur lors de la vérification de la signature:', error);
      return false;
    }
  }
}

// Export de la classe et des méthodes statiques
export { HcsMessageBuilder };
export const hcsMessageBuilder = new HcsMessageBuilder();

