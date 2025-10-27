# 🔑 CONFIGURATION CLÉ API OPENAI

## ⚠️ Erreur : "Incorrect API key provided"

Cette erreur signifie que votre clé API OpenAI est **invalide** ou **expirée**.

---

## ✅ **SOLUTION EN 3 ÉTAPES**

### 1️⃣ **Obtenir une nouvelle clé API OpenAI**

#### A. Créer un compte OpenAI (si vous n'en avez pas)
1. Allez sur : https://platform.openai.com/signup
2. Créez un compte (email + mot de passe)
3. Vérifiez votre email
4. **Bonus** : Les nouveaux comptes reçoivent 5$ de crédits gratuits ! 🎉

#### B. Obtenir votre clé API
1. Allez sur : https://platform.openai.com/api-keys
2. Cliquez sur **"Create new secret key"**
3. Donnez un nom à votre clé (ex: "Santekene-IA")
4. **IMPORTANT** : Copiez la clé IMMÉDIATEMENT
   - Format : `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Elle ne sera **plus visible** après fermeture de la fenêtre
5. Collez-la dans un fichier texte temporaire

---

### 2️⃣ **Configurer la clé dans l'application**

#### A. Ouvrir le fichier `.env`
Naviguez vers : `C:\laragon\www\Santekene\backend-ai\.env`

**Si le fichier n'existe pas** :
- Créez un nouveau fichier nommé `.env` (sans extension .txt)
- Dans le dossier `backend-ai`

#### B. Contenu du fichier
Ajoutez cette ligne avec **VOTRE** clé :
```env
OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI
```

**Exemple** :
```env
OPENAI_API_KEY=sk-proj-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

#### C. Sauvegarder
- Appuyez sur **Ctrl+S**
- Fermez le fichier

---

### 3️⃣ **Redémarrer le backend IA**

#### Option A : Rechargement automatique
Si vous avez lancé avec `--reload`, le serveur **devrait redémarrer automatiquement** après avoir sauvegardé le `.env`.

Vérifiez le terminal, vous devriez voir :
```
INFO:     Will watch for changes in these directories: [...]
WARNING:  Detected file change in '.../.env'. Reloading...
```

#### Option B : Redémarrage manuel
1. Dans le terminal du backend IA, appuyez sur **Ctrl+C**
2. Relancez :
   ```bash
   uvicorn main:app --reload --port 8000
   ```
3. Attendez de voir :
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```

---

## 🧪 **TESTER**

1. **Retournez sur l'application** (http://localhost:3000)
2. **Connectez-vous** : `patient1@example.com` / `1234`
3. **Menu** → **IA Clinique**
4. **Tapez** : `"J'ai mal à la tête et de la fièvre depuis 2 jours"`
5. **Cliquez** : "Analyser mes symptômes"
6. **Résultat attendu** : Analyse IA s'affiche en dessous ✅

---

## 💰 **COÛT**

### Modèle utilisé : GPT-4o-mini

**Tarification OpenAI (2024)** :
- **Input** : $0.15 / 1M tokens
- **Output** : $0.60 / 1M tokens

**Pour une analyse de symptômes** :
- Input : ~200 tokens (symptômes du patient)
- Output : ~400 tokens (analyse complète)
- **Coût** : ~$0.0003 par analyse (0.03 centimes)

**Avec 5$ de crédits gratuits** :
- ~16,000 analyses de symptômes ! 🎉

**En production** :
- 100 analyses/jour = $0.03/jour = $1/mois

---

## 🔒 **SÉCURITÉ**

### ⚠️ NE JAMAIS :
- ❌ Partager votre clé API publiquement
- ❌ Commiter le fichier `.env` dans Git (déjà dans .gitignore)
- ❌ Publier des captures d'écran avec la clé visible

### ✅ BONNES PRATIQUES :
- ✅ Gardez la clé dans `.env` uniquement
- ✅ Renouvelez la clé régulièrement
- ✅ Utilisez des clés différentes pour dev/prod
- ✅ Surveillez votre usage sur https://platform.openai.com/usage

---

## 🛠️ **DÉPANNAGE**

### Problème 1 : "Module 'openai' not found"
**Solution** :
```bash
cd backend-ai
venv\Scripts\activate
pip install openai
```

### Problème 2 : "Rate limit exceeded"
**Signification** : Trop de requêtes en peu de temps

**Solutions** :
- Attendez 1 minute
- Augmentez votre plan OpenAI
- Ajoutez un rate limiter côté application

### Problème 3 : "Insufficient funds"
**Signification** : Crédits épuisés

**Solutions** :
- Vérifiez votre usage : https://platform.openai.com/usage
- Ajoutez des crédits : https://platform.openai.com/account/billing

### Problème 4 : Clé toujours invalide après changement
**Solutions** :
1. Vérifiez qu'il n'y a pas d'espaces avant/après la clé dans `.env`
2. Vérifiez que le fichier s'appelle bien `.env` (pas `.env.txt`)
3. Redémarrez complètement le backend IA (Ctrl+C puis relancer)
4. Créez une nouvelle clé sur OpenAI

---

## 🆓 **ALTERNATIVE GRATUITE (OLLAMA)**

Si vous ne pouvez pas utiliser OpenAI (pas de CB, etc.), on peut utiliser **Ollama** :

### Avantages Ollama :
- ✅ 100% gratuit
- ✅ Hors ligne
- ✅ Pas de limite
- ✅ Privé (vos données restent locales)

### Inconvénients Ollama :
- ❌ Moins précis médicalement
- ❌ Plus lent
- ❌ Nécessite plus de RAM (8GB+)

**Pour installer Ollama** :
1. Téléchargez : https://ollama.ai/download
2. Installez le modèle médical :
   ```bash
   ollama pull llama3
   ```
3. Modifiez `backend-ai/main.py` pour utiliser Ollama au lieu d'OpenAI

---

## 📞 **SUPPORT**

### Problèmes avec OpenAI :
- Documentation : https://platform.openai.com/docs
- Support : https://help.openai.com

### Problèmes avec l'application :
- Vérifiez les logs du terminal backend IA
- Ouvrez la console du navigateur (F12)
- Cherchez les messages d'erreur

---

## ✅ **CHECKLIST FINALE**

Avant de tester :

- [ ] Compte OpenAI créé
- [ ] Clé API générée (commence par `sk-proj-`)
- [ ] Fichier `backend-ai/.env` créé
- [ ] Clé copiée dans le `.env` (sans espaces)
- [ ] Fichier sauvegardé
- [ ] Backend IA redémarré
- [ ] Aucune erreur dans le terminal backend IA
- [ ] Test sur http://localhost:8000 fonctionne

**Si toutes les cases sont cochées, votre Triage IA devrait fonctionner ! 🎉**

---

## 🎯 **RÉSUMÉ RAPIDE**

```
1. https://platform.openai.com/api-keys
2. Create new secret key
3. Copier la clé (sk-proj-...)
4. backend-ai/.env : OPENAI_API_KEY=sk-proj-...
5. Sauvegarder (Ctrl+S)
6. Redémarrer : uvicorn main:app --reload --port 8000
7. Tester dans l'app !
```

**🚀 Bon courage ! Le Triage IA va bientôt fonctionner ! 🤖💚**

