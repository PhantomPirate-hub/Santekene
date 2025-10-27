# 🚀 Guide d'Installation - Santé Kènè

## 📋 Prérequis

- **Node.js** 18+ (pour frontend et backend-api)
- **Python** 3.11.x (pour backend-ai)
- **MySQL** (base de données)

---

## 🔧 Configuration Initiale

### 1️⃣ **Frontend (Next.js)**

```bash
cd frontend
npm install
```

**Créer le fichier `.env.local` :**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000
```

**Lancer le serveur :**
```bash
npm run dev
# → http://localhost:3000
```

---

### 2️⃣ **Backend API (Node.js/Express)**

```bash
cd backend-api
npm install
```

**Créer le fichier `.env` :**
```env
DATABASE_URL="mysql://user:password@localhost:3306/santekene"
JWT_SECRET="votre-secret-jwt-ici"
PORT=3001

# Hedera (optionnel)
HEDERA_ACCOUNT_ID=""
HEDERA_PRIVATE_KEY=""

# OpenAI (optionnel)
OPENAI_API_KEY=""
```

**Configurer la base de données :**
```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

**Lancer le serveur :**
```bash
npm run dev
# → http://localhost:3001
```

---

### 3️⃣ **Backend AI (Python/FastAPI)**

```bash
cd backend-ai
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# ou
source venv/bin/activate     # Linux/Mac
```

**Installer les dépendances :**
```bash
pip install -r requirements.txt
```

**Créer le fichier `.env` :**
```env
OPENAI_API_KEY="sk-proj-VOTRE_CLE_ICI"
```

**Lancer le serveur :**
```bash
python main.py
# → http://localhost:8000
```

---

## ✅ Vérification

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | ✅ |
| Backend API | http://localhost:3001 | ✅ |
| Backend AI | http://localhost:8000 | ✅ |

---

## 📚 Documentation Complète

Voir `note.md` pour plus de détails sur la configuration Python.

