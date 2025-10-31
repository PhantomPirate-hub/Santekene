# 🏥 **Santé Kènè - Track 4 : IA & DePIN**

## **Lien du Pitch Deck et le lien des certifications des membres du groupe**
- ✅ lien du pitch deck : https://gamma.app/docs/Sante-Kene-f49y38sneqxffba
- ✅ Lassine MALE : https://certs.hashgraphdev.com/e2d43bbf-31ac-462a-8b0c-0fcdea8f2400.pdf
- ✅ Aboubacar BANE : https://certs.hashgraphdev.com/7532df41-83b2-43ba-abfa-761795ed1b96.pdf
- ✅ Assetou DIARRA : https://certs.hashgraphdev.com/c99a3a9e-6c2b-4668-8a88-8a8c93615dce.pdf
- ✅ Yaya DIAKITE : https://certs.hashgraphdev.com/77feb7da-5481-4232-9726-dd84b0990692.pdf
- ✅ Balkissa Oumar CISSE : https://certs.hashgraphdev.com/dd187a5f-532d-4a3b-8c67-512953fac0a8.pdf
- ✅ Kadiatou DIARRA : https://certs.hashgraphdev.com/97016505-dae6-4246-abc5-9ced1cb93f82.pdf

### NB: cette section vous aide à comprendre la structure du projet, mais pour l'installation reférer vous à (`INSTALLATION_GUIDE.md`)

Ce projet contient **3 guides complets** pour vous accompagner :

### **1. 📘 Installation Guide** (`INSTALLATION_GUIDE.md`)
Guide complet d'installation de A à Z :
- ✅ Prérequis et configuration
- ✅ Installation Backend API + Backend IA + Frontend
- ✅ Configuration MySQL + Prisma
- ✅ Configuration Hedera (HCS, HFS, HTS)
- ✅ Configuration Groq API (Backend IA)
- ✅ Démarrage et vérification
- ✅ Dépannage

**→ Commencez par ce guide si c'est votre première installation**

### **2. 🌐 Hedera Integration Guide** (`HEDERA_INTEGRATION_GUIDE.md`)
Guide détaillé de l'intégration blockchain Hedera :
- ✅ HCS (Consensus Service) - Audit trail
- ✅ HFS (File Service) - Documents immuables
- ✅ HTS (Token Service) - Token KenePoints
- ✅ Système KenePoints et badges
- ✅ Architecture hybride DB
- ✅ Workflows complets
- ✅ Vérification sur HashScan

**→ Consultez ce guide pour comprendre comment fonctionne Hedera**

### **3. 🤖 Backend IA** (`INSTALLATION_GUIDE.md`)
L'intégration IA est documentée dans le guide d'installation :
- ✅ Triage IA des symptômes (Groq Llama 3.3)
- ✅ Assistant médical pour diagnostics (Groq)
- ✅ Transcription audio (Whisper)
- ✅ Recommandations médecins et centres de santé
- ✅ Installation et configuration Backend IA
- ✅ API Endpoints et exemples d'utilisation

**→ Consultez la section "Installation Backend IA" dans `INSTALLATION_GUIDE.md`**

### **4. 📱 Flutter Integration Guide** (`FLUTTER_INTEGRATION_GUIDE.md`)
Guide d'intégration mobile Flutter :
- ✅ Configuration projet Flutter
- ✅ Authentification JWT
- ✅ Modèles de données
- ✅ Services API
- ✅ Upload de fichiers
- ✅ IA Clinique (analyse symptômes)
- ✅ KenePoints et badges
- ✅ Exemples complets

**→ Utilisez ce guide pour développer l'application mobile**



## **🏗️ Architecture**

### **Stack Technique**

