# 🚀 Guide de Démarrage - Santé Kènè

## ✅ Prérequis (Déjà installés)
- ✅ Node.js et npm installés
- ✅ Python 3.x installé
- ✅ MySQL/MariaDB (via Laragon)
- ✅ Toutes les dépendances installées

---

## 📋 Configuration des Variables d'Environnement

### 1️⃣ Backend API - `backend-api/.env`

Créez le fichier `backend-api/.env` avec le contenu suivant :

```env
# Database Configuration
DATABASE_URL="mysql://root:@localhost:3306/santekene"

# JWT Configuration
JWT_SECRET="votre_secret_jwt_super_securise_changez_moi"

# Server Configuration
PORT=3001

# Hedera Blockchain Configuration
HEDERA_NETWORK="testnet"
HEDERA_ACCOUNT_ID="votre_account_id_hedera"
HEDERA_PRIVATE_KEY="votre_private_key_hedera"
HEDERA_HCS_TOPIC_ID="votre_topic_id_hedera"

# Encryption Key for sensitive data
AES_ENCRYPTION_KEY="votre_cle_encryption_32_caracteres_minimum"
```

**Notes importantes :**
- Ajustez `DATABASE_URL` si votre configuration MySQL est différente
- Remplacez `JWT_SECRET` par une clé secrète forte
- Les variables Hedera sont nécessaires seulement si vous utilisez la blockchain

---

### 2️⃣ Backend AI - `backend-ai/.env`

Créez le fichier `backend-ai/.env` avec le contenu suivant :

```env
# OpenAI API Configuration
OPENAI_API_KEY="votre_cle_api_openai"
```

**Note :** Vous devez obtenir une clé API OpenAI sur https://platform.openai.com/api-keys

---

## 🚀 Démarrage des Services

Vous aurez besoin de **3 terminaux différents** (ou onglets PowerShell).

### Terminal 1 : Backend API (Port 3001)

```powershell
cd C:\laragon\www\Santekene\backend-api
npm run dev
```

**Résultat attendu :** 
```
🚀 Serveur démarré sur http://localhost:3001
```

---

### Terminal 2 : Backend AI (Port 8000)

```powershell
cd C:\laragon\www\Santekene\backend-ai
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

**Résultat attendu :** 
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

---

### Terminal 3 : Frontend (Port 3000)

```powershell
cd C:\laragon\www\Santekene\frontend
npm run dev
```

**Résultat attendu :** 
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

---

## 🌐 URLs de l'Application

Une fois tous les services démarrés :

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface utilisateur |
| **Backend API** | http://localhost:3001 | API REST |
| **Backend AI** | http://localhost:8000 | Services IA (Whisper, Triage) |
| **API Docs (AI)** | http://localhost:8000/docs | Documentation Swagger du Backend AI |

---

## ✅ Vérification des Services

### 1. Tester le Backend API
Ouvrez votre navigateur ou utilisez Postman :
```
GET http://localhost:3001/
```
Réponse attendue : `🌿 Santé Kènè API est en ligne !`

### 2. Tester le Backend AI
```
GET http://localhost:8000/
```
Réponse attendue : `{"message": "Santé Kènè AI Service is running."}`

### 3. Tester le Frontend
Ouvrez votre navigateur :
```
http://localhost:3000
```
Vous devriez voir la page d'accueil de Santé Kènè.

---

## 🔧 Dépannage

### Problème : Port déjà utilisé

Si un port est déjà utilisé, vous pouvez :

1. **Trouver le processus :**
```powershell
netstat -ano | findstr :3001
netstat -ano | findstr :8000
netstat -ano | findstr :3000
```

2. **Tuer le processus :**
```powershell
taskkill /PID <PID> /F
```

### Problème : Erreur de connexion à la base de données

1. Vérifiez que MySQL/MariaDB est démarré dans Laragon
2. Vérifiez que la base de données `santekene` existe
3. Vérifiez les identifiants dans `DATABASE_URL`

### Problème : Module non trouvé

```powershell
# Backend API
cd backend-api
npm install

# Backend AI
cd backend-ai
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## 📊 Base de Données

Si vous avez déjà fait la migration Prisma, votre base de données devrait être prête.

Pour vérifier ou réexécuter les migrations :

```powershell
cd backend-api
npx prisma migrate dev
npx prisma generate
```

Pour remplir la base avec des données de test :

```powershell
npx ts-node prisma/seed.ts
```

---

## 🛠️ Scripts Utiles

### Backend API
```powershell
npm run dev          # Démarrage en mode développement
npx prisma studio    # Interface graphique de la base de données
```

### Backend AI
```powershell
uvicorn main:app --reload              # Démarrage en mode développement
uvicorn main:app --reload --port 8001  # Démarrage sur un autre port
```

### Frontend
```powershell
npm run dev          # Démarrage en mode développement
npm run build        # Build de production
npm run start        # Démarrage de production
```

---

## 🎓 Prochaines Étapes

1. **Créer un compte** sur l'application
2. **Tester les fonctionnalités** :
   - Inscription / Connexion
   - Dashboard selon le rôle (Patient, Médecin, Admin)
   - Triage IA
   - Consultation
   - etc.

3. **Configurer Hedera** (optionnel) :
   - Créer un compte Hedera testnet
   - Créer un topic HCS
   - Mettre à jour les variables dans `.env`

---

## 📝 Notes

- En développement, tous les services se rechargent automatiquement lors des modifications
- Les logs de chaque service apparaissent dans leur terminal respectif
- Pour arrêter un service : `Ctrl+C` dans son terminal

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans chaque terminal
2. Vérifiez que tous les services sont démarrés
3. Vérifiez les fichiers `.env`
4. Consultez la documentation de chaque technologie utilisée

---

**Bonne chance avec Santé Kènè ! 🌿**

