# 🔐 Configuration des Variables d'Environnement

Ce guide vous aide à configurer les fichiers `.env` pour chaque service.

---

## 📁 **Backend API** (`backend-api/.env`)

Créez un fichier `backend-api/.env` avec le contenu suivant :

```env
# Base de données MySQL
DATABASE_URL="mysql://santekene_user:VOTRE_MOT_DE_PASSE@localhost:3306/santekene"

# JWT Secret (générez une chaîne aléatoire)
JWT_SECRET="votre-secret-jwt-tres-long-et-securise-ici"

# Port du serveur
PORT=3001

# Hedera (optionnel - laisser vide pour commencer)
HEDERA_ACCOUNT_ID=""
HEDERA_PRIVATE_KEY=""

# OpenAI (optionnel)
OPENAI_API_KEY=""
```

### 🔑 Comment remplir :

1. **DATABASE_URL** : 
   - Remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe MySQL
   - Si vous utilisez un autre utilisateur, changez `santekene_user`
   
2. **JWT_SECRET** :
   ```bash
   # Générer un secret aléatoire :
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **HEDERA** : Laissez vide pour l'instant (optionnel)

4. **OPENAI_API_KEY** : Laissez vide pour l'instant (optionnel)

---

## 🎨 **Frontend** (`frontend/.env.local`)

Créez un fichier `frontend/.env.local` avec :

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:8000
```

### 📝 Notes :
- **NEXT_PUBLIC_BACKEND_URL** : URL du backend Node.js (port 3001 par défaut)
- **NEXT_PUBLIC_AI_BACKEND_URL** : URL du backend Python (port 8000 par défaut)

---

## 🤖 **Backend IA** (`backend-ai/.env`)

⚠️ **OPTIONNEL** - Nécessaire uniquement pour les fonctionnalités IA.

Créez un fichier `backend-ai/.env` avec :

```env
OPENAI_API_KEY="sk-proj-VOTRE_CLE_OPENAI_ICI"
```

### 🔑 Obtenir une clé OpenAI :

1. Allez sur https://platform.openai.com/api-keys
2. Créez un compte (si vous n'en avez pas)
3. Créez une nouvelle clé API
4. Copiez la clé (elle commence par `sk-proj-...`)
5. Collez-la dans le fichier `.env`

**Coût estimé** : ~$5-10/mois pour un usage normal (modèle `gpt-4o-mini`)

---

## ✅ Vérification

### Vérifier que les fichiers .env existent :

```bash
# Backend API
ls backend-api/.env

# Frontend
ls frontend/.env.local

# Backend AI (optionnel)
ls backend-ai/.env
```

### Vérifier que les fichiers sont ignorés par Git :

```bash
git status
# Les fichiers .env NE DOIVENT PAS apparaître
```

---

## 🚨 Important

❌ **NE PARTAGEZ JAMAIS vos fichiers .env !**
- Ils contiennent des secrets
- Ils sont dans `.gitignore` pour une raison
- Ne les commitez JAMAIS dans Git

✅ **À la place** :
- Partagez ce fichier `ENV_SETUP.md`
- Chaque développeur crée ses propres fichiers `.env`

---

## 🔄 Mise à jour des secrets

Si vous pensez qu'un secret a été compromis :

1. **JWT_SECRET** : Régénérez-le (tous les utilisateurs devront se reconnecter)
2. **OPENAI_API_KEY** : Créez une nouvelle clé sur OpenAI et révoqué l'ancienne
3. **DATABASE_URL** : Changez le mot de passe MySQL

---

## 📋 Checklist de configuration

- [ ] MySQL installé et démarré
- [ ] Base de données `santekene` créée
- [ ] Fichier `backend-api/.env` créé et rempli
- [ ] Fichier `frontend/.env.local` créé
- [ ] `npx prisma migrate dev` exécuté avec succès
- [ ] `npx prisma db seed` exécuté avec succès
- [ ] Les 3 serveurs démarrent sans erreur

---

## 🆘 Dépannage

### Erreur : "JWT_SECRET is not defined"
→ Vérifiez que `backend-api/.env` existe et contient `JWT_SECRET`

### Erreur : "NEXT_PUBLIC_BACKEND_URL is not defined"
→ Redémarrez le serveur Next.js après avoir créé `.env.local`

### Erreur : "Connection refused" (MySQL)
→ Vérifiez que MySQL est démarré et que `DATABASE_URL` est correct

