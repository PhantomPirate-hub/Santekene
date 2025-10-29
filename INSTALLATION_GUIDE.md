# 📘 **Guide d'Installation - Santé Kènè**

## **📋 Table des matières**
1. [Prérequis](#prérequis)
2. [Installation Backend](#installation-backend)
3. [Installation Frontend](#installation-frontend)
4. [Configuration Base de données](#configuration-base-de-données)
5. [Configuration Hedera](#configuration-hedera)
6. [Démarrage de l'application](#démarrage-de-lapplication)
7. [Vérifications](#vérifications)
8. [Dépannage](#dépannage)

---

## **🔧 Prérequis**

### **Logiciels requis**
- **Node.js** : v18.0.0 ou supérieur
- **npm** : v9.0.0 ou supérieur
- **MySQL** : v8.0 ou supérieur
- **Git** : pour cloner le projet
- **Docker** : pour Redis

### **Vérifier les versions**
```bash
node --version    # v18.0.0+
npm --version     # v9.0.0+
mysql --version   # 8.0+
git --version
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
HEDERA_OPERATOR_ID=0.0.XXXXXXX
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_TOPIC_ID=0.0.XXXXXXX
HEDERA_TOKEN_ID=0.0.XXXXXXX
HEDERA_HMAC_SECRET=votre_secret_hmac

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
HEDERA_TOPIC_ID=0.0.XXXXXXX
```

### **4. Créer le Token KenePoints (optionnel)**

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

### **2. Démarrer le frontend**

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

### **3. Accéder à l'application**

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

### **3. Se connecter au frontend**

1. Aller sur `http://localhost:3000/login`
2. Se connecter avec le SuperAdmin :
   - Email : `superadmin@santekene.com`
   - Mot de passe : `SuperAdmin2024!`
3. Vous devriez être redirigé vers `/dashboard/superadmin`

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

