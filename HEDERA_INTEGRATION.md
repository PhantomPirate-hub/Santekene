# 🔗 Hedera Integration - Guide Complet

Ce guide vous explique **tout ce dont vous avez besoin** pour configurer et tester l'intégration blockchain Hedera dans Santekene.

---

## 📋 Table des Matières

- [Vue d'Ensemble Hedera](#-vue-densemble-hedera)
- [Pourquoi Hedera ?](#-pourquoi-hedera-)
- [Installation Redis](#-installation-redis)
- [Compte Hedera Testnet](#-compte-hedera-testnet)
- [Configuration Backend](#-configuration-backend)
- [Création Topic HCS](#-création-topic-hcs)
- [Création Token KenePoints](#-création-token-kenepoints)
- [Migration Base de Données](#-migration-base-de-données)
- [Démarrage et Tests](#-démarrage-et-tests)
- [Vérifications](#-vérifications)
- [Dépannage](#-dépannage)

---

## 🎯 Vue d'Ensemble Hedera

Santekene utilise **3 services Hedera** pour la sécurité et l'engagement:

| Service | Acronyme | Utilité | Bénéfice |
|---------|----------|---------|----------|
| **Consensus Service** | HCS | Journal immuable des actions | Traçabilité légale |
| **File Service** | HFS | Certificats de fichiers | Vérification d'intégrité |
| **Token Service** | HTS | Token KenePoints (KNP) | Récompenses utilisateurs |

### Flux de Données avec Hedera

```
Action Utilisateur (ex: Consultation créée)
         │
         ├──► MySQL (Données structurées)
         │
         ├──► Redis Queue (File d'attente asynchrone)
         │         │
         │         ▼
         │    HCS Worker (Traitement automatique)
         │         │
         │         ▼
         └──► Hedera Testnet
                   │
                   ├─► Topic HCS (Message immuable)
                   ├─► File HFS (Certificat document)
                   └─► Token KNP (Récompense +50 KNP)
```

---

## 💡 Pourquoi Hedera ?

### Sans Hedera (Base de données classique)
- ❌ Données modifiables par admin
- ❌ Aucune preuve en cas de litige
- ❌ Pas de traçabilité certifiée
- ❌ Aucune incitation utilisateur

### Avec Hedera (Blockchain)
- ✅ **Données immuables** (impossible de modifier l'historique)
- ✅ **Preuve légale** (timestamp certifié par le réseau)
- ✅ **Traçabilité complète** (chaque action enregistrée)
- ✅ **Engagement élevé** (récompenses KenePoints)

### Exemple Concret

**Scénario** : Un patient affirme que le médecin n'a jamais noté son allergie.

**Avec Hedera** :
1. Consultation enregistrée → Message HCS envoyé
2. Preuve sur HashScan : https://hashscan.io/testnet/topic/[TOPIC_ID]
3. Date et heure **certifiées** par le réseau Hedera
4. **Preuve incontestable** → Litige évité

---

## 🔧 Installation Redis

**Redis est OBLIGATOIRE** pour gérer les files d'attente Hedera de manière asynchrone.

### Méthode Recommandée : Docker

#### Étape 1 : Installer Docker Desktop

1. **Téléchargez** : https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
2. **Installez** (suivez l'assistant)
3. **Redémarrez** Windows
4. **Lancez** Docker Desktop depuis le menu Démarrer
5. **Attendez** que Docker démarre (icône stable dans la barre des tâches)

#### Étape 2 : Lancer Redis

```powershell
docker run -d --name redis-santekene --restart always -p 6379:6379 redis:alpine
```

**Explications** :
- `-d` : Mode détaché (arrière-plan)
- `--name redis-santekene` : Nom du conteneur
- `--restart always` : Redémarre automatiquement avec Windows
- `-p 6379:6379` : Port Redis standard
- `redis:alpine` : Image Redis légère

#### Étape 3 : Vérifier Redis

```powershell
docker exec -it redis-santekene redis-cli ping
```

**Résultat attendu** : `PONG`

### Commandes Docker Utiles

```powershell
# Démarrer Redis
docker start redis-santekene

# Arrêter Redis
docker stop redis-santekene

# Redémarrer Redis
docker restart redis-santekene

# Voir les logs Redis
docker logs redis-santekene

# Voir les logs en temps réel
docker logs -f redis-santekene

# Supprimer le conteneur (pour recommencer)
docker rm -f redis-santekene
```

### Alternative : Chocolatey (Windows)

Si vous préférez une installation native Windows :

```powershell
# PowerShell en Administrateur
choco install redis-64 -y

# Installer comme service Windows
redis-server --service-install
redis-server --service-start

# Vérifier
redis-cli ping
```

---

## 🌐 Compte Hedera Testnet

### Étape 1 : Créer un Compte

1. Allez sur **https://portal.hedera.com/register**
2. Créez un compte **gratuit**
3. Confirmez votre email

### Étape 2 : Obtenir des HBAR Gratuits

1. Connectez-vous sur https://portal.hedera.com/
2. Allez dans **"Testnet"**
3. Cliquez sur **"Add Testnet HBAR"**
4. Vous recevez **10,000 HBAR gratuits** instantanément
5. Ces HBAR se renouvellent automatiquement

### Étape 3 : Récupérer vos Clés

1. Dans le Hedera Portal, allez dans **"Account Details"**
2. Notez votre **Account ID** (format : `0.0.XXXXXXX`)
3. Notez votre **Private Key** (commence par `302e020100...`)

**⚠️ Important** :
- Gardez votre Private Key **secrète**
- Ne la partagez jamais
- Ne la commitez jamais sur Git

### Vérifier votre Compte

Allez sur HashScan pour voir votre compte :
```
https://hashscan.io/testnet/account/[VOTRE_ACCOUNT_ID]
```

Vous devriez voir votre solde de 10,000 HBAR.

---

## ⚙️ Configuration Backend

### Fichier `.env`

Créez `backend-api/.env` avec le contenu suivant :

```env
# === BASE DE DONNÉES ===
DATABASE_URL="mysql://root:@localhost:3306/santekene"

# === JWT ===
JWT_SECRET="votre_secret_jwt_super_securise_changez_moi"

# === HEDERA CONFIGURATION ===
HEDERA_NETWORK="testnet"
HEDERA_OPERATOR_ID="0.0.XXXXXXX"           # ⬅️ Collez votre Account ID
HEDERA_OPERATOR_KEY="302e020100..."       # ⬅️ Collez votre Private Key
HEDERA_TOPIC_ID=""                         # Vide pour l'instant (créé à l'étape suivante)
HEDERA_TOKEN_ID=""                         # Vide pour l'instant (créé à l'étape suivante)
HEDERA_HMAC_SECRET="votre_secret_hmac_changez_moi"

# === REDIS (File d'attente asynchrone) ===
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# === STOCKAGE DE FICHIERS ===
# false = Stockage local dans ./uploads
# true = MinIO (S3 compatible, nécessite configuration)
USE_MINIO=false
LOCAL_STORAGE_PATH="./uploads"

# === CORS ===
FRONTEND_URL="http://localhost:3000"
```

**Remplacez** :
- `HEDERA_OPERATOR_ID` par votre Account ID
- `HEDERA_OPERATOR_KEY` par votre Private Key
- Les secrets JWT et HMAC par des valeurs aléatoires sécurisées

---

## 📢 Création Topic HCS

Le **Topic HCS** est le journal de bord blockchain où tous les événements critiques sont enregistrés.

### Qu'est-ce qu'un Topic HCS ?

Un Topic HCS est comme un **livre de compte public et immuable** où chaque action importante est inscrite :
- Création/modification de consultation
- Émission de prescription
- Upload de document
- Accès au DSE
- Etc.

### Pourquoi le Créer ?

Sans Topic ID, votre backend **ne peut pas** enregistrer les événements sur Hedera. C'est comme essayer d'envoyer un email sans adresse email !

### Création Automatique

```powershell
cd backend-api

# Installer les dépendances (si pas encore fait)
npm install

# Créer le Topic HCS
npx ts-node src/scripts/create-hcs-topic.ts
```

**Résultat attendu** :
```
✅ Topic HCS créé avec succès !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Topic ID: 0.0.5089573
🔗 Explorer: https://hashscan.io/testnet/topic/0.0.5089573
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Ajoutez ce Topic ID dans votre fichier .env:
HEDERA_TOPIC_ID="0.0.5089573"
```

### Action Requise

1. **Copiez** le Topic ID affiché
2. **Ouvrez** `backend-api/.env`
3. **Remplacez** `HEDERA_TOPIC_ID=""` par `HEDERA_TOPIC_ID="0.0.XXXXXXX"`
4. **Sauvegardez** le fichier

### Vérifier sur HashScan

Ouvrez l'URL fournie dans votre navigateur :
```
https://hashscan.io/testnet/topic/0.0.XXXXXXX
```

Vous devriez voir votre Topic (vide pour l'instant).

---

## 🪙 Création Token KenePoints

Le **Token KenePoints (KNP)** est la monnaie de récompense de Santekene.

### Qu'est-ce que KenePoints ?

- **Token blockchain réel** sur Hedera
- **Récompense** les bonnes pratiques de santé
- **Échangeable** (selon vos règles)
- **Visible** publiquement sur HashScan

### Règles de Récompense

| Action | Récompense |
|--------|-----------|
| Consultation complétée | +50 KNP |
| Document médical uploadé | +20 KNP |
| DSE partagé avec médecin | +10 KNP |
| Rendez-vous honoré | +30 KNP |
| Prescription suivie | +15 KNP |
| Première connexion | +100 KNP |
| Profil complété | +25 KNP |

### Création Automatique

```powershell
# Toujours dans backend-api
npx ts-node src/scripts/create-kenepoint-token.ts
```

**Résultat attendu** :
```
✅ Token KenePoints (KNP) créé avec succès !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Token ID: 0.0.5089574
🪙 Nom: KenePoint
🔤 Symbole: KNP
💰 Supply initial: 1,000,000 KNP
🔗 Explorer: https://hashscan.io/testnet/token/0.0.5089574
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Ajoutez ce Token ID dans votre fichier .env:
HEDERA_TOKEN_ID="0.0.5089574"
```

### Action Requise

1. **Copiez** le Token ID affiché
2. **Ouvrez** `backend-api/.env`
3. **Remplacez** `HEDERA_TOKEN_ID=""` par `HEDERA_TOKEN_ID="0.0.XXXXXXX"`
4. **Sauvegardez** le fichier

### Vérifier sur HashScan

```
https://hashscan.io/testnet/token/0.0.XXXXXXX
```

Vous devriez voir :
- **Nom** : KenePoint
- **Symbole** : KNP
- **Supply** : 1,000,000
- **Type** : Fungible Token

---

## 🗄️ Migration Base de Données

Appliquez les migrations Prisma pour créer toutes les tables nécessaires.

```powershell
cd backend-api

# Appliquer les migrations
npx prisma migrate deploy

# Créer le Super Admin par défaut
npx prisma db seed
```

**Résultat attendu** :
```
✅ Migrations appliquées
✅ Super Admin créé:
   Email: superadmin@santekene.com
   Mot de passe: SuperAdmin2024!
```

---

## 🚀 Démarrage et Tests

### Étape 1 : Démarrer Redis

Si pas déjà fait :
```powershell
docker start redis-santekene
```

### Étape 2 : Démarrer le Backend API

```powershell
cd C:\laragon\www\Santekene\backend-api
npm run dev
```

**Vérifiez dans les logs** :
```
✅ Serveur backend démarré sur http://localhost:3001
✅ Hedera HCS Worker initialisé
✅ Hedera HFS Worker initialisé
```

**❌ Si erreur** :
- Vérifiez que Redis est actif
- Vérifiez que le `.env` est correct
- Vérifiez que Topic ID et Token ID sont bien renseignés

### Étape 3 : Démarrer le Frontend

```powershell
# Nouveau terminal
cd C:\laragon\www\Santekene\frontend
npm run dev
```

Accédez à http://localhost:3000

### Test 1 : Créer une Consultation

1. **Connectez-vous** comme **Médecin** :
   - Email : `medecin@test.com` (créez-le via `/register` si nécessaire)
   - Mot de passe : Votre mot de passe

2. Allez dans **Consultations** > **Nouvelle Consultation**

3. Remplissez les champs :
   - **Patient** : Sélectionnez un patient
   - **Diagnostic** : "Test Hedera HCS"
   - **Traitement** : "Paracétamol 500mg"
   - **Allergies** : "Aucune"

4. Cliquez sur **Enregistrer**

**Vérifications Backend (Logs)** :
```
📤 Message HCS soumis à la file d'attente (Priority: 5)
✅ Job HCS ajouté à la file : hedera-hcs-xxxxx
[HCS Worker] 🔄 Traitement job HCS: hedera-hcs-xxxxx
[HCS Worker] ✅ Message soumis au topic 0.0.XXXXXXX
[HCS Worker] 📋 Transaction ID: 0.0.XXXXXXX@1234567890.123456789
✅ Récompense attribuée au patient XXX pour consultation YYY
```

**Vérifications Hedera Explorer** :
1. Allez sur https://hashscan.io/testnet/topic/[VOTRE_TOPIC_ID]
2. Actualisez la page
3. Vous devriez voir un **nouveau message** avec :
   - `eventType: "CONSULTATION_CREATED"`
   - `userId: ...`
   - `dataHash: ...`
   - Timestamp de consensus Hedera

### Test 2 : Vérifier les KenePoints

1. **Déconnectez-vous**

2. **Connectez-vous** comme **Patient** :
   - Email : Email du patient de la consultation
   - Mot de passe : Son mot de passe

3. Allez dans **Mon Portefeuille**

**Résultat attendu** :
- **Balance actuelle** : 50.00 KNP
- **Total gagné** : 50.00 KNP
- **Historique** :
  - Date : Aujourd'hui
  - Type : REWARD
  - Raison : Consultation complétée
  - Montant : +50.00 KNP
  - Statut : SUCCESS

### Test 3 : Upload Document (HFS)

1. Restez connecté comme **Patient**

2. Allez dans **Mon DSE** > **Documents**

3. Cliquez sur **Ajouter un document**

4. Uploadez un fichier PDF (ex: ordonnance, résultat d'analyse)

5. Sélectionnez le type : "Ordonnance"

6. Cliquez sur **Téléverser**

**Vérifications Backend (Logs)** :
```
📤 [UPLOAD] Fichier uploadé : ordonnance-xxx.pdf
🔐 [HFS] Certificat créé - Hash: abc123...
📤 [HFS] Job ajouté à la file hedera-hfs
[HFS Worker] 🔄 Traitement job HFS: hedera-hfs-xxxxx
[HFS Worker] ✅ Certificat stocké sur Hedera File Service
📤 [HCS] Événement DOCUMENT_UPLOADED soumis
✅ Récompense attribuée à l'utilisateur XXX pour document YYY
```

**Vérifications Frontend** :
- Rafraîchissez **Mon Portefeuille**
- Vous devriez voir **+20 KNP** pour "Document médical uploadé"

---

## ✅ Vérifications

### Base de Données

```sql
-- Connexion MySQL
mysql -u root -p santekene

-- Vérifier les transactions Hedera
SELECT type, status, transactionId, createdAt 
FROM HederaTransaction 
ORDER BY createdAt DESC LIMIT 10;

-- Vérifier les portefeuilles KenePoints
SELECT 
    u.id, u.name, u.email,
    uw.balance, uw.totalEarned, uw.totalSpent
FROM UserWallet uw
JOIN User u ON uw.userId = u.id
ORDER BY uw.balance DESC;

-- Vérifier les transactions KNP
SELECT 
    wt.id, u.name,
    wt.amount, wt.type, wt.reason, wt.status, wt.createdAt
FROM WalletTransaction wt
JOIN UserWallet uw ON wt.walletId = uw.id
JOIN User u ON uw.userId = u.id
ORDER BY wt.createdAt DESC LIMIT 10;
```

### Redis (Files d'attente)

```powershell
# Voir les jobs HCS en attente
docker exec -it redis-santekene redis-cli llen "bull:hedera-hcs:wait"

# Voir les jobs HCS actifs
docker exec -it redis-santekene redis-cli llen "bull:hedera-hcs:active"

# Voir les jobs HCS complétés
docker exec -it redis-santekene redis-cli llen "bull:hedera-hcs:completed"

# Même chose pour HFS
docker exec -it redis-santekene redis-cli llen "bull:hedera-hfs:wait"
docker exec -it redis-santekene redis-cli llen "bull:hedera-hfs:active"
docker exec -it redis-santekene redis-cli llen "bull:hedera-hfs:completed"
```

### Hedera Explorer

**Votre Compte** :
```
https://hashscan.io/testnet/account/[VOTRE_OPERATOR_ID]
```

**Votre Topic HCS** :
```
https://hashscan.io/testnet/topic/[VOTRE_TOPIC_ID]
```

**Votre Token KNP** :
```
https://hashscan.io/testnet/token/[VOTRE_TOKEN_ID]
```

---

## ❌ Dépannage

### Problème : Redis connection refused

**Cause** : Redis n'est pas démarré

**Solution** :
```powershell
docker start redis-santekene

# Vérifier
docker ps
```

### Problème : HEDERA_OPERATOR_KEY invalid

**Cause** : Clé privée incorrecte ou mal formatée

**Solutions** :
- Vérifiez que la clé commence par `302e020100...`
- Vérifiez qu'il n'y a pas d'espaces dans le `.env`
- Vérifiez que la clé correspond bien à votre Account ID

### Problème : INSUFFICIENT_ACCOUNT_BALANCE

**Cause** : Pas assez de HBAR sur votre compte

**Solution** :
1. Allez sur https://portal.hedera.com/
2. Cliquez sur "Testnet" > "Add Testnet HBAR"
3. Attendez 1-2 minutes

### Problème : Topic not found ou Token not found

**Cause** : Topic ID ou Token ID manquant dans `.env`

**Solution** :
1. Vérifiez `backend-api/.env`
2. Assurez-vous que `HEDERA_TOPIC_ID` et `HEDERA_TOKEN_ID` sont remplis
3. Format correct : `HEDERA_TOPIC_ID="0.0.XXXXXXX"` (avec guillemets)

### Problème : Workers not initialized

**Cause** : Redis non actif ou `.env` mal configuré

**Solution** :
1. Vérifiez que Redis est actif : `docker ps`
2. Vérifiez les variables dans `.env`
3. Redémarrez le backend API

### Problème : Jobs HCS/HFS en attente infinie

**Cause** : Erreur réseau ou clé Hedera invalide

**Solution** :
```powershell
# Voir les jobs en erreur
docker exec -it redis-santekene redis-cli llen "bull:hedera-hcs:failed"

# Vider la file (recommencer)
docker exec -it redis-santekene redis-cli del "bull:hedera-hcs:failed"
docker exec -it redis-santekene redis-cli del "bull:hedera-hcs:wait"
```

---

## 📊 Architecture Détaillée

### Flux HCS (Consensus)

```
1. Utilisateur crée consultation (Frontend)
         │
         ▼
2. POST /api/consultations (Backend API)
         │
         ├──► Enregistrement MySQL (Prisma)
         │
         └──► Job HCS ajouté à Redis (BullMQ)
                   │
                   ▼
            HCS Worker traite le job
                   │
                   ├──► Construit le message (HcsMessageBuilder)
                   ├──► Signe le message (HMAC)
                   ├──► Soumet à Hedera Topic
                   │
                   ▼
            Transaction ID enregistré (MySQL)
```

### Flux HFS (File Service)

```
1. Patient upload document (Frontend)
         │
         ▼
2. POST /api/documents/upload (Backend API)
         │
         ├──► Upload fichier (MinIO ou local)
         ├──► Calcul hash SHA-256
         ├──► Création certificat HFS
         │
         └──► Job HFS ajouté à Redis
                   │
                   ▼
            HFS Worker traite le job
                   │
                   ├──► Construit le certificat
                   ├──► Upload sur Hedera File Service
                   ├──► File ID enregistré (MySQL)
                   │
                   └──► Message HCS envoyé (traçabilité)
```

### Flux HTS (KenePoints)

```
1. Action récompensable (ex: Consultation)
         │
         ▼
2. rewardRulesService.rewardConsultationCompleted()
         │
         ├──► Vérifier si wallet existe (MySQL)
         │         │ Non
         │         └──► Créer wallet
         │
         ├──► Calculer montant récompense (+50 KNP)
         │
         └──► Créer transaction wallet
                   │
                   ├──► Update balance (MySQL)
                   ├──► Insert WalletTransaction
                   │
                   └──► (Optionnel) Transaction HTS Hedera
```

---

## 🎓 Ressources

### Documentation Officielle

- **Hedera Docs** : https://docs.hedera.com/
- **Hedera SDK JS** : https://docs.hedera.com/hedera/sdks-and-apis/sdks/javascript-sdk
- **HashScan API** : https://hashscan.io/

### Outils

- **Hedera Portal** : https://portal.hedera.com/ (Gérer compte)
- **HashScan** : https://hashscan.io/testnet (Explorer)
- **Mirror Node** : https://mainnet-public.mirrornode.hedera.com/ (API publique)

### Communauté

- **Discord Hedera** : https://hedera.com/discord
- **GitHub Hedera** : https://github.com/hashgraph
- **Forum** : https://hedera.com/blog

---

## ✅ Checklist Finale

Avant de dire que l'intégration Hedera fonctionne :

- [ ] Redis installé et actif (`docker ps`)
- [ ] Compte Hedera créé avec HBAR
- [ ] `.env` configuré avec OPERATOR_ID et OPERATOR_KEY
- [ ] Topic HCS créé et dans `.env`
- [ ] Token KNP créé et dans `.env`
- [ ] Migrations Prisma appliquées
- [ ] Backend démarre sans erreur
- [ ] Logs affichent "HCS Worker initialisé"
- [ ] Logs affichent "HFS Worker initialisé"
- [ ] Frontend accessible (http://localhost:3000)
- [ ] Test consultation → Transaction visible sur HashScan
- [ ] Test portefeuille → +50 KNP visible
- [ ] Test upload document → +20 KNP visible

---

**Félicitations ! 🎉**

Si tous les tests passent, votre intégration Hedera est **opérationnelle** !

Vous pouvez maintenant :
- Explorer HashScan pour voir vos transactions
- Tester d'autres scénarios (partage DSE, prescriptions, etc.)
- Passer en Mainnet pour la production

---

**Version** : 1.0.0  
**Date** : Octobre 2025  
**Support** : support@santekene.com

🚀 **Bon développement blockchain !**