```
┌─────────────────────────────────────────────────────────┐
│     FRONTEND web et moibole (Next.js 14 & Flutter)      │
│        React + TypeScript + Tailwind + Shadcn UI        │
└─────────────────────────────────────────────────────────┘
           ↓ HTTP/REST (3001)      ↓ HTTP/REST (8000)
┌──────────────────────────┐    ┌──────────────────────────┐
│   BACKEND API (Express)  │    │   BACKEND IA (FastAPI)   │
│  TypeScript + Prisma ORM │    │   Python + Groq API      │
│  JWT Auth + Multer       │←───│   Llama 3.3 70B          │
└──────────────────────────┘    └──────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│                 DATABASE (MySQL 8.0)                    │
│  Users, Patients, Doctors, Consultations, Documents     │
│  Prescriptions, Appointments, Community, Wallets        │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│             HEDERA SERVICES (Testnet)                   │
│  HCS (Audit Trail) + HFS (Documents) + HTS (Tokens)     │
└─────────────────────────────────────────────────────────┘
```

### **Services Hedera**

| Service | Fonction | Utilisé pour |
|---------|----------|--------------|
| **HCS** | Consensus Service | Audit trail immuable de toutes les actions |
| **HFS** | File Service | Documents médicaux immuables |
| **HTS** | Token Service | Token KenePoints (10M supply) |

---

## **📊 Fonctionnalités principales**

### **Pour les Patients** 🏥
- ✅ Dossier de Santé Électronique (DSE)
- ✅ **IA Clinique** - Analyse des symptômes avec recommandations
- ✅ **Saisie vocale** - Transcription audio des symptômes
- ✅ Consultations médicales
- ✅ Documents médicaux (analyses, radios)
- ✅ Ordonnances
- ✅ Rendez-vous
- ✅ Partage DSE avec médecins
- ✅ Recommandations médecins par spécialité
- ✅ Centres de santé à proximité (géolocalisation)
- ✅ Communauté santé
- ✅ KenePoints et badges

### **Pour les Médecins** 🩺
- ✅ Assistant IA
- ✅ Gestion des patients
- ✅ Accès DSE (avec autorisation)
- ✅ Création consultations
- ✅ Upload documents médicaux
- ✅ Prescriptions électroniques
- ✅ Rendez-vous
- ✅ KenePoints pour actions

### **Pour les Admins** 👔
- ✅ Validation des medecins dans sa structure
- ✅ Gestion médecins/patients
- ✅ Statistiques globales
- ✅ Modération communauté

### **Pour le SuperAdmin** 👑
- ✅ Validation des structures de santé
- ✅ Monitoring et suivi des flux dans l'application
- ✅ Gestion catégories communauté
- ✅ Création categorie communauté
- ✅ Accès complet système

---

## **💰 Système KenePoints**

### **Comment gagner des KenePoints**

#### **MÉDECINS** 🩺
- Consultation complétée : **+150 KNP**
- Document uploadé : **+20 KNP**

#### **PATIENTS** 🏥
- Partage DSE : **+150 KNP**
- RDV Honoré : **+100 KNP**
- Profil complété : **+200 KNP**

### **Badges**

| Badge | Solde KNP | Avantages |
|-------|-----------|-----------|
| 🥉 **BRONZE** | 0-499 | Accès de base |
| 🥈 **ARGENT** | 500-1999 | Support prioritaire |
| 🥇 **OR** | 2000-4999 | Fonctionnalités avancées |
| 💎 **PLATINE** | 5000-9999 | Événements exclusifs |
| 👑 **VIP** | 10000+ | Accès premium |

### **Modèle "Gain uniquement"**
- ✅ Les utilisateurs **gagnent** des KenePoints
- ❌ Les KenePoints **ne se dépensent pas**
- 💡 Système de fidélisation et gamification

---

## **🔐 Sécurité**

### **Authentification**
- ✅ JWT (JSON Web Tokens)
- ✅ Tokens expiration : 7 jours
- ✅ Mots de passe hashés (bcrypt)
- ✅ RBAC (Role-Based Access Control)

### **Protection des données**
- ✅ CORS configuré
- ✅ Helmet.js (sécurité HTTP)
- ✅ Rate limiting
- ✅ Validation des inputs (Zod)
- ✅ Upload sécurisé (Multer)

