# 📘 **Guide d'Installation - Santé Kènè**

## **📋 Table des matières**
1. [Prérequis](#prérequis)
2. [Installation Backend](#installation-backend)
3. [Installation Frontend](#installation-frontend)
4. [Configuration Base de données](#configuration-base-de-données)
5. [Configuration Hedera](#configuration-hedera)
6. [Installation Backend IA](#🤖-installation-backend-ia)
7. [Démarrage de l'application](#démarrage-de-lapplication)
8. [Vérifications](#vérifications)
9. [Dépannage](#dépannage)

---

## **🔧 Prérequis**

### **Logiciels requis**
- **Node.js** : v18.0.0 ou supérieur
- **npm** : v9.0.0 ou supérieur
- **MySQL** : v8.0 ou supérieur
- **Git** : pour cloner le projet
- **Docker** : pour Redis
- **Python** : v3.8 ou supérieur

### **Vérifier les versions**
```bash
node --version    # v18.0.0+
npm --version     # v9.0.0+
mysql --version   # 8.0+
git --version
python --version  # v3.8+
```

---

## **📦 Installation Backend**

### **1. Cloner le projet**
```bash
git clone https://github.com/PhantomPirate-hub/Santekene
cd Santekene/backend-api
```

### **2. Installer les dépendances**
```bash
npm install
```

### **3. Créer le fichier `.env`**
Créez un fichier `.env` à la racine de `backend-api/` :

```env
# Database
DATABASE_URL="mysql://root:votre_mot_de_passe@localhost:3306/santekene"

# JWT
JWT_SECRET="votre_secret_jwt_tres_long_et_securise"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Hedera Configuration (Testnet)

HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.XXXXXXX
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_HCS_TOPIC_ID=0.0.XXXXXXX
# Variables pour HCS/HTS/HFS Services (alias)
HEDERA_OPERATOR_ID=0.0.XXXXXXX
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_TOPIC_ID=0.0.XXXXXXX
HEDERA_TOKEN_ID=0.0.XXXXXXX

# Redis (pour Hedera queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Storage
USE_MINIO=false
LOCAL_STORAGE_PATH=./uploads
```

### **4. Configurer la base de données**

#### **Créer la base de données MySQL**
```sql
CREATE DATABASE santekene CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### **Lancer les migrations Prisma**
```bash
npx prisma migrate dev
```

#### **Générer le client Prisma**
```bash
npx prisma generate
```

#### **Créer le SuperAdmin (seed)**
```bash
npx prisma db seed
```

**Compte SuperAdmin par défaut** :
- Email : `superadmin@santekene.com`
- Mot de passe : `SuperAdmin2024!`

---

## **🎨 Installation Frontend**

### **1. Aller dans le dossier frontend**
```bash
cd ../frontend
```

### **2. Installer les dépendances**
```bash
npm install
```

### **3. Créer le fichier `.env.local`**
Créez un fichier `.env.local` à la racine de `frontend/` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

---

## **🗄️ Configuration Base de données**

### **Structure de la base de données**

L'application utilise **Prisma ORM** avec **MySQL**. Le schéma complet est dans `backend-api/prisma/schema.prisma`.

### **Modèles principaux**

1. **User** : Utilisateurs (patients, médecins, admins, superadmin)
2. **Patient** : Profil patient (groupe sanguin, allergies, etc.)
3. **Doctor** : Profil médecin (spécialité, structure, etc.)
4. **Consultation** : Consultations médicales
5. **Document** : Documents médicaux (analyses, radios, etc.)
6. **Prescription** : Ordonnances
7. **Appointment** : Rendez-vous
8. **DseAccessRequest** : Demandes d'accès au DSE
9. **CommunityPost** : Posts de la communauté
10. **CommunityCategory** : Catégories de posts
11. **UserWallet** : Portefeuille KenePoints
12. **WalletTransaction** : Historique des transactions KNP

### **Champs spécifiques Hedera**

Certains modèles ont des champs pour l'intégration Hedera :
- `blockchainTxId` : ID de transaction Hedera
- `hfsFileId` : ID du fichier sur Hedera File Service (HFS)
- `hfsHash` : Hash SHA-256 pour vérification d'intégrité

---

## **🌐 Configuration Hedera**

### **1. Créer un compte Hedera Testnet**

1. Aller sur : https://portal.hedera.com
2. S'inscrire et créer un compte
3. Récupérer :
   - **Account ID** (ex: `0.0.7148888`)
   - **Private Key** (format DER : `302e020100...`)

### **2. Obtenir des HBAR Testnet**

1. Aller sur : https://portal.hedera.com/faucet
2. Entrer votre Account ID
3. Recevoir 10,000 HBAR testnet (gratuit)

### **3. Créer le Topic HCS**

```bash
cd backend-api
node src/scripts/create-hcs-topic.ts
```

**Résultat attendu** :
```
✅ Topic HCS créé avec succès !
   Topic ID: 0.0.XXXXXXX
   Mémo: Santekene - Medical Data Audit Trail
```

Ajoutez ce Topic ID dans votre `.env` :
```env
HEDERA_HCS_TOPIC_ID=0.0.XXXXXXX
HEDERA_TOPIC_ID=0.0.XXXXXXX
```

### **4. Créer le Token KenePoints**

```bash
node src/scripts/create-kenepoint-token.ts
```

**Résultat attendu** :
```
✅ Token KenePoints créé avec succès !
   Token ID: 0.0.XXXXXXX
   Supply: 10,000,000 KNP
```

Ajoutez ce Token ID dans votre `.env` :
```env
HEDERA_TOKEN_ID=0.0.XXXXXXX
```

### **5. Démarrer Redis (pour Hedera queues)**

#### **Avec Docker (recommandé)** :
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

#### **Sans Docker** :
Installez Redis localement selon votre système d'exploitation.

---

## **🤖 Installation Backend IA**

L'application intègre un **backend IA séparé** (Python/FastAPI) pour l'analyse des symptômes et les recommandations médicales.

### **1. Prérequis**

- **Python** : v3.8 ou supérieur
- **pip** : Gestionnaire de paquets Python
- **Compte Groq** : Gratuit, pour accéder à l'API Groq

### **2. Installation**

#### **Installer Python (si nécessaire)**

**Windows** :
- Télécharger depuis : https://www.python.org/downloads/
- Cochez "Add Python to PATH" lors de l'installation

**Linux/Mac** :
```bash
python3 --version  # Vérifier la version
```

#### **Installer les dépendances**

```bash
cd backend-ai
python -m pip install -r requirements.txt
```

### **3. Configuration**

#### **Obtenir une clé Groq (GRATUIT)**

1. Aller sur : https://console.groq.com/keys
2. Créer un compte gratuit
3. Générer une clé API
4. Copier la clé

#### **Créer le fichier `.env`**

Créez un fichier `.env` à la racine de `backend-ai/` :

```env
GROQ_API_KEY=votre_cle_groq_ici
BACKEND_URL=http://localhost:3001
```

**⚠️ Important** : Remplacez `votre_cle_groq_ici` par votre vraie clé Groq.

### **4. Démarrer le Backend IA**

```bash
cd backend-ai
python -m uvicorn main:app --reload --port 8000
```

**Terminal devrait afficher** :
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### **5. Vérifier l'installation**

Ouvrez votre navigateur :
```
http://localhost:8000/docs
```

Vous devriez voir la **documentation Swagger/OpenAPI** du Backend IA avec tous les endpoints disponibles.

---

## **🚀 Démarrage de l'application**

### **1. Démarrer le backend**

```bash
cd backend-api
npm run dev
```

**Terminal devrait afficher** :
```
✅ Service HCS initialisé
   Operator ID: 0.0.XXXXXXX
   Topic ID: 0.0.XXXXXXX

✅ Service HFS initialisé
   Operator ID: 0.0.XXXXXXX

✅ Service HTS initialisé
   Token ID: 0.0.XXXXXXX

🚀 Serveur backend démarré sur http://localhost:3001
```

### **2. Démarrer le Backend IA** *(Optionnel - si installé)*

**Dans un nouveau terminal** :
```bash
cd backend-ai
python -m uvicorn main:app --reload --port 8000
```

### **3. Démarrer le frontend**

**Dans un nouveau terminal** :
```bash
cd frontend
npm run dev
```

**Terminal devrait afficher** :
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

### **4. Accéder à l'application**

Ouvrez votre navigateur :
```
http://localhost:3000
```

---

## **✅ Vérifications**


### **1. Vérifier la base de données**

```sql
-- Vérifier le SuperAdmin
SELECT id, name, email, role FROM User WHERE role = 'SUPERADMIN';

-- Vérifier les tables
SHOW TABLES;
```

### **2. Vérifier le Backend IA** *(si installé)*

Ouvrir dans le navigateur :
```
http://localhost:8000/docs
```

**Attendu** : Page Swagger/OpenAPI de l'API IA

### **3. Se connecter au frontend**

1. Aller sur `http://localhost:3000/login`
2. Se connecter avec le SuperAdmin :
   - Email : `superadmin@santekene.com`
   - Mot de passe : `SuperAdmin2024!`
3. Vous devriez être redirigé vers `/dashboard/superadmin`

### **4. Tester l'IA Clinique** *(si Backend IA installé)*

1. Se connecter en tant que patient
2. Aller sur **IA Clinique** (menu)
3. Saisir des symptômes (texte ou vocal)
4. **Attendu** : Analyse IA + recommandations médecins/centres de santé

---

## **🔍 Vérifier l'intégration Hedera**

### **1. Voir vos ressources Hedera**

**Résultat** :
```
🔗 VOS LIENS HASHSCAN (TESTNET)

📍 COMPTE PRINCIPAL:
   https://hashscan.io/testnet/account/0.0.XXXXXXX

📜 TOPIC HCS (Audit Trail):
   https://hashscan.io/testnet/topic/0.0.XXXXXXX

💰 TOKEN KENEPOINTS:
   https://hashscan.io/testnet/token/0.0.XXXXXXX
```

### **2. Uploader un document et vérifier HFS**

1. Se connecter comme médecin
2. Accéder au DSE d'un patient
3. Créer une consultation
4. Uploader un document (PDF ou image)

**Logs backend attendus** :
```
✅ Document créé dans DB: ID X
✅ Fichier HFS créé: 0.0.XXXXXXX
   Hash: abc123...
   Taille: XXXXX bytes
✅ Document X uploadé sur HFS: 0.0.XXXXXXX
📤 Message HCS envoyé pour document X
✅ Récompense de 20 KNP attribuée
```

**Vérifier sur HashScan** :
- Aller sur votre compte : `https://hashscan.io/testnet/account/0.0.XXXXXXX`
- Chercher une transaction **FILE CREATE** (upload HFS)
- Chercher des messages sur le Topic (audit HCS)

---

## **❌ Dépannage**

### **Problème 1 : Erreur de connexion MySQL**

**Erreur** :
```
Error: P1001: Can't reach database server
```

**Solution** :
1. Vérifier que MySQL est démarré
2. Vérifier le `DATABASE_URL` dans `.env`
3. Tester la connexion :
```bash
mysql -u root -p
```

### **Problème 2 : Port 3001 déjà utilisé**

**Erreur** :
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution** :
1. Changer le port dans `.env` :
```env
PORT=3002
```
2. Redémarrer le backend

### **Problème 3 : Services Hedera non disponibles**

**Logs** :
```
⚠️  HCS non configuré
⚠️  HFS non disponible
```

**Solution** :
1. Vérifier les variables Hedera dans `.env` :
```env
HEDERA_OPERATOR_ID=0.0.XXXXXXX
HEDERA_OPERATOR_KEY=302e020100...
HEDERA_TOPIC_ID=0.0.XXXXXXX
```

**⚠️ Important** : Pas de guillemets autour des valeurs !

2. Vérifier que Redis tourne (pour les queues) :
```bash
docker ps | grep redis
```

### **Problème 4 : Erreur Prisma EPERM**

**Erreur** :
```
EPERM: operation not permitted
```

**Solution** :
1. Arrêter le backend (Ctrl+C)
2. Générer le client :
```bash
npx prisma generate
```
3. Redémarrer :
```bash
npm run dev
```

### **Problème 5 : Migration Prisma échoue**

**Erreur** :
```
Could not find migration file
```

**Solution** :
1. Supprimer les dossiers de migration vides dans `prisma/migrations/`
2. Relancer :
```bash
npx prisma migrate dev
```

### **Problème 6 : Backend IA ne démarre pas**

**Erreur** :
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution** :
1. Vérifier que Python est installé :
```bash
python --version
```
2. Réinstaller les dépendances :
```bash
cd backend-ai
python -m pip install -r requirements.txt
```

### **Problème 7 : Erreur Groq API**

**Erreur** :
```
Error: Invalid API key
```

**Solution** :
1. Vérifier que `GROQ_API_KEY` est défini dans `backend-ai/.env`
2. Obtenir une nouvelle clé sur : https://console.groq.com/keys
3. Redémarrer le Backend IA

### **Problème 8 : Port 8000 déjà utilisé**

**Erreur** :
```
Error: listen EADDRINUSE: address already in use :::8000
```

**Solution** :
1. Changer le port lors du démarrage :
```bash
python -m uvicorn main:app --reload --port 8001
```
2. Mettre à jour `NEXT_PUBLIC_AI_API_URL` dans `frontend/.env.local` :
```env
NEXT_PUBLIC_AI_API_URL=http://localhost:8001
```

---

## **🤖 Fonctionnalités Backend IA**

### **Fonctionnalités IA**

#### **1. Triage IA des symptômes** 🩺
- **Saisie texte** : Description manuelle des symptômes
- **Saisie vocale** : Transcription automatique (speech-to-text)
- **Analyse IA** : Évaluation de la gravité et recommandations
- **Résultats** :
  - Niveau de gravité (faible, moyen, élevé, urgent)
  - Diagnostic probable
  - Recommandations d'action
  - Spécialités médicales suggérées

#### **2. Recommandations intelligentes** 💡
- **Médecins recommandés** : Basés sur les symptômes et spécialités
- **Centres de santé à proximité** : Géolocalisation + calcul de distance (formule Haversine)
- **Tri par pertinence** : Distance, disponibilité, spécialité

### **Architecture IA**

```
Frontend (Next.js)
    ↓
Backend IA (FastAPI - Port 8000)
    ↓
┌─────────────────────────────────┐
│  • Analyse symptômes (NLP)      │
│  • Transcription audio           │
│  • Recommandations médicales     │
│  • Géolocalisation              │
└─────────────────────────────────┘
    ↓
Backend API (Express - Port 3001)
    ↓
Base de données MySQL
```

### **API Endpoints IA**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/triage` | POST | Analyse des symptômes |
| `/api/ai/transcribe` | POST | Transcription audio → texte |
| `/api/ai/recommend-doctors` | GET | Recommandations médecins |
| `/api/ai/recommend-health-centers` | GET | Centres de santé proches |


### **Technologies IA utilisées**

- **FastAPI** : Framework web Python haute performance
- **Groq API** : Llama 3.3 70B pour analyse médicale ultra-rapide (gratuit)
- **Géolocalisation** : Formule de Haversine pour calcul de distance
- **NLP** : Traitement du langage naturel pour extraction de symptômes

### **Sécurité IA**

- ✅ Aucune donnée médicale sensible envoyée au cloud
- ✅ Analyse uniquement des symptômes (anonymisés)
- ✅ Pas de stockage des conversations
- ✅ Recommandations à titre informatif (non-diagnostic médical)
- ⚠️ **Disclaimer** : L'IA ne remplace pas un avis médical professionnel

---

## **📊 Structure du projet**

```
Santekene/
├── backend-api/
│   ├── prisma/
│   │   ├── schema.prisma          # Schéma de base de données
│   │   ├── migrations/            # Historique des migrations
│   │   └── seed.ts                # Seed SuperAdmin
│   ├── src/
│   │   ├── controllers/           # Logique métier
│   │   ├── routes/                # Routes API
│   │   ├── middleware/            # Authentification, RBAC, etc.
│   │   ├── services/              # Services (Hedera, Email, etc.)
│   │   ├── types/                 # Types TypeScript
│   │   ├── workers/               # Workers Hedera (HCS, HFS)
│   │   └── server.ts              # Serveur Express
│   ├── uploads/                   # Fichiers uploadés
│   ├── .env                       # Variables d'environnement
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                   # Pages Next.js
│   │   ├── components/            # Composants React
│   │   ├── context/               # Context API
│   │   ├── hooks/                 # Custom hooks
│   │   └── lib/                   # Utilitaires
│   ├── public/                    # Assets statiques
│   ├── .env.local                 # Variables d'environnement
│   └── package.json
└── README.md
```

---

## **🎯 Récapitulatif des commandes**

### **Installation complète (première fois)**
```bash
# Backend
cd backend-api
npm install
cp .env.example .env  # Puis éditer .env
npx prisma migrate dev
npx prisma generate
npx prisma db seed
node src/scripts/create-hcs-topic.ts
docker run -d --name redis -p 6379:6379 redis:latest
npm run dev

# Frontend (nouveau terminal)
cd frontend
npm install
cp .env.example .env.local  # Puis éditer .env.local
npm run dev
```

### **Démarrage quotidien**
```bash
# Terminal 1 : Backend
cd backend-api
npm run dev

# Terminal 2 : Frontend
cd frontend
npm run dev
```

---

## **📚 Ressources**

- **Hedera Documentation** : https://docs.hedera.com
- **Hedera Portal** : https://portal.hedera.com
- **HashScan (Testnet)** : https://hashscan.io/testnet
- **Prisma Documentation** : https://www.prisma.io/docs
- **Next.js Documentation** : https://nextjs.org/docs

---

🎉 **Félicitations ! Votre application Santé Kènè est maintenant installée et fonctionnelle !**

