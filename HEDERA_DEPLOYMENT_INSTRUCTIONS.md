# 🚀 Instructions de Déploiement - Infrastructure Hedera

## 📋 Prérequis

### 1. Redis
- ✅ Redis >= 6.0
- ✅ Port: 6379 (par défaut)

### 2. MinIO (Stockage de Fichiers)
- ✅ MinIO Server (local ou Docker)
- ✅ Port API: 9000, Console: 9001
- ✅ Bucket: `santekene-documents`

### 3. Compte Hedera Testnet
- ✅ Account ID (ex: `0.0.12345`)
- ✅ Private Key (DER-encoded)
- ✅ Topic HCS créé

### 4. Variables d'Environnement
Voir section suivante

---

## ⚙️ Configuration

### Étape 1 : Installation MinIO

#### Option A : Docker (Recommandé)
```bash
cd C:\laragon\www\Santekene
docker-compose -f docker-compose.minio.yml up -d

# Vérifier que MinIO est démarré
docker ps | findstr minio

# Accéder à la console web
# http://localhost:9001
# User: minioadmin
# Password: minioadmin123
```

#### Option B : Installation Locale (Windows)
```powershell
# Télécharger MinIO Server
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "C:\minio\minio.exe"

# Créer le dossier de données
New-Item -Path "C:\minio\data" -ItemType Directory -Force

# Démarrer MinIO
cd C:\minio
.\minio.exe server C:\minio\data --console-address ":9001"
```

**Accéder à la console**: http://localhost:9001

**Guide complet**: Voir `MINIO_INSTALLATION_GUIDE.md`

---

### Étape 2 : Installation Redis

#### Option A : Docker (Recommandé)
```bash
docker run -d \
  --name redis-hedera \
  -p 6379:6379 \
  --restart unless-stopped \
  redis:7-alpine
```

#### Option B : Installation Locale (Windows)
```bash
# Avec Chocolatey
choco install redis-64

# Démarrer Redis
redis-server

# Vérifier
redis-cli ping
# Réponse attendue: PONG
```