### **Hedera Hashgraph**
- ✅ Hash SHA-256 des données (pas de données sensibles sur chaîne)
- ✅ Signature HMAC des messages
- ✅ Vérification d'intégrité des fichiers
- ✅ Audit trail immuable

---

## **📁 Structure du projet**

```
Santekene/
├── backend-api/
│   ├── prisma/
│   │   ├── schema.prisma          # Schéma DB
│   │   ├── migrations/            # Historique migrations
│   │   └── seed.ts                # Seed SuperAdmin
│   ├── src/
│   │   ├── controllers/           # 18 contrôleurs
│   │   ├── routes/                # 18 routes
│   │   ├── middleware/            # Auth, RBAC, Upload, Rate limit
│   │   ├── services/              # 12 services (dont Hedera)
│   │   ├── types/                 # Types TypeScript
│   │   ├── workers/               # Workers Hedera
│   │   ├── scripts/               # Scripts Hedera
│   │   └── server.ts              # Serveur Express
│   ├── uploads/                   # Fichiers uploadés
│   ├── .env                       # Variables environnement
│   └── package.json
├── backend-ia/
│   ├── main.py                    # Serveur FastAPI
│   ├── requirements.txt           # Dépendances Python
│   └── .env                       # GROQ_API_KEY
├── frontend/
│   ├── src/
│   │   ├── app/                   # Pages Next.js
│   │   │   ├── dashboard/         # Pages dashboard
│   │   │   │   └── patient/
│   │   │   │       └── triage/    # Page IA Triage
│   │   │   ├── login/            
│   │   │   └── register/
│   │   ├── components/            # 50+ composants React
│   │   │   ├── patient/           # AITriageForm, AITriageResults
│   │   │   └── ai/                # AISuggestionsDisplay
│   │   ├── context/               # AuthContext
│   │   ├── hooks/                 # Custom hooks
│   │   └── lib/                   # Utilitaires
│   ├── public/                    # Assets
│   ├── .env.local                 # NEXT_PUBLIC_AI_API_URL
│   └── package.json
├── INSTALLATION_GUIDE.md          # Guide installation
├── HEDERA_INTEGRATION_GUIDE.md    # Guide Hedera
├── FLUTTER_INTEGRATION_GUIDE.md   # Guide Flutter
└── README.md                      # Ce fichier
```

---

## **🛠️ Scripts utiles**

### **Backend API (Node.js)**

```bash
# Développement
npm run dev                        # Démarrer backend (dev)
npm run build                      # Compiler TypeScript
npm start                          # Démarrer backend (prod)

# Base de données
npx prisma migrate dev             # Créer/appliquer migrations
npx prisma generate                # Générer client Prisma
npx prisma db seed                 # Seed SuperAdmin

# Hedera
node src/scripts/create-hcs-topic.ts        # Créer Topic HCS
node src/scripts/create-kenepoint-token.ts  # Créer Token KNP
node show-hedera-links.cjs                  # Afficher liens HashScan
```

### **Backend IA (Python)**

