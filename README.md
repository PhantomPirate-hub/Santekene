# 🏥 **Santé Kènè - Documentation Complète**

## **📚 Documentation disponible**

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
- ✅ Architecture hybride DB + Blockchain
- ✅ Workflows complets
- ✅ Vérification sur HashScan

**→ Consultez ce guide pour comprendre comment fonctionne Hedera**

### **3. 📱 Flutter Integration Guide** (`FLUTTER_INTEGRATION_GUIDE.md`)
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

### **4. 🤖 Backend IA** (dans ce README)
L'intégration IA est documentée directement dans ce README :
- ✅ Triage IA des symptômes (Groq Llama 3.3)
- ✅ Assistant médical pour diagnostics (Groq)
- ✅ Transcription audio (Whisper)
- ✅ Recommandations médecins et centres de santé
- ✅ Installation et configuration Backend IA
- ✅ API Endpoints et exemples d'utilisation

**→ Consultez la section "Intelligence Artificielle" ci-dessous**

---

## **🎯 Démarrage rapide**

### **Backend API (Node.js)**
```bash
cd backend-api
npm install
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run dev
```

### **Backend IA (Python)**
```bash
cd backend-ia
python -m pip install -r requirements.txt
# Créer .env avec GROQ_API_KEY
python -m uvicorn main:app --reload --port 8000
```

### **Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev
```

### **Accès**
- Frontend : `http://localhost:3000`
- Backend API : `http://localhost:3001`
- Backend IA : `http://localhost:8000`
- SuperAdmin : `superadmin@santekene.com` / `SuperAdmin2024!`

---

## **🏗️ Architecture**

### **Stack Technique**

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                 │
│  React + TypeScript + Tailwind + Shadcn UI              │
└─────────────────────────────────────────────────────────┘
           ↓ HTTP/REST (3001)      ↓ HTTP/REST (8000)
┌──────────────────────────┐    ┌──────────────────────────┐
│   BACKEND API (Express)  │    │   BACKEND IA (FastAPI)   │
│  TypeScript + Prisma ORM │    │   Python + Groq API      │
│  JWT Auth + Multer       │←───│   Llama 3.3 70B          │
└──────────────────────────┘    └──────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL 8.0)                    │
│  Users, Patients, Doctors, Consultations, Documents     │
│  Prescriptions, Appointments, Community, Wallets        │
└─────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────┐
│              HEDERA SERVICES (Testnet)                   │
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

## **🤖 Intelligence Artificielle**

L'application intègre un **backend IA séparé** (Python/FastAPI) pour l'analyse des symptômes et les recommandations médicales.

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

### **Installation Backend IA**

Le backend IA utilise **Groq API** (gratuit et ultra-rapide) :

```bash
# Prérequis
cd backend-ai
pip install -r requirements.txt

# Configuration
# Créer un fichier .env avec votre clé Groq
echo "GROQ_API_KEY=votre_cle_ici" > .env

# Démarrage
python -m uvicorn main:app --reload --port 8000
```

**Obtenir une clé Groq (GRATUIT)** :
1. Aller sur https://console.groq.com/keys
2. Créer un compte gratuit
3. Générer une clé API
4. L'ajouter dans `backend-ai/.env`

### **API Endpoints IA**

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/ai/triage` | POST | Analyse des symptômes |
| `/api/ai/transcribe` | POST | Transcription audio → texte |
| `/api/ai/recommend-doctors` | GET | Recommandations médecins |
| `/api/ai/recommend-health-centers` | GET | Centres de santé proches |

### **Utilisation**

#### **1. Saisie texte**
```typescript
// Frontend appelle directement le backend IA
const response = await fetch('http://localhost:8000/api/ai/triage', {
  method: 'POST',
  body: new URLSearchParams({ symptoms: 'fièvre et maux de tête' }),
});
```

#### **2. Saisie vocale**
```typescript
// 1. Enregistrement audio via navigator.mediaDevices
// 2. Envoi au backend IA pour transcription
const formData = new FormData();
formData.append('audio_file', audioBlob, 'recording.webm');

const response = await fetch('http://localhost:8000/api/ai/transcribe', {
  method: 'POST',
  body: formData,
});

// 3. Transcription automatique puis analyse
```

### **Exemple de réponse IA**

```json
{
  "severity": "moderate",
  "diagnosis": "Probable infection respiratoire",
  "recommendations": [
    "Consulter un médecin généraliste",
    "Se reposer et s'hydrater",
    "Surveiller la température"
  ],
  "specialties": ["Médecine générale", "Pneumologie"],
  "urgency_level": 2,
  "recommended_doctors": [
    {
      "name": "Dr. Diallo",
      "specialty": "Médecine générale",
      "location": "Conakry",
      "distance": 2.3
    }
  ],
  "health_centers": [
    {
      "name": "Hôpital Ignace Deen",
      "address": "Kaloum, Conakry",
      "distance": 1.5
    }
  ]
}
```

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
| Erreur 400 model decommissioned | Modèle Groq obsolète, vérifier la version dans main.py |
| Pas de recommandations | Vérifier `BACKEND_URL` dans `.env` (backend-ai) |

---

## **📈 Prochaines étapes**

1. ✅ **Installation complète** → `INSTALLATION_GUIDE.md`
2. ✅ **Comprendre Hedera** → `HEDERA_INTEGRATION_GUIDE.md`
3. ✅ **Développer mobile** → `FLUTTER_INTEGRATION_GUIDE.md`
4. 🚀 **Déploiement production** (bientôt)
5. 📱 **Application mobile** (en cours avec Flutter)

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

## **🎉 Félicitations !**

Vous avez maintenant accès à une **application de santé complète** avec :
- ✅ Frontend moderne (Next.js 14)
- ✅ Backend robuste (Node.js + Express)
- ✅ Backend IA (Python + FastAPI + Groq API)
- ✅ Base de données relationnelle (MySQL + Prisma)
- ✅ Blockchain Hedera (HCS + HFS + HTS)
- ✅ Intelligence Artificielle (Llama 3.3 70B)
- ✅ Système de gamification (KenePoints + Badges)
- ✅ Intégration mobile prête (Flutter)

---

## **📞 Support**

- **Documentation** : Consultez les 3 guides MD
- **Logs backend** : `npm run dev` (terminal backend)
- **Logs frontend** : Console navigateur (F12)
- **HashScan** : `node show-hedera-links.js`

---

**Version** : 1.0.0  
**Date** : Octobre 2025  
**Hedera Services** : HCS + HFS + HTS  
**IA Backend** : Python/FastAPI + Groq API (Llama 3.3 70B + Whisper)  
**Licence** : MIT (à définir)

🚀 **Bonne utilisation de Santé Kènè !**

