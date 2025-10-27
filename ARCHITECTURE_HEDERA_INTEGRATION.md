# 🏗️ Architecture d'Intégration Hedera - Santé Kènè

## 📋 Table des Matières
1. [Analyse de l'Existant](#analyse-existant)
2. [Architecture Proposée](#architecture-proposee)
3. [Points d'Amélioration Identifiés](#points-amelioration)
4. [Roadmap d'Implémentation](#roadmap)
5. [Estimation des Coûts](#estimation-couts)

---

## 🔍 1. Analyse de l'Existant {#analyse-existant}

### ✅ Ce qui existe déjà :

#### **A. Base de données (Prisma)**
- ✅ Table `HederaTransaction` complète
- ✅ Enum `HederaTransactionType` (HCS, HFS, HTS)
- ✅ Champs `blockchainTxId` dans `Consultation`, `Prescription`
- ✅ Table `AuditLog` avec champ `hcsTxId`
- ✅ Table `KenePoints` pour le système de récompense

#### **B. Services Backend**
- ✅ `hedera.service.ts` : Fonctions de base
  - `submitToHCS()` : Envoi de messages HCS
  - `uploadToHFS()` : Upload de fichiers (avec chiffrement AES)
  - `createFungibleToken()` : Création de tokens HTS
- ✅ `hedera.controller.ts` : Endpoints API basiques
- ✅ Configuration client Hedera (testnet/mainnet)

#### **C. Frontend**
- ✅ `HashConnectContext.tsx` : Intégration HashConnect (wallets)
- ✅ Champs `walletAddress` dans `User`

---

### ⚠️ Ce qui manque ou est incomplet :

#### **A. HCS (Hedera Consensus Service)**
- ❌ Pas d'intégration automatique dans les workflows métier
- ❌ Pas de structure standardisée pour les messages
- ❌ Pas de mécanisme de vérification des messages
- ❌ Pas de listener pour recevoir les messages du topic

#### **B. HFS (Hedera File Service)**
- ❌ Pas de méthode pour télécharger les fichiers
- ❌ Pas de gestion des fichiers volumineux (chunking)
- ❌ Stockage local des fichiers pas clair (MinIO? S3? Local?)
- ❌ Pas de système de versioning

#### **C. HTS (Hedera Token Service)**
- ❌ Pas de fonction de transfert de tokens (KènèPoints)
- ❌ Pas de synchronisation automatique avec `user_wallets`
- ❌ Pas de système d'association automatique (associate)
- ❌ Pas de règles d'attribution des points (gamification)
- ❌ Pas de fonction de mint/burn dynamique

#### **D. Architecture Générale**
- ❌ Pas de gestion d'erreur robuste (retry, fallback)
- ❌ Pas de système de queue pour les transactions Hedera
- ❌ Pas de monitoring des coûts en HBAR
- ❌ Pas de cache pour éviter les doublons
- ❌ Pas de dashboard admin pour Hedera

---

## 🏛️ 2. Architecture Proposée {#architecture-proposee}

### 🎯 Principes de Conception

1. **Un seul compte opérateur** (backend-managed)
   - Le backend est le seul à interagir avec Hedera
   - Les utilisateurs n'ont **pas** de comptes Hedera
   - Les wallets sont optionnels (pour les utilisateurs avancés)

2. **Traçabilité immuable**
   - Toutes les actions critiques → HCS
   - Tous les documents sensibles → HFS (hash seulement)
   - Toutes les récompenses → HTS + MySQL sync

3. **Performance et coût**
   - Batch transactions pour économiser les frais
   - Cache local pour éviter les doublons
   - Queue asynchrone pour ne pas bloquer l'UX

4. **Résilience**
   - Fallback gracieux si Hedera indisponible
   - Retry automatique avec backoff exponentiel
   - Logs détaillés pour le debugging

---

### 📊 Architecture en Couches

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  • Pas d'interaction directe avec Hedera                    │
│  • (Optionnel) HashConnect pour wallets externes            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  API LAYER (Express)                        │
│  • Routes authentifiées                                     │
│  • Validation des données                                   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               BUSINESS LOGIC LAYER                          │
│  • Controllers (consultation, prescription, etc.)           │
│  • Appel des services Hedera après les actions métier       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              HEDERA ORCHESTRATOR LAYER (NOUVEAU)            │
│  • HederaQueueService (BullMQ / Redis)                      │
│  • HederaCacheService (Redis)                               │
│  • HederaRetryService (Retry logic)                         │
│  • HederaMonitoringService (Coûts, métriques)              │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            HEDERA SERVICES LAYER (Amélioré)                 │
│  ┌─────────────┬─────────────┬─────────────┐               │
│  │   HCS       │    HFS      │    HTS      │               │
│  │ Service     │  Service    │  Service    │               │
│  └─────────────┴─────────────┴─────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  HEDERA NETWORK                             │
│  • Testnet / Mainnet                                        │
│  • Topics, Files, Tokens                                    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE SYNC (Prisma + MySQL)                 │
│  • HederaTransaction (journal de toutes les tx)             │
│  • AuditLog (lien avec HCS)                                 │
│  • UserWallet (solde KènèPoints sync avec HTS)             │
│  • Consultation, Prescription (blockchainTxId)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 3. Points d'Amélioration Identifiés {#points-amelioration}

### 🚀 **Améliorations Critiques** (Priorité 1)

#### **A. HCS - Système de Messages Structurés**

**Problème actuel** : Messages textuels non standardisés

**Solution proposée** : Format JSON standardisé avec signature

```typescript
interface HcsMessage {
  version: string;           // "1.0"
  eventType: string;         // "CONSULTATION_CREATED", "PRESCRIPTION_ISSUED", etc.
  timestamp: number;         // Unix timestamp
  userId: number;            // ID utilisateur
  entityType: string;        // "consultation", "prescription", "dse_access"
  entityId: number;          // ID de l'entité
  dataHash: string;          // SHA-256 hash des données sensibles
  metadata?: {               // Métadonnées non sensibles
    doctorId?: number;
    patientId?: number;
    action?: string;
  };
  signature?: string;        // Signature HMAC pour vérification
}
```

**Avantages** :
- ✅ Messages standardisés et faciles à parser
- ✅ Traçabilité complète (qui, quoi, quand)
- ✅ Vérifiable (signature HMAC)
- ✅ Pas de données sensibles (seulement hash)

---

#### **B. HFS - Système Hybride (Hash on-chain, File off-chain)**

**Problème actuel** : Upload direct sur HFS coûteux et limité (5 KB)

**Solution proposée** : Stockage hybride

```
1. Fichier original → Stockage local/cloud (MinIO, S3)
2. Hash SHA-256 → Hedera File Service (preuve d'existence)
3. Lien: MySQL (url) ← → HFS (fileId + hash)
```

**Workflow** :
```typescript
// Upload d'un document médical
1. Stocker le fichier sur MinIO/S3 → obtenir URL
2. Calculer SHA-256 du fichier
3. Créer un "certificat" sur HFS avec le hash
4. Enregistrer dans MySQL:
   - url: "minio://bucket/file.pdf"
   - hfsFileId: "0.0.12345"
   - hash: "abc123..."
```

**Avantages** :
- ✅ Fichiers volumineux supportés (analyses, IRM, etc.)
- ✅ Coûts Hedera réduits (~0.001 HBAR vs ~1 HBAR)
- ✅ Vérifiable à tout moment (hash matching)
- ✅ Conforme RGPD (données en local)

---

#### **C. HTS - Système de KènèPoints Gamifié**

**Problème actuel** : Pas de règles d'attribution automatique

**Solution proposée** : Système de récompenses automatisé

**Règles d'attribution des KènèPoints** :

| Action                          | Points | Description                          |
|---------------------------------|--------|--------------------------------------|
| Inscription complète            | 100    | Profil complet + vérification email  |
| Première consultation           | 50     | Encourager l'utilisation du DSE      |
| Mise à jour DSE                 | 20     | Maintenir son profil à jour          |
| Rendez-vous honoré              | 30     | Réduire les no-shows                 |
| Partage de données anonymisées  | 100    | Recherche médicale                   |
| Parrainage réussi               | 200    | Acquisition d'utilisateurs           |
| Feedback après consultation     | 15     | Améliorer la qualité de service      |
| Participation communauté        | 10     | Poster/commenter dans le forum       |

**Workflow technique** :
```typescript
1. Action métier réussie (ex: consultation créée)
2. Trigger automatique → HederaTokenService.awardPoints()
3. Backend mint tokens (compte opérateur → virtual wallet user)
4. Sync MySQL: UPDATE user_wallets SET balance = balance + points
5. Notification utilisateur (push/email)
6. Enregistrement HederaTransaction + AuditLog
```

**Mécanismes de dépense** :
- 🎁 Réductions consultations premium
- 📋 Accès analyses IA avancées
- 🎁 Cadeaux/vouchers partenaires
- 💰 Conversion en dons (ONG santé)

---

#### **D. Queue System - Transactions Asynchrones**

**Problème actuel** : Transactions Hedera bloquantes (2-5 secondes)

**Solution proposée** : BullMQ + Redis pour queue asynchrone

```typescript
// Exemple : Création de consultation
async createConsultation(data) {
  // 1. Créer la consultation en DB (instantané)
  const consultation = await prisma.consultation.create({ data });
  
  // 2. Envoyer à la queue Hedera (non-bloquant)
  await hederaQueue.add('hcs-message', {
    eventType: 'CONSULTATION_CREATED',
    entityId: consultation.id,
    dataHash: hashData(consultation),
  });
  
  // 3. Retourner immédiatement au frontend
  return consultation;
}

// Worker traite la queue en arrière-plan
hederaQueue.process('hcs-message', async (job) => {
  const txId = await hederaService.submitToHCS(job.data);
  await prisma.consultation.update({
    where: { id: job.data.entityId },
    data: { blockchainTxId: txId },
  });
});
```

**Avantages** :
- ✅ UX ultra-rapide (pas de latence Hedera)
- ✅ Retry automatique en cas d'échec
- ✅ Batch processing pour économiser les frais
- ✅ Monitoring et observabilité

---

#### **E. Monitoring & Dashboard Admin**

**Nouvelle fonctionnalité** : Dashboard Hedera pour SuperAdmin

**Métriques à suivre** :
- 💰 **Coûts** : Dépenses HBAR par jour/mois
- 📊 **Volume** : Nombre de transactions HCS/HFS/HTS
- ⚡ **Performance** : Temps de confirmation moyen
- ❌ **Erreurs** : Taux d'échec, retry réussis
- 🏆 **KènèPoints** : Distribution, top utilisateurs

**Interface** :
```typescript
/dashboard/superadmin/hedera
  ├── Overview (métriques globales)
  ├── Transactions (liste filtrée par type)
  ├── KènèPoints Analytics (distribution, leaderboard)
  ├── Costs (graphiques de dépenses HBAR)
  └── Health (status Hedera network)
```

---

### 🎨 **Améliorations Secondaires** (Priorité 2)

#### **F. Vérification de l'Intégrité des Données**

**Endpoint public** : `/api/verify/:entityType/:entityId`

Permet de vérifier qu'une consultation/prescription n'a pas été modifiée :
```typescript
GET /api/verify/consultation/123

Response:
{
  "entity": "consultation",
  "entityId": 123,
  "createdAt": "2025-01-15T10:30:00Z",
  "hcsTransactionId": "0.0.1234@1234567890.123",
  "currentHash": "abc123...",
  "blockchainHash": "abc123...",
  "isValid": true,
  "consensusTimestamp": "2025-01-15T10:30:05Z"
}
```

---

#### **G. Export de Données Certifiées**

Générer un **certificat blockchain** pour un DSE complet :

```typescript
POST /api/patients/:id/dse/certify

Génère un PDF avec:
- Toutes les consultations
- Tous les documents
- Hash global du DSE
- Transaction ID HCS
- QR code pour vérification publique
```

---

## 📅 4. Roadmap d'Implémentation {#roadmap}

### **Phase 1 : Fondations (Semaine 1-2)** ⏱️ 10-15h

#### Sprint 1.1 : Infrastructure de Base
- [ ] Installer et configurer **BullMQ** + **Redis**
- [ ] Créer `HederaQueueService` (job queue)
- [ ] Créer `HederaCacheService` (cache des transactions)
- [ ] Créer `HederaRetryService` (retry avec backoff)
- [ ] Tests unitaires des services

#### Sprint 1.2 : Amélioration HCS
- [ ] Définir `HcsMessage` interface standardisée
- [ ] Créer `HcsMessageBuilder` (factory pattern)
- [ ] Ajouter signature HMAC pour les messages
- [ ] Créer `HcsListenerService` (écouter le topic)
- [ ] Tests d'intégration HCS

---

### **Phase 2 : HCS Integration (Semaine 2-3)** ⏱️ 15-20h

#### Sprint 2.1 : Intégration dans les Workflows
- [ ] **Consultation** : Envoyer message HCS à chaque création/modification
- [ ] **Prescription** : Envoyer message HCS à chaque émission
- [ ] **DSE Access** : Logger toutes les demandes d'accès
- [ ] **Analyses** : Logger les uploads de résultats
- [ ] **Rendez-vous** : Logger acceptation/refus

#### Sprint 2.2 : Vérification
- [ ] Endpoint `/api/verify/:type/:id`
- [ ] Service `VerificationService` pour comparer hash
- [ ] Page frontend pour vérifier l'intégrité
- [ ] Tests E2E de vérification

---

### **Phase 3 : HFS Hybride (Semaine 3-4)** ⏱️ 10-15h

#### Sprint 3.1 : Stockage Local
- [ ] Installer et configurer **MinIO** (ou S3)
- [ ] Service `FileStorageService` (upload/download)
- [ ] Migration des fichiers existants vers MinIO
- [ ] Tests de stockage

#### Sprint 3.2 : Certificats HFS
- [ ] Fonction `createFileCertificate()` (hash → HFS)
- [ ] Modifier upload de documents pour utiliser MinIO + HFS
- [ ] Fonction `verifyFileCertificate()` (vérifier hash)
- [ ] Dashboard admin pour voir les certificats

---

### **Phase 4 : KènèPoints & Gamification (Semaine 4-5)** ⏱️ 20-25h

#### Sprint 4.1 : Token HTS Setup
- [ ] Créer le token KènèPoints sur testnet
- [ ] Fonction `mintPoints(userId, amount, reason)`
- [ ] Fonction `burnPoints(userId, amount, reason)`
- [ ] Fonction `transferPoints(fromUserId, toUserId, amount)`
- [ ] Sync automatique avec `user_wallets` MySQL

#### Sprint 4.2 : Règles d'Attribution
- [ ] Service `RewardService` avec toutes les règles
- [ ] Triggers automatiques sur actions métier
- [ ] Historique des transactions KènèPoints
- [ ] Notifications utilisateur (email/push)

#### Sprint 4.3 : Dépenses & Leaderboard
- [ ] Catalogue de récompenses (réductions, cadeaux)
- [ ] Fonction `redeemReward(userId, rewardId)`
- [ ] Page frontend "Mes KènèPoints"
- [ ] Leaderboard communautaire

---

### **Phase 5 : Monitoring & Admin (Semaine 5-6)** ⏱️ 10-15h

#### Sprint 5.1 : Dashboard Hedera
- [ ] Page `/dashboard/superadmin/hedera`
- [ ] Graphiques de métriques (coûts, volume)
- [ ] Liste des transactions Hedera (filtres)
- [ ] Export CSV pour comptabilité

#### Sprint 5.2 : Alertes & Health
- [ ] Service `HederaMonitoringService`
- [ ] Alertes email si coûts > seuil
- [ ] Status page Hedera network
- [ ] Logs structurés (Winston/Pino)

---

### **Phase 6 : Tests & Déploiement (Semaine 6-7)** ⏱️ 10-15h

#### Sprint 6.1 : Tests
- [ ] Tests unitaires (tous les services)
- [ ] Tests d'intégration (workflows complets)
- [ ] Tests E2E (Cypress/Playwright)
- [ ] Tests de charge (K6/Artillery)

#### Sprint 6.2 : Documentation
- [ ] Documentation technique complète
- [ ] Guide d'utilisation admin
- [ ] Guide de déploiement
- [ ] Vidéos tutoriels

#### Sprint 6.3 : Migration Testnet → Mainnet
- [ ] Setup compte mainnet
- [ ] Créer topic HCS mainnet
- [ ] Créer token KènèPoints mainnet
- [ ] Migration progressive des données

---

## 💰 5. Estimation des Coûts Hedera {#estimation-couts}

### **Coûts par Transaction (Testnet ≈ Mainnet)**

| Service | Opération                     | Coût HBAR | Coût USD* |
|---------|-------------------------------|-----------|-----------|
| **HCS** | Submit message (< 1 KB)       | 0.0001    | $0.000012 |
| **HFS** | Create file (< 1 KB)          | 0.05      | $0.006    |
| **HFS** | Append file (1 KB)            | 0.0001    | $0.000012 |
| **HTS** | Create token                  | 1.0       | $0.12     |
| **HTS** | Mint tokens                   | 0.001     | $0.00012  |
| **HTS** | Transfer tokens               | 0.001     | $0.00012  |

*Basé sur 1 HBAR = $0.12 (variable)

---

### **Estimation Mensuelle (1000 utilisateurs actifs)**

#### **Scénario : Application en Production**

**Hypothèses** :
- 1000 patients actifs/mois
- 500 consultations/mois
- 200 prescriptions/mois
- 300 uploads de documents/mois
- 2000 actions récompensées/mois (KènèPoints)

**Calcul** :

| Service | Volume/mois | Coût unitaire | Total HBAR | Total USD  |
|---------|-------------|---------------|------------|------------|
| **HCS** | 1000 msgs   | 0.0001        | 0.1        | $0.012     |
| **HFS** | 300 files   | 0.05          | 15.0       | $1.80      |
| **HTS** | 2000 mints  | 0.001         | 2.0        | $0.24      |
| **Total** |           |               | **17.1**   | **$2.05**  |

✅ **Coût mensuel total : ~$2-3 USD** pour 1000 utilisateurs actifs !

---

### **Optimisations pour Réduire les Coûts**

1. **Batching HCS** : Regrouper 10 messages → 1 transaction
   - Économie : 90% sur HCS
   
2. **Hash uniquement sur HFS** : Ne pas stocker le fichier entier
   - Économie : 95% sur HFS
   
3. **Mint par batch** : Regrouper les KènèPoints quotidiens
   - Économie : 90% sur HTS

**Coût optimisé : ~$0.50-1 USD/mois** pour 1000 utilisateurs 🎉

---

## 🎯 Points d'Attention & Recommandations

### ✅ **À Faire Absolument**

1. **Testnet d'abord** : Tout tester sur testnet avant mainnet
2. **Monitoring des coûts** : Alertes si dépenses > budget
3. **Fallback gracieux** : App fonctionne même si Hedera down
4. **Logs détaillés** : Toutes les transactions loggées
5. **Cache intelligent** : Éviter les doublons coûteux

### ⚠️ **À Éviter**

1. ❌ Ne jamais stocker de données sensibles en clair sur HCS/HFS
2. ❌ Ne pas créer de comptes Hedera pour chaque utilisateur (coût)
3. ❌ Ne pas synchroniser en temps réel (utiliser queue)
4. ❌ Ne pas oublier les retry en cas d'échec réseau
5. ❌ Ne pas négliger les tests de charge

### 🚀 **Innovations Possibles (Phase 2)**

1. **NFTs de Diplômes Médicaux** : Certifications vérifiables pour médecins
2. **Prescription NFTs** : Ordonnances infalsifiables
3. **DAO de Gouvernance** : Utilisateurs votent sur les features
4. **Marketplace KènèPoints** : Échange P2P de points
5. **Interopérabilité** : Partage DSE entre établissements via HCS

---

## 📊 Résumé Exécutif

### 🎯 Objectifs de l'Intégration

- ✅ **Traçabilité immuable** des actions critiques (HCS)
- ✅ **Certification vérifiable** des documents (HFS)
- ✅ **Gamification engageante** avec KènèPoints (HTS)
- ✅ **Architecture scalable** (queue + cache)
- ✅ **Coûts maîtrisés** (~$1-3 USD/mois pour 1000 users)

### 📈 ROI Attendu

1. **Confiance accrue** : Blockchain = transparence
2. **Engagement utilisateur** : +30-50% avec gamification
3. **Différenciation marché** : Seule app santé blockchain au Mali
4. **Conformité RGPD** : Preuves d'intégrité des données
5. **Partenariats** : Attirer investisseurs et ONG

### ⏱️ Timeline Globale

- **Phase 1-2** (HCS) : 3-4 semaines
- **Phase 3** (HFS) : 2 semaines
- **Phase 4** (HTS/KènèPoints) : 3 semaines
- **Phase 5-6** (Monitoring/Tests) : 2-3 semaines

**Total : 10-12 semaines pour implémentation complète**

---

## 🚦 Prochaines Étapes

### 🎯 Validation Architecture

**Questions pour Validation** :

1. ✅ Approuvez-vous l'architecture en couches proposée ?
2. ✅ Les règles d'attribution KènèPoints vous conviennent-elles ?
3. ✅ Préférez-vous MinIO (local) ou S3 (cloud) pour les fichiers ?
4. ✅ Souhaitez-vous commencer par testnet ou directement mainnet ?
5. ✅ Budget mensuel Hedera acceptable : $5-10 USD ? $50-100 USD ?

### 📋 Après Validation

1. Je crée une **TODO List** détaillée avec tous les tickets
2. On commence par **Phase 1** (Infrastructure)
3. Je fournis un **rapport hebdomadaire** de progression
4. On teste chaque feature sur **testnet** avant intégration

---

**Attendant votre validation pour démarrer l'implémentation ! 🚀**

