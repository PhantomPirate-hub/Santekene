# 🏥 SantèKène - Plateforme de Santé Numérique

> **Plateforme complète de gestion de santé numérique avec blockchain Hedera, intelligence artificielle et téléconsultation**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6+-teal)](https://www.prisma.io/)
[![Hedera](https://img.shields.io/badge/Hedera-Blockchain-purple)](https://hedera.com/)

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [Utilisation](#-utilisation)
- [Technologies](#-technologies)
- [Documentation](#-documentation)
- [Licence](#-licence)

---

## 🎯 Vue d'ensemble

**SantèKène** est une plateforme de santé numérique innovante qui combine :

- **Dossier Médical Électronique (DSE)** sécurisé
- **Téléconsultation** via visioconférence (Jitsi Meet)
- **Intelligence Artificielle** pour le triage médical et l'assistance clinique
- **Blockchain Hedera** pour la traçabilité et la certification des données médicales
- **Système de récompenses** (KènèPoints) pour encourager l'engagement des utilisateurs
- **Communauté** et partage d'expériences

### Cas d'usage principaux

✅ **Patients** : Consultations en ligne, gestion du DSE, suivi des ordonnances  
✅ **Médecins** : Téléconsultations, prescriptions NFT, historique médical certifié  
✅ **Admins** : Gestion des structures de santé, validation des médecins  
✅ **Super Admins** : Monitoring global, gestion des utilisateurs

---

## ⭐ Fonctionnalités

### Pour les Patients 🧑‍⚕️

- 📋 **DSE (Dossier de Santé Électronique)** : Consultations, analyses, allergies, prescriptions
- 📹 **Téléconsultation** : Visioconférence sécurisée avec les médecins
- 💊 **Ordonnances NFT** : Prescriptions certifiées sur blockchain Hedera
- 🤖 **Assistant IA** : Aide au diagnostic basée sur l'historique médical
- 🎁 **KènèPoints** : Récompenses pour l'utilisation de la plateforme
- 👥 **Communauté** : Partage d'expériences et entraide

### Pour les Médecins 🩺

- 📅 **Gestion des RDV** : Acceptation/refus, planning, notifications
- 📝 **Consultations** : Création de consultations avec IA de résumé
- 💉 **Prescriptions** : Génération d'ordonnances certifiées (NFT)
- 📊 **Statistiques** : Analyses de consultations, patients, revenus
- 📖 **Historique** : Accès complet aux consultations passées
- 🔔 **Notifications** : Alertes en temps réel

### Pour les Admins 🏥

- 🏢 **Gestion de la structure** : Validation des médecins, statistiques
- 👨‍⚕️ **Médecins** : Approbation/refus des demandes d'inscription
- 📈 **Tableau de bord** : Vue d'ensemble des activités

### Pour les Super Admins 👑

- 🏥 **Structures de santé** : Approbation des demandes (hôpitaux, cliniques)
- 👥 **Utilisateurs** : Activation/désactivation des comptes
- 📊 **Monitoring** : Suivi global des activités de la plateforme
- 🔧 **Administration** : Création de Super Admins

### Blockchain Hedera 🔗

- **HCS (Consensus Service)** : Journalisation immuable des actions critiques
- **HFS (File Service)** : Stockage vérifiable des certificats médicaux
- **HTS (Token Service)** : Gestion des KènèPoints et NFT de prescriptions

---

## 🏗️ Architecture

```
Santekene/
├── frontend/              # Next.js 14 (React, TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── app/          # Pages et routes (App Router)
│   │   ├── components/   # Composants réutilisables
│   │   ├── contexts/     # Contextes React (Auth, etc.)
│   │   └── lib/          # Utilitaires
│   └── public/           # Assets statiques
│
├── backend-api/           # API REST (Node.js, Express, Prisma)
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── routes/       # Routes API
│   │   ├── services/     # Services (Hedera, Storage, etc.)
│   │   ├── workers/      # Workers asynchrones (BullMQ)
│   │   ├── middleware/   # Auth, RBAC, Rate Limiting
│   │   └── types/        # Types TypeScript
│   ├── prisma/
│   │   ├── schema.prisma # Schéma de la base de données
│   │   ├── migrations/   # Migrations SQL
│   │   └── seed.ts       # Données initiales (SuperAdmin)
│   └── uploads/          # Fichiers uploadés (local)
│
├── backend-ai/            # IA Clinique (Python, FastAPI, LangChain)
│   ├── main.py           # API FastAPI
│   ├── agents/           # Agents IA
│   └── requirements.txt  # Dépendances Python
│
├── README.md              # Ce fichier
├── HEDERA_INTEGRATION.md  # Guide Hedera (HCS/HFS/HTS)
└── MOBILE_INTEGRATION.md  # Guide intégration mobile
```

---

## 🛠️ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

### Obligatoires

| Logiciel | Version minimale | Lien de téléchargement |
|----------|------------------|------------------------|
| **Node.js** | 20.x ou supérieur | https://nodejs.org/ |
| **npm** | 10.x ou supérieur | Inclus avec Node.js |
| **MySQL** | 8.0 ou supérieur | https://dev.mysql.com/downloads/ |
| **Python** | 3.11 ou supérieur | https://www.python.org/downloads/ |
| **Git** | 2.x ou supérieur | https://git-scm.com/downloads |

### Optionnels (pour Hedera)

| Logiciel | Version | Lien | Usage |
|----------|---------|------|-------|
| **Docker Desktop** | Dernière | https://www.docker.com/products/docker-desktop | Redis & MinIO |
| **Redis** | 7.x | Via Docker ou https://redis.io/download | Cache Hedera |

---

## 📦 Installation

### 1️⃣ Cloner le Projet

```bash
git clone https://github.com/votre-username/Santekene.git
cd Santekene
```

### 2️⃣ Installation du Backend API (Node.js)

```bash
cd backend-api
npm install
```

**Créer le fichier `.env`** :

```bash
cp .env.example .env
```

**Éditer `.env`** avec vos configurations :

```env
# Base de données MySQL
DATABASE_URL="mysql://root:@localhost:3306/santekene"

# JWT
JWT_SECRET="votre_secret_jwt_tres_securise_changez_moi"

# URLs
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# OpenAI (pour l'IA)
OPENAI_API_KEY="sk-votre-cle-openai"

# Jitsi Meet (Visioconférence)
JITSI_DOMAIN="meet.jit.si"
JITSI_APP_ID=""

# Hedera (Optionnel - voir HEDERA_INTEGRATION.md)
HEDERA_NETWORK="testnet"
HEDERA_OPERATOR_ID=""
HEDERA_OPERATOR_KEY=""
HEDERA_HCS_TOPIC_ID=""
HEDERA_KNP_TOKEN_ID=""

# Redis (pour Hedera)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# MinIO (Stockage fichiers - Optionnel)
USE_MINIO="false"
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY=""
MINIO_SECRET_KEY=""
MINIO_BUCKET_NAME="santekene-files"
```

**Initialiser la base de données** :

```bash
# Créer la base de données MySQL
la base de donnée doit etre : santekene

# Appliquer les migrations Prisma
npx prisma migrate dev

# Charger les données initiales (SuperAdmin)
npx prisma db seed
```

✅ **SuperAdmin créé** :
- **Email** : `superadmin@santekene.com`
- **Mot de passe** : `superadmin`

### 3️⃣ Installation du Backend AI (Python)

```bash
cd backend-ai

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows PowerShell :
.\venv\Scripts\Activate.ps1
# Windows CMD :
.\venv\Scripts\activate.bat
# macOS/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

**Créer le fichier `.env`** :

```bash
cp .env.example .env
```

**Éditer `.env`** :

```env
OPENAI_API_KEY="sk-votre-cle-openai"
BACKEND_URL="http://localhost:3001"
```

### 4️⃣ Installation du Frontend (Next.js)

```bash
cd frontend
npm install
```

**Créer le fichier `.env.local`** :

```bash
cp .env.example .env.local
```

**Éditer `.env.local`** :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
```

---

## ⚙️ Configuration

### Configuration MySQL

1. **Ouvrir MySQL Workbench** ou votre outil préféré
2. **Créer la base de données** :
   ```sql
   CREATE DATABASE santekene CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. **Vérifier la connexion** dans `.env` du `backend-api`

### Configuration OpenAI (pour l'IA)

1. **Créer un compte** : https://platform.openai.com/
2. **Générer une clé API** : https://platform.openai.com/api-keys
3. **Ajouter la clé** dans :
   - `backend-api/.env` → `OPENAI_API_KEY`
   - `backend-ai/.env` → `OPENAI_API_KEY`

### Configuration Jitsi Meet (Visioconférence)

**Par défaut, utilise le serveur public** : `meet.jit.si`

**Pour un serveur privé** :
1. Installer Jitsi : https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart
2. Modifier dans `.env.local` (frontend) :
   ```env
   NEXT_PUBLIC_JITSI_DOMAIN=votre-domaine.com
   ```

---

## 🚀 Lancement

### Méthode 1 : Lancement Manuel (3 Terminaux)

**Terminal 1 - Backend API** :
```bash
cd backend-api
npm run dev
```
✅ API disponible sur http://localhost:3001

**Terminal 2 - Backend AI** :
```bash
cd backend-ai
# Activer venv si pas déjà fait
.\venv\Scripts\Activate.ps1  # Windows
# ou
source venv/bin/activate      # macOS/Linux

python main.py
```
✅ API IA disponible sur http://localhost:8000

**Terminal 3 - Frontend** :
```bash
cd frontend
npm run dev
```
✅ Application disponible sur http://localhost:3000

### Méthode 2 : Script PowerShell (Windows)

```powershell
.\start-all.ps1
```
Ce script lance automatiquement les 3 services dans des fenêtres séparées.

---

## 🎮 Utilisation

### Premier Lancement

1. **Ouvrir l'application** : http://localhost:3000
2. **Se connecter en Super Admin** :
   - Email : `superadmin@santekene.com`
   - Mot de passe : `SuperAdmin2024!`

### Créer une Structure de Santé

1. **Aller sur `/register`**
2. **Sélectionner le rôle "Admin"**
3. **Remplir le formulaire** :
   - Nom de la structure
   - Localité
   - Contact
   - Document de validation (licence)
   - Informations du représentant
4. **Soumettre** → Demande envoyée au Super Admin
5. **Super Admin approuve** → Structure activée

### Ajouter un Médecin

1. **Admin se connecte**
2. **Menu "Médecins" → "Ajouter un médecin"**
3. **Le médecin s'inscrit** via `/register` (rôle "Médecin")
4. **Admin approuve** la demande

### Inscription Patient

1. **Aller sur `/register`**
2. **Sélectionner "Patient"**
3. **Remplir** : Nom, Email, Téléphone, Mot de passe
4. **Accès immédiat** (pas de validation requise)

---

## 🔧 Technologies

### Frontend

| Technologie | Usage |
|-------------|-------|
| **Next.js 14** | Framework React (App Router) |
| **TypeScript** | Typage statique |
| **Tailwind CSS** | Styling |
| **Shadcn/ui** | Composants UI |
| **Framer Motion** | Animations |
| **React-Leaflet** | Cartes interactives |
| **Jitsi Meet** | Visioconférence |
| **Axios** | Requêtes HTTP |

### Backend API

| Technologie | Usage |
|-------------|-------|
| **Node.js + Express** | Serveur API REST |
| **TypeScript** | Typage statique |
| **Prisma** | ORM (MySQL) |
| **JWT** | Authentification |
| **BullMQ** | Files d'attente (jobs asynchrones) |
| **IORedis** | Cache Redis |
| **Hedera SDK** | Blockchain (HCS/HFS/HTS) |
| **MinIO** | Stockage fichiers (optionnel) |
| **Multer** | Upload de fichiers |

### Backend AI

| Technologie | Usage |
|-------------|-------|
| **Python 3.11** | Langage |
| **FastAPI** | API REST |
| **LangChain** | Framework IA |
| **OpenAI GPT-4o-mini** | Modèle de langage |
| **Whisper** | Transcription audio (future) |

### Base de Données

| Technologie | Usage |
|-------------|-------|
| **MySQL 8.0** | Base de données relationnelle |
| **Prisma** | ORM et migrations |

### Blockchain

| Technologie | Usage |
|-------------|-------|
| **Hedera Hashgraph** | Blockchain |
| **HCS** | Consensus Service (logs immuables) |
| **HFS** | File Service (certificats) |
| **HTS** | Token Service (KènèPoints, NFT prescriptions) |

---

## 📚 Documentation

- **Guide Hedera** : [HEDERA_INTEGRATION.md](./HEDERA_INTEGRATION.md)
  - Installation Redis/Docker
  - Création compte Hedera Testnet
  - Configuration HCS/HFS/HTS
  - Tests et vérification

- **Guide Mobile** : [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md)
  - URLs API pour intégration mobile
  - Exemples Flutter et React Native
  - Visioconférence mobile (Jitsi Meet SDK)

- **API Documentation** : http://localhost:3001/api-docs (Swagger - à venir)

---

## 🐛 Dépannage

### Erreur de connexion MySQL

```
Error: Can't reach database server at `localhost`:`3306`
```

**Solution** :
1. Vérifier que MySQL est démarré
2. Vérifier les identifiants dans `backend-api/.env`
3. Créer la base de données : `CREATE DATABASE santekene;`

### Port déjà utilisé

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution** :
- Tuer le processus sur le port : 
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:5000 | xargs kill -9
  ```
- Ou changer le port dans `.env`

### Erreur Prisma

```
Error: Prisma schema not found
```

**Solution** :
```bash
cd backend-api
npx prisma generate
npx prisma migrate dev
```

### Python venv non activé

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution** :
```bash
cd backend-ai
# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. **Fork** le projet
2. **Créer une branche** : `git checkout -b feature/ma-fonctionnalite`
3. **Commiter** : `git commit -m 'Ajout de ma fonctionnalité'`
4. **Push** : `git push origin feature/ma-fonctionnalite`
5. **Ouvrir une Pull Request**

---

## 📄 Licence

Ce projet est sous licence **MIT**.

---

## 👥 Équipe

Développé avec ❤️ par l'équipe SantèKène.

---

## 📞 Support

- **Documentation** : Voir les fichiers `.md` dans le projet
- **Issues** : https://github.com/votre-username/Santekene/issues
- **Email** : support@santekene.com

---

**🎉 Bon développement avec SantèKène !**
