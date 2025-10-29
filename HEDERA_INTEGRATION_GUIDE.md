# 🌐 **Guide d'Intégration Hedera - Santé Kènè**

## **📋 Table des matières**
1. [Introduction](#introduction)
2. [Services Hedera utilisés](#services-hedera-utilisés)
3. [Architecture](#architecture)
4. [HCS - Consensus Service](#hcs---consensus-service)
5. [HFS - File Service](#hfs---file-service)
6. [HTS - Token Service](#hts---token-service)
7. [Système KenePoints](#système-kenepoints)
8. [Workflow complet](#workflow-complet)
9. [Vérification et monitoring](#vérification-et-monitoring)

---

## **🎯 Introduction**

Santé Kènè utilise **trois services Hedera** pour garantir la traçabilité, l'immuabilité et la transparence des données médicales :

1. **HCS (Consensus Service)** : Audit trail immuable
2. **HFS (File Service)** : Stockage immuable des documents
3. **HTS (Token Service)** : Token KenePoints pour la gamification

---

## **🔧 Services Hedera utilisés**

### **Vue d'ensemble**

| Service | Utilisation | Coût moyen | Fréquence |
|---------|-------------|------------|-----------|
| **HCS** | Enregistre chaque événement critique | ~0.0001 HBAR | À chaque action |
| **HFS** | Stocke les documents médicaux | ~0.01-0.30 HBAR | À chaque upload |
| **HTS** | Token KenePoints (10M supply) | ~1 HBAR (une fois) | Création initiale |

### **Avantages**

✅ **Immuabilité** : Les données ne peuvent pas être modifiées  
✅ **Traçabilité** : Historique complet de toutes les actions  
✅ **Transparence** : Vérifiable publiquement sur HashScan  
✅ **Conformité** : Répond aux exigences RGPD/HIPAA  
✅ **Sécurité** : Cryptographie de niveau entreprise  

---

## **🏗️ Architecture**

### **Flux de données**

```
Frontend (Next.js)
    ↓
Backend API (Express + Prisma)
    ↓
Base de données MySQL (données principales)
    ↓
Hedera Services (immuabilité + traçabilité)
    ├─ HCS (audit trail)
    ├─ HFS (documents)
    └─ HTS (tokens KNP)
    ↓
HashScan (visualisation publique)
```

### **Architecture hybride**

L'application utilise une **architecture hybride** :
- **Base de données** : Données opérationnelles (rapide, modifiable)
- **Hedera** : Audit trail et documents (immuable, traçable)

**Pourquoi hybride ?**
- ⚡ **Performance** : DB locale plus rapide pour les lectures
- 💰 **Coût** : Transactions Hedera pour les événements critiques seulement
- 🔒 **Sécurité** : Double stockage (local + blockchain)

---

## **📜 HCS - Consensus Service**

### **Qu'est-ce que HCS ?**

HCS (Hedera Consensus Service) permet d'enregistrer des **messages immuables** avec horodatage décentralisé. C'est l'équivalent d'un **journal d'audit inaltérable**.

### **Événements enregistrés sur HCS**

| Événement | Quand | Priorité | Métadonnées |
|-----------|-------|----------|-------------|
| `CONSULTATION_CREATED` | Médecin crée une consultation | 5 | patientId, doctorId, date |
| `CONSULTATION_UPDATED` | Modification d'une consultation | 5 | consultationId, modifiedFields |
| `DOCUMENT_UPLOADED` | Upload d'un document médical | 4 | documentId, patientId, fileHash |
| `PRESCRIPTION_ISSUED` | Création d'une ordonnance | 7 | prescriptionId, medications |
| `DSE_ACCESS_GRANTED` | Patient approuve l'accès DSE | 8 | patientId, doctorId, expiresAt |
| `DSE_ACCESS_DENIED` | Patient refuse l'accès DSE | 8 | patientId, doctorId, reason |
| `POINTS_AWARDED` | Attribution de KenePoints | 6 | userId, amount, action |

### **Structure d'un message HCS**

```json
{
  "version": "1.0",
  "timestamp": 1761714251798,
  "environment": "development",
  "eventType": "CONSULTATION_CREATED",
  "userId": 5,
  "userRole": "MEDECIN",
  "entityType": "consultation",
  "entityId": 12,
  "dataHash": "2bae947a236c8c27afe4a3f6d8edb5ba...",
  "metadata": {
    "patientId": 3,
    "doctorId": 5,
    "diagnosis": "hash_du_diagnostic"
  },
  "signature": "c94e7e33a0df150d88a0b27415b17c79..."
}
```

### **Champs importants**

- **dataHash** : Hash SHA-256 des données sensibles (pas les données elles-mêmes)
- **signature** : Signature HMAC pour vérifier l'authenticité
- **timestamp** : Horodatage Unix en millisecondes
- **metadata** : Informations non sensibles pour recherche

### **Workflow HCS**

```
1. Action utilisateur (ex: créer consultation)
   ↓
2. Enregistrement dans DB (MySQL)
   ↓
3. Calcul du hash SHA-256 des données
   ↓
4. Construction du message HCS (HcsMessageBuilder)
   ↓
5. Signature HMAC du message
   ↓
6. Soumission au Topic Hedera
   ↓
7. Consensus Hedera (~3-5 secondes)
   ↓
8. Message immuable sur la blockchain
   ↓
9. Visible sur HashScan
```

### **Code exemple**

```typescript
// backend-api/src/controllers/medecin.controller.ts
import { hederaHcsService } from '../services/hedera-hcs.service.js';
import { HcsMessageBuilder } from '../services/hcs-message-builder.service.js';
import { HcsEventType, HcsEntityType } from '../types/hedera-hcs.types.js';

// Après création de consultation
const hcsMessage = new HcsMessageBuilder()
  .setEventType(HcsEventType.CONSULTATION_CREATED)
  .setEntity(HcsEntityType.CONSULTATION, consultation.id)
  .setUser(doctorId, 'MEDECIN')
  .setDataHash({
    consultationId: consultation.id,
    patientId: consultation.patientId,
    diagnosis: consultation.diagnosis,
  })
  .addMetadata('patientId', consultation.patientId)
  .addMetadata('doctorId', consultation.doctorId)
  .build();

await hederaHcsService.submit(hcsMessage, { priority: 5 });
```

### **Vérification sur HashScan**

```
https://hashscan.io/testnet/topic/0.0.VOTRE_TOPIC_ID
```

Vous verrez :
- ✅ Liste de tous les messages (séquence)
- ✅ Timestamp consensus
- ✅ Contenu du message (encodé base64)

---

## **📁 HFS - File Service**

### **Qu'est-ce que HFS ?**

HFS (Hedera File Service) permet de stocker des **fichiers immuables** sur Hedera. Une fois uploadé, un fichier **ne peut plus être modifié**.

### **Documents stockés sur HFS**

- 📄 Analyses de sang (PDF)
- 🩻 Radiographies (JPEG, PNG)
- 📋 Rapports médicaux (PDF, Word)
- 💊 Ordonnances (PDF)
- 📸 Photos médicales (JPEG, PNG)

### **Workflow HFS (non-bloquant)**

```
1. Médecin upload un document (frontend)
   ↓
2. Fichier sauvegardé localement (multer)
   ↓
3. Document créé dans DB IMMÉDIATEMENT
   ↓
4. Réponse envoyée au frontend (pas de blocage)
   ↓
5. EN ARRIÈRE-PLAN :
   - Calcul hash SHA-256
   - Upload sur HFS (chunking si > 5KB)
   - Réception du File ID (ex: 0.0.7154784)
   - Mise à jour du document dans DB (hfsFileId, hfsHash)
   ↓
6. Document immuable sur Hedera
```

### **Caractéristiques HFS**

- ✅ **Non-bloquant** : L'utilisateur ne voit aucun délai
- ✅ **Chunking automatique** : Fichiers > 5KB divisés automatiquement
- ✅ **Hash SHA-256** : Vérification d'intégrité
- ✅ **Mémo** : `SantéKènè: [nom du fichier]`
- ✅ **Double stockage** : Local + Hedera (redondance)

### **Structure en base de données**

```sql
-- Table Document
CREATE TABLE Document (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  url TEXT,                  -- URL locale
  hfsFileId VARCHAR(191),    -- ID Hedera (0.0.XXXXX)
  hfsHash VARCHAR(191),      -- Hash SHA-256
  hash VARCHAR(191),         -- Hash local
  size INT,
  ...
);
```


### **Vérification**

#### **Dans la base de données** :
```sql
SELECT id, name, hfsFileId, hfsHash 
FROM Document 
WHERE hfsFileId IS NOT NULL;
```

#### **Sur HashScan (transaction)** :
```
https://hashscan.io/testnet/account/0.0.VOTRE_ID
```

Cherchez les transactions **FILE CREATE** :
- ✅ Type: FILE CREATE
- ✅ File ID: 0.0.XXXXXXX
- ✅ Fee: ~0.01-0.30 HBAR

---

## **💰 HTS - Token Service**

### **Qu'est-ce que HTS ?**

HTS (Hedera Token Service) permet de créer des **tokens natifs** sur Hedera. L'application utilise le token **KenePoints (KNP)**.

### **Caractéristiques du token KNP**

```
Token Name:     KenePoints
Symbol:         KNP
Decimals:       2
Initial Supply: 10,000,000 KNP
Type:           Fungible Token
Treasury:       Votre compte Hedera
```

### **Création du token**

```bash
node src/scripts/create-kenepoint-token.ts
```

**Une seule fois** lors de la configuration initiale.

### **Système hybride KenePoints**

L'application utilise un **système hybride** pour les KenePoints :

#### **Base de données** (transactions quotidiennes)
- ✅ Table `UserWallet` : Soldes KNP
- ✅ Table `WalletTransaction` : Historique complet
- ✅ **Rapide et gratuit**

#### **Hedera HCS** (audit trail)
- ✅ Message `POINTS_AWARDED` pour chaque attribution
- ✅ **Immuable et traçable**

#### **Hedera HTS** (token natif)
- ⚠️ Tokens restent dans le Treasury (votre compte)
- 💡 Peut être utilisé plus tard pour transferts réels

### **Pourquoi ce système hybride ?**

1. **Performance** : Transactions DB instantanées
2. **Coût** : Évite ~0.0001 HBAR par micro-transaction
3. **Flexibilité** : Système de points modifiable
4. **Traçabilité** : HCS enregistre quand même l'événement

---

## **🎮 Système KenePoints**

### **Comment gagner des KenePoints**

#### **MÉDECINS** 🩺
| Action | KNP | Quand |
|--------|-----|-------|
| Consultation complétée | +150 KNP | Après création consultation |
| Document uploadé | +20 KNP | À chaque upload document |

#### **PATIENTS** 🏥
| Action | KNP | Quand |
|--------|-----|-------|
| Partage DSE | +150 KNP | Quand approuve demande d'accès |
| RDV Honoré | +100 KNP | Si consultation créée le jour du RDV ou après |
| Profil complété | +200 KNP | Groupe sanguin + Date naissance + Localité + Taille renseignés |

### **Système de badges**

Les utilisateurs gagnent des badges selon leur solde KNP :

| Badge | Solde KNP | Icône | Couleur | Avantages |
|-------|-----------|-------|---------|-----------|
| **BRONZE** | 0-499 | 🥉 | Orange | Accès de base |
| **ARGENT** | 500-1999 | 🥈 | Gris | Support prioritaire |
| **OR** | 2000-4999 | 🥇 | Doré | Remise 5% + VIP |
| **PLATINE** | 5000-9999 | 💎 | Cyan | Remise 10% + Événements exclusifs |
| **VIP** | 10000+ | 👑 | Violet | Support 24/7 + Remise 15% + Accès anticipé |

### **Progression du badge**

L'interface affiche :
- ✅ Badge actuel avec icône
- ✅ Barre de progression vers le niveau suivant
- ✅ KNP manquants pour le prochain badge

### **Modèle "Gain uniquement"**

- ✅ Les utilisateurs **gagnent** des KenePoints
- ❌ Les KenePoints **ne se dépensent pas**
- 💡 Système de fidélisation et gamification

---

## **🔄 Workflow complet**

### **Exemple : Upload de document médical**

```
1. FRONTEND
   Médecin upload fichier PDF (2 MB)
   ↓
2. BACKEND (multer)
   Fichier sauvegardé : uploads/rapport-123.pdf
   ↓
3. BASE DE DONNÉES
   Document créé :
   - id: 15
   - name: rapport-123.pdf
   - url: http://localhost:3001/uploads/rapport-123.pdf
   - hash: abc123def456...
   - hfsFileId: NULL (temporairement)
   ↓
4. RÉPONSE AU FRONTEND
   HTTP 200 OK (document visible immédiatement)
   ↓
5. HEDERA HFS (arrière-plan)
   Upload fichier sur Hedera
   - Chunking (fichier > 5KB)
   - Transaction FILE CREATE
   - File ID reçu: 0.0.7154784
   ↓
6. BASE DE DONNÉES (update)
   Document mis à jour :
   - hfsFileId: 0.0.7154784
   - hfsHash: abc123def456...
   ↓
7. HEDERA HCS
   Message audit :
   {
     eventType: "DOCUMENT_UPLOADED",
     entityId: 15,
     userId: 5,
     metadata: { fileHash: "abc123...", patientId: 3 }
   }
   ↓
8. KENEPOINTS
   +20 KNP attribués au médecin
   - WalletTransaction créée
   - UserWallet mis à jour
   ↓
9. HEDERA HCS (KNP)
   Message audit :
   {
     eventType: "POINTS_AWARDED",
     userId: 5,
     metadata: { amount: 20, action: "DOCUMENT_UPLOADED" }
   }
   ↓
10. HASHSCAN
    - Transaction FILE CREATE visible
    - Messages HCS visibles
    - File ID: 0.0.7154784
```

---

## **📊 Vérification et monitoring**

### **1. Vérifier l'état des services Hedera**

**Réponse** :
```json
{
  "status": "ok",
  "services": {
    "hcs": { "available": true, "topicId": "0.0.XXXXXXX" },
    "hfs": { "available": true },
    "hts": { "available": true, "tokenId": "0.0.XXXXXXX" }
  }
}

### **2. Voir vos ressources sur HashScan**

#### **Compte principal** :
```
https://hashscan.io/testnet/account/0.0.VOTRE_ID
```

Vous verrez :
- Solde HBAR
- Transactions récentes (FILE CREATE, Submit Message)
- Tokens associés (KenePoints)

#### **Topic HCS** :
```
https://hashscan.io/testnet/topic/0.0.VOTRE_TOPIC_ID
```

Vous verrez :
- Tous les messages HCS (séquence)
- Timestamps consensus
- Contenu des messages (base64)

#### **Token KNP** :
```
https://hashscan.io/testnet/token/0.0.VOTRE_TOKEN_ID
```

Vous verrez :
- Nom : KenePoints
- Symbole : KNP
- Supply : 10,000,000
- Treasury : Votre compte

### **3. Vérifier dans la base de données**

#### **Documents sur HFS** :
```sql
SELECT COUNT(*) as total_hfs 
FROM Document 
WHERE hfsFileId IS NOT NULL;
```

#### **Messages HCS enregistrés** :
```sql
SELECT COUNT(*) as total_consultations 
FROM Consultation 
WHERE blockchainTxId IS NOT NULL;
```

#### **KenePoints en circulation** :
```sql
SELECT 
  COUNT(*) as total_wallets,
  SUM(balance) as total_knp,
  SUM(totalEarned) as total_earned
FROM UserWallet;
```

### **4. Logs backend**

#### **Logs HCS** :
```
✅ Message HCS soumis
   Transaction ID: 0.0.7148888@1761714247.055156731
   Event: CONSULTATION_CREATED
```

#### **Logs HFS** :
```
✅ Fichier HFS créé: 0.0.7154784
   Hash: abc123def456...
   Taille: 245678 bytes
   Durée: 2345ms
```

#### **Logs KNP** :
```
🎁 Récompense attribuée: 150 KNP à user 5 pour CONSULTATION_COMPLETED
✅ Message HCS envoyé (POINTS_AWARDED)
```

---

## **💡 Bonnes pratiques**


---

## **🔐 Sécurité**

### **1. Hash des données**

Seul le **hash SHA-256** est stocké sur Hedera, jamais les données sensibles :
```javascript
dataHash: crypto.createHash('sha256')
  .update(JSON.stringify(sensitiveData))
  .digest('hex')
```

### **2. Signature HMAC**

Chaque message HCS est signé avec HMAC :
```javascript
signature: crypto.createHmac('sha256', HEDERA_HMAC_SECRET)
  .update(messageContent)
  .digest('hex')
```

### **3. Vérification d'intégrité**

Les fichiers HFS peuvent être vérifiés :
```typescript
const isValid = await hederaHfsService.verifyFileIntegrity(
  fileId,
  expectedHash
);
```

---

## **📚 Ressources**

- **Hedera Docs** : https://docs.hedera.com
- **HCS** : https://docs.hedera.com/hedera/sdks-and-apis/sdks/consensus-service
- **HFS** : https://docs.hedera.com/hedera/sdks-and-apis/sdks/file-service
- **HTS** : https://docs.hedera.com/hedera/sdks-and-apis/sdks/token-service
- **HashScan** : https://hashscan.io/testnet
- **Portal** : https://portal.hedera.com

---

🎉 **Votre application utilise maintenant la blockchain Hedera pour une traçabilité et une immuabilité totales !**