#### Option C : Redis Cloud (Production)
- Créer un compte sur [Redis Cloud](https://redis.com/try-free/)
- Obtenir host, port, password
- Utiliser dans `.env`

---

### Étape 2 : Configuration Variables d'Environnement

Créer/Modifier `backend-api/.env` :

```bash
# ==================== Redis ====================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=           # Laisser vide si local

# ==================== MinIO (Phase 3) ====================
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=santekene-documents

# Stockage local de secours (si MinIO indisponible)
LOCAL_STORAGE_PATH=./uploads

# ==================== Hedera ====================
# Compte opérateur (backend)
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=302e...YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet    # ou mainnet

# Topic HCS (à créer sur Hedera Portal)
HEDERA_TOPIC_ID=0.0.YOUR_TOPIC_ID

# ==================== Sécurité ====================
# Secret pour signature HMAC (32+ caractères aléatoires)
HEDERA_HMAC_SECRET=CHANGE_THIS_TO_A_SECURE_RANDOM_STRING_32CHARS_MIN

# Clé de chiffrement AES (32 caractères) - OPTIONNEL
AES_ENCRYPTION_KEY=ANOTHER_SECURE_RANDOM_STRING_32CHARS_EXACT

# ==================== Environnement ====================
NODE_ENV=development      # ou testnet ou mainnet
```

---

### Étape 3 : Créer un Topic HCS

#### Option A : Via Hedera Portal
1. Se connecter sur [Hedera Portal](https://portal.hedera.com/)
2. Aller dans "Consensus Service" > "Topics"
3. Cliquer "Create Topic"
4. Copier le Topic ID (ex: `0.0.12345`)
5. Coller dans `.env` → `HEDERA_HCS_TOPIC_ID`

#### Option B : Via Code (à exécuter une fois)
```typescript
// backend-api/scripts/create-hcs-topic.ts
import { Client, TopicCreateTransaction } from '@hashgraph/sdk';

async function createTopic() {
  const client = Client.forName('testnet');
  client.setOperator('0.0.YOUR_ID', 'YOUR_PRIVATE_KEY');

  const tx = await new TopicCreateTransaction()
    .setTopicMemo('Santé Kènè - Medical Records')
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId;

  console.log('✅ Topic créé:', topicId?.toString());
  console.log('Ajouter dans .env:', `HEDERA_HCS_TOPIC_ID=${topicId?.toString()}`);

  client.close();
}

createTopic();
```

```bash
npx tsx scripts/create-hcs-topic.ts
```

---

### Étape 4 : Intégrer le Worker dans `server.ts`

Modifier `backend-api/src/server.ts` :

```typescript
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
// ... autres imports

// ✅ NOUVEAU : Importer le worker HCS
import { initializeHcsWorker, stopHcsWorker } from './workers/hedera-hcs.worker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// ... vos routes existantes

// ✅ NOUVEAU : Initialiser le worker HCS au démarrage
let hcsWorker: any = null;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);

  // ✅ Démarrer le worker HCS
  try {
    hcsWorker = initializeHcsWorker();
    console.log('✅ Hedera HCS Worker initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du worker HCS:', error);
  }
});

// ✅ NOUVEAU : Arrêt propre du worker
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM reçu, arrêt propre...');
  
  if (hcsWorker) {
    await stopHcsWorker();
  }
  
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT reçu, arrêt propre...');
  
  if (hcsWorker) {
    await stopHcsWorker();
  }
  
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});
```

---

### Étape 5 : Démarrer les Services

#### Terminal 1 : Redis
```bash
# Si Docker
docker start redis-hedera

# Si local
redis-server
```

#### Terminal 2 : Backend API
```bash
cd backend-api
npm run dev
```

**Logs attendus** :
```
✅ Redis connecté pour Hedera Cache Service
✅ Redis connecté pour Hedera Queue Service (BullMQ)
✅ Hedera HCS configuré (testnet) - Topic: 0.0.12345
✅ Redis connecté pour Hedera HCS Worker
✅ Hedera HCS Worker démarré (concurrency: 5)
✅ Serveur démarré sur le port 3001
```

---

## 🧪 Tests de Vérification

### Test 1 : Redis
```bash
redis-cli ping
# Doit retourner: PONG
```

### Test 2 : Services Backend

Créer `backend-api/scripts/test-hedera.ts` :

```typescript
import { hederaCacheService } from '../src/services/hedera-cache.service.js';
import { hederaQueueService } from '../src/services/hedera-queue.service.js';
import { HcsMessageBuilder } from '../src/services/hcs-message-builder.service.js';
import { HcsEventType, HcsEntityType } from '../src/types/hedera-hcs.types.js';

async function testHederaServices() {
  console.log('🧪 Test 1 : Cache Service');
  const cacheAvailable = hederaCacheService.isAvailable();
  console.log('   Cache disponible:', cacheAvailable ? '✅' : '❌');

  if (cacheAvailable) {
    await hederaCacheService.set('test-key', 'test-value', 60);
    const value = await hederaCacheService.get('test-key');
    console.log('   Cache read/write:', value === 'test-value' ? '✅' : '❌');
  }

  console.log('\n🧪 Test 2 : Queue Service');
  const queueAvailable = hederaQueueService.isAvailable();
  console.log('   Queue disponible:', queueAvailable ? '✅' : '❌');

  if (queueAvailable) {
    const stats = await hederaQueueService.getQueueStats('hedera-hcs');
    console.log('   Stats HCS Queue:', stats ? '✅' : '❌');
    console.log('   - Waiting:', stats?.waiting);
    console.log('   - Active:', stats?.active);
  }

  console.log('\n🧪 Test 3 : Message Builder');
  try {
    const message = HcsMessageBuilder.forConsultationCreated(
      1,
      'MEDECIN',
      123,
      { diagnosis: 'Test' },
      456,
      1
    );
    console.log('   Message créé:', message ? '✅' : '❌');
    console.log('   Signature valide:', HcsMessageBuilder.verifySignature(message) ? '✅' : '❌');
  } catch (error) {
    console.error('   ❌ Erreur:', error);
  }

  console.log('\n🎉 Tests terminés !');
}

testHederaServices();
```

Exécuter :
```bash
npx tsx scripts/test-hedera.ts
```

**Résultat attendu** :
```
🧪 Test 1 : Cache Service
   Cache disponible: ✅
   Cache read/write: ✅

🧪 Test 2 : Queue Service
   Queue disponible: ✅
   Stats HCS Queue: ✅
   - Waiting: 0
   - Active: 0

🧪 Test 3 : Message Builder
   Message créé: ✅
   Signature valide: ✅

🎉 Tests terminés !
```

---

## 🔍 Monitoring & Debugging

### Vérifier Redis
```bash
# Connexion au CLI
redis-cli

# Voir toutes les clés Hedera
keys hedera:*

# Voir les queues BullMQ
keys bull:hedera-hcs:*

# Voir une valeur
get hedera:hcs:consultation:123

# Quitter
exit
```

### Logs du Worker
Les logs du worker apparaissent dans la console du backend :

```
🔄 [HCS Worker] Traitement job 1: CONSULTATION_CREATED (consultation:123)
✅ [HCS Worker] Message soumis: 0.0.12345@1234567890.123
✅ [HCS Worker] Job 1 complété
```

### Vérifier les Transactions Hedera
```bash
# Dans la DB
SELECT * FROM HederaTransaction ORDER BY createdAt DESC LIMIT 10;
```

Ou créer un endpoint admin :
```typescript
// GET /api/admin/hedera/transactions
router.get('/hedera/transactions', async (req, res) => {
  const transactions = await prisma.hederaTransaction.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: {
      // ... relations si nécessaire
    },
  });
  res.json(transactions);
});
```

---

## 🐛 Dépannage

### Problème : Worker ne démarre pas

**Symptôme** :
```
❌ Redis error (HCS Worker): ECONNREFUSED
```

**Solution** :
1. Vérifier que Redis est démarré : `redis-cli ping`
2. Vérifier les variables : `REDIS_HOST`, `REDIS_PORT`
3. Vérifier le firewall (port 6379)

---

### Problème : Hedera HCS non configuré

**Symptôme** :
```
⚠️  Hedera HCS non configuré. Variables d'environnement manquantes.
```

**Solution** :
1. Vérifier `.env` : `HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`, `HEDERA_HCS_TOPIC_ID`
2. Vérifier que le topic existe sur Hedera Portal
3. Redémarrer le backend

---

### Problème : Jobs restent en "waiting"

**Symptôme** :
```
Queue stats: { waiting: 10, active: 0, ... }
```

**Solution** :
1. Vérifier que le worker est démarré (logs au démarrage)
2. Vérifier Redis : `redis-cli ping`
3. Redémarrer le backend

---

### Problème : Signature invalide

**Symptôme** :
```
Error: Signature du message HCS invalide
```

**Solution** :
1. Vérifier `HCS_HMAC_SECRET` dans `.env`
2. S'assurer qu'il est identique partout
3. Régénérer les messages avec le nouveau secret

---

## 📊 Monitoring de Production

### Créer un Endpoint de Health Check

```typescript
// GET /api/health/hedera
router.get('/health/hedera', async (req, res) => {
  const cacheAvailable = hederaCacheService.isAvailable();
  const queueAvailable = hederaQueueService.isAvailable();
  const hcsAvailable = hederaHcsService.isAvailable();

  const queueStats = await hederaQueueService.getAllQueuesStats();
  const cacheStats = await hederaCacheService.getCacheStats();

  res.json({
    status: cacheAvailable && queueAvailable && hcsAvailable ? 'healthy' : 'degraded',
    services: {
      cache: cacheAvailable ? 'up' : 'down',
      queue: queueAvailable ? 'up' : 'down',
      hcs: hcsAvailable ? 'up' : 'down',
    },
    stats: {
      queue: queueStats,
      cache: cacheStats,
    },
    timestamp: new Date().toISOString(),
  });
});
```

Appeler : `GET http://localhost:3001/api/health/hedera`

---

## 🚀 Passage en Production (Mainnet)

### Étape 1 : Créer Compte Mainnet
1. Acheter HBAR sur un exchange (Binance, etc.)
2. Créer un compte sur [Hedera Portal](https://portal.hedera.com/)
3. Transférer HBAR vers le compte

### Étape 2 : Créer Topic Mainnet
```typescript
const client = Client.forMainnet();
// ... créer topic comme pour testnet
```

### Étape 3 : Configurer `.env` Production
```bash
HEDERA_NETWORK=mainnet
HEDERA_ACCOUNT_ID=0.0.MAINNET_ACCOUNT
HEDERA_PRIVATE_KEY=...
HEDERA_HCS_TOPIC_ID=0.0.MAINNET_TOPIC
NODE_ENV=mainnet
```

### Étape 4 : Budgéter les Coûts
- 1 message HCS = 0.0001 HBAR (~$0.000012)
- 10,000 messages/mois = 1 HBAR (~$0.12)
- Prévoir 10-50 HBAR pour démarrer

### Étape 5 : Monitoring des Coûts
Créer un cron job qui alerte si le solde < seuil :

```typescript
import { AccountBalanceQuery } from '@hashgraph/sdk';

async function checkBalance() {
  const balance = await new AccountBalanceQuery()
    .setAccountId(process.env.HEDERA_ACCOUNT_ID!)
    .execute(client);

  const hbarBalance = balance.hbars.toTinybars() / 100_000_000;

  if (hbarBalance < 5) {
    // Envoyer alerte email
    sendAlert(`⚠️ Solde Hedera faible: ${hbarBalance} HBAR`);
  }
}

// Exécuter toutes les heures
setInterval(checkBalance, 3600000);
```

---

## ✅ Checklist de Déploiement

### Développement
- [ ] Redis installé et démarré
- [ ] `.env` configuré avec testnet
- [ ] Topic HCS créé sur testnet
- [ ] Worker démarre sans erreur
- [ ] Tests de vérification passent

### Staging/Pre-Production
- [ ] Redis Cloud configuré
- [ ] Secrets sécurisés (Vault, AWS Secrets Manager)
- [ ] Monitoring configuré
- [ ] Alertes email configurées
- [ ] Load testing effectué

### Production
- [ ] Compte Hedera mainnet créé et financé
- [ ] Topic HCS mainnet créé
- [ ] `.env` mainnet configuré
- [ ] Monitoring + alertes actifs
- [ ] Plan de backup/disaster recovery
- [ ] Documentation mise à jour

---

**Déploiement prêt pour production ! 🚀**

