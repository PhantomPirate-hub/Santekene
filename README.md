# 🏥 Santé Kènè - Plateforme de Santé Décentralisée

Plateforme de gestion médicale innovante avec IA, blockchain (Hedera) et téléconsultation.

---

## 🚀 Installation Rapide

### Prérequis
- **Node.js** 18+ 
- **Python** 3.11.x
- **MySQL** (ou MariaDB)
- **Git**

---

## 📦 Installation Complète

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/votre-username/Santekene.git
cd Santekene
```

---

### 2️⃣ Configuration de la Base de Données MySQL

**Créer la base de données :**

```sql
CREATE DATABASE santekene;
CREATE USER 'santekene_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON santekene.* TO 'santekene_user'@'localhost';
FLUSH PRIVILEGES;
```

---

### 3️⃣ Backend API (Node.js/Express)

```bash
cd backend-api

# Installer les dépendances
npm install

# Créer le fichier .env
# Copiez le contenu ci-dessous et remplacez les valeurs
```

**Fichier `backend-api/.env` à créer :**

```env
# Base de données
DATABASE_URL="mysql://santekene_user:votre_mot_de_passe@localhost:3306/santekene"

# JWT Secret (générez une chaîne aléatoire longue)
JWT_SECRET="changez-moi-par-une-chaine-aleatoire-tres-longue-et-securisee"

# Port du serveur
PORT=3001

# Hedera (optionnel - laisser vide pour l'instant)
HEDERA_ACCOUNT_ID=""
HEDERA_PRIVATE_KEY=""

# OpenAI (optionnel pour l'instant)
OPENAI_API_KEY=""
```

**Initialiser la base de données :**

```bash
# Générer le client Prisma
npx prisma generate

# Créer les tables
npx prisma migrate dev --name init

# Peupler avec des données de test
npx prisma db seed
```

**Lancer le serveur :**

```bash
npm run dev
# ✅ Serveur démarré sur http://localhost:3001
```

---

### 4️⃣ Frontend (Next.js)

```bash
cd ../frontend

# Installer les dépendances
npm install

# Créer le fichier .env.local
```

**Fichier `frontend/.env.local` à créer :**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000
```

**Lancer le serveur :**

```bash
npm run dev
# ✅ Application disponible sur http://localhost:3000
```

---

### 5️⃣ Backend IA (Python/FastAPI) - OPTIONNEL

⚠️ **Cette partie est optionnelle** - L'application fonctionne sans l'IA, mais certaines fonctionnalités seront désactivées.

```bash
cd ../backend-ai

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Windows :
.\venv\Scripts\Activate.ps1
# Linux/Mac :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
```

**Fichier `backend-ai/.env` à créer :**

```env
OPENAI_API_KEY="sk-proj-VOTRE_CLE_OPENAI_ICI"
```

> 🔑 **Obtenir une clé OpenAI** : https://platform.openai.com/api-keys

**Lancer le serveur :**

```bash
python main.py
# ✅ Serveur IA démarré sur http://localhost:8000
```

---

## 🧪 Test de l'Application

### Comptes de test (créés automatiquement par le seed)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| **Patient** | `patient@test.com` | `password123` |
| **Médecin** | `medecin@test.com` | `password123` |
| **Admin** | `admin@test.com` | `password123` |

### URLs de test

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Backend IA** : http://localhost:8000 (optionnel)
- **API Docs** : http://localhost:8000/docs (FastAPI)

---

## 🎯 Fonctionnalités Principales

### Pour les Patients 👤
- ✅ Dossier Électronique de Santé (DSE)
- ✅ Triage IA avant consultation
- ✅ Prise de rendez-vous en ligne
- ✅ Téléconsultation vidéo (Jitsi Meet)
- ✅ Ordonnances numériques
- ✅ KènèPoints (système de récompenses)

### Pour les Médecins 👨‍⚕️
- ✅ Gestion des consultations
- ✅ Historique complet avec filtres
- ✅ Calendrier des RDV (jour/semaine/mois)
- ✅ Assistant IA pour le diagnostic
- ✅ Notifications en temps réel
- ✅ Modification des consultations
- ✅ Statistiques détaillées

### Pour les Admins 🛡️
- ✅ Gestion des utilisateurs
- ✅ Validation des médecins
- ✅ Monitoring de la plateforme
- ✅ Statistiques globales

---

## 🔧 Scripts Utiles

### Backend API

```bash
# Réinitialiser la base de données
npx prisma migrate reset

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio

# Lancer les tests
npm test

# Build pour production
npm run build
```

### Frontend

```bash
# Build pour production
npm run build

# Lancer en mode production
npm start

# Linter
npm run lint
```

---

## 📁 Structure du Projet

```
Santekene/
├── frontend/           # Next.js (React)
│   ├── src/
│   │   ├── app/       # Pages et routes
│   │   ├── components/# Composants React
│   │   ├── context/   # Contextes (Auth, HashConnect)
│   │   └── lib/       # Utilitaires
│   └── package.json
│
├── backend-api/       # Express + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
│
├── backend-ai/        # FastAPI + LangChain + OpenAI
│   ├── main.py
│   └── requirements.txt
│
└── README.md
```

---

## 🐛 Dépannage

### Erreur : "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Erreur : "Cannot find module 'prisma'"

```bash
cd backend-api
npx prisma generate
```

### Erreur : "Connection refused" (MySQL)

- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `DATABASE_URL`
- Vérifiez que la base de données `santekene` existe

### L'IA ne fonctionne pas

- Vérifiez que le serveur Python est lancé (port 8000)
- Vérifiez votre clé OpenAI
- Vérifiez que vous avez des crédits OpenAI

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

Ce projet est sous licence MIT.

---

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@santekene.com
- 📝 Issues : https://github.com/votre-username/Santekene/issues

---

## 🙏 Remerciements

- **Hedera Hashgraph** pour la blockchain
- **OpenAI** pour les capacités IA
- **Jitsi Meet** pour la visioconférence
- **Prisma** pour l'ORM
- **Next.js** pour le framework frontend

---

**Développé avec ❤️ pour révolutionner la santé en Afrique**