```bash
# Installation
python -m pip install -r requirements.txt

# Développement
python -m uvicorn main:app --reload --port 8000

# Production
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### **Frontend (Next.js)**

```bash
# Développement
npm run dev                        # Démarrer frontend (dev)
npm run build                      # Build production
npm start                          # Démarrer frontend (prod)
```

---

### **Services Hedera**

### **Ressources externes**
- **Hedera Docs** : https://docs.hedera.com
- **Hedera Portal** : https://portal.hedera.com
- **HashScan Testnet** : https://hashscan.io/testnet
- **Prisma Docs** : https://www.prisma.io/docs
- **Next.js Docs** : https://nextjs.org/docs

---

## **✅ Vérifications post-installation**

### **1. Backend API fonctionne**
```
http://localhost:3001
# Attendu: 🌿 Santé Kènè API est en ligne !
```

### **2. Backend IA fonctionne**
```
http://localhost:8000/docs
# Attendu: Page Swagger/OpenAPI de l'API IA
```

### **3. Frontend accessible**
```
http://localhost:3000
# Attendu: Page d'accueil Santé Kènè
```

### **4. Connexion SuperAdmin**
- Email : `superadmin@santekene.com`
- Mot de passe : `SuperAdmin2024!`
- Devrait rediriger vers `/dashboard/superadmin`

### **5. Triage IA** *(si backend IA installé)*
- Se connecter en tant que patient
- Aller sur **IA Clinique** (menu)
- Tester la saisie de symptômes
- Attendu : Analyse + recommandations

### **6. Base de données**
```sql
USE santekene;
SELECT COUNT(*) FROM User WHERE role = 'SUPERADMIN';
-- Attendu: 1
```

---

## **❌ Dépannage rapide**

| Problème | Solution |
|----------|----------|
| Port 3001 utilisé | Changer `PORT` dans `.env` (backend-api) |
| Port 8000 utilisé | Changer `--port 8001` lors du démarrage (backend-ia) |
| Erreur MySQL | Vérifier `DATABASE_URL` dans `.env` (backend-api) |
| Services Hedera indisponibles | Vérifier `HEDERA_*` dans `.env` (sans guillemets) |
| Erreur Prisma EPERM | Arrêter backend → `npx prisma generate` → Redémarrer |
| Migration échoue | Supprimer dossiers vides dans `prisma/migrations/` |
| Backend IA ne démarre pas | Vérifier `GROQ_API_KEY` dans `.env` (backend-ai) |
| Erreur triage IA | Vérifier que backend IA est démarré sur port 8000 |
| Erreur 400 model decommissioned | Modèle groq obsolète, vérifier la version dans main.py |
| Pas de recommandations | Vérifier `BACKEND_URL` dans `.env` (backend-ai) |

---

## **📈 Prochaines étapes**

1. ✅ **Installation complète** → `INSTALLATION_GUIDE.md`
2. ✅ **Comprendre Hedera** → `HEDERA_INTEGRATION_GUIDE.md`
3. ✅ **Développer mobile** → `FLUTTER_INTEGRATION_GUIDE.md`
4. 🚀 **Déploiement production** (bientôt)
5. 📱 **Application mobile** (en cours d'integration du backend avec Flutter)

---

## **💡 Notes importantes**

### **Services Hedera (Testnet)**
- Les services Hedera sont sur **Testnet** (gratuit)
- Les HBAR testnet sont obtenus gratuitement sur le faucet
- Pour passer en **Mainnet** : Changer les IDs et clés dans `.env`

### **KenePoints**
- Les transactions KNP sont dans la **base de données** (rapide, gratuit)
- Les événements sont enregistrés sur **Hedera HCS** (audit trail)
- Les tokens **HTS** restent dans le Treasury (pas de transferts réels pour l'instant)

### **Documents**
- Documents stockés **localement** ET sur **Hedera HFS** (double stockage)
- Upload HFS **non-bloquant** (arrière-plan)
- Vérification d'intégrité possible via hash SHA-256

---

## **👥 Rôles utilisateurs**

| Rôle | Accès | Fonctionnalités |
|------|-------|-----------------|
| **PATIENT** | DSE, Consultations, Documents, Rendez-vous, Communauté | Gestion santé personnelle |
| **MEDECIN** | Patients, Consultations, Documents (upload), Ordonnances | Pratique médicale |
| **ADMIN** | Structures, Utilisateurs, Statistiques | Administration |
| **SUPERADMIN** | Tout + Catégories + Posts communauté | Administration complète |

---

---

## **📞 Support : aboubacarbane@gmail.com**

- **Documentation** : Consultez les 3 guides MD
- **Logs backend** : `npm run dev` (terminal backend)
- **Logs frontend** : Console navigateur (F12)

---

**Version** : 1.0.0  
**Date** : Octobre 2025  
**Hedera Services** : HCS + HFS + HTS  
**IA Backend** : Python/FastAPI + Groq API (Llama 3.3 70B + Whisper)  
**Licence** : MIT (à définir)

🚀 **Bonne utilisation de Santé Kènè !**

