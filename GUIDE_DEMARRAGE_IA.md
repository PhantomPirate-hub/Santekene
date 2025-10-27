# 🚀 GUIDE DE DÉMARRAGE - BACKEND IA

## ❌ **ERREUR: "Failed to fetch"**

Cette erreur signifie que le **backend IA n'est pas démarré** ou n'est pas accessible.

---

## ✅ **SOLUTION: Démarrer le backend IA**

### 📋 **Étape 1: Créer le fichier .env**

Le backend IA a besoin d'une clé OpenAI pour fonctionner.

1. **Naviguez vers le dossier backend-ai** :
   ```bash
   cd backend-ai
   ```

2. **Créez un fichier nommé `.env`** (sans extension .txt)

3. **Ajoutez ce contenu** :
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Remplacez `your_openai_api_key_here`** par votre vraie clé OpenAI
   - Si vous n'avez pas de clé : https://platform.openai.com/api-keys
   - Format : `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 🐍 **Étape 2: Installer Python et les dépendances**

**Sur Windows :**

1. **Ouvrez un nouveau terminal** (PowerShell ou CMD)

2. **Naviguez vers backend-ai** :
   ```bash
   cd C:\laragon\www\Santekene\backend-ai
   ```

3. **Créez un environnement virtuel** :
   ```bash
   python -m venv venv
   ```

4. **Activez l'environnement** :
   ```bash
   venv\Scripts\activate
   ```
   Vous devriez voir `(venv)` devant votre ligne de commande.

5. **Installez les dépendances** :
   ```bash
   pip install -r requirements.txt
   ```

---

### 🚀 **Étape 3: Démarrer le serveur**

**Dans le même terminal (avec venv activé)** :

```bash
uvicorn main:app --reload --port 8000
```

**Vous devriez voir** :
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **Le backend IA est maintenant démarré !**

---

### 🧪 **Étape 4: Tester**

1. **Ouvrez votre navigateur** et allez sur :
   ```
   http://localhost:8000
   ```

2. **Vous devriez voir** :
   ```json
   {"message": "Santé Kènè AI Service is running."}
   ```

3. **Retournez sur votre application frontend**

4. **Essayez à nouveau le Triage IA** :
   - Menu → IA Clinique
   - Tapez vos symptômes
   - Cliquez "Analyser mes symptômes"

---

## 🐛 **PROBLÈMES COURANTS**

### 1. "python n'est pas reconnu"
**Solution** : Installez Python 3.8+
- Téléchargez : https://www.python.org/downloads/
- Cochez "Add Python to PATH" pendant l'installation

### 2. "pip n'est pas reconnu"
**Solution** : Utilisez `python -m pip` au lieu de `pip`

### 3. "Module 'fastapi' not found"
**Solution** : Installez les dépendances :
```bash
pip install -r requirements.txt
```

### 4. "OpenAI API Key error"
**Solutions** :
- Vérifiez que le fichier `.env` existe dans `backend-ai/`
- Vérifiez que la clé est au bon format : `sk-proj-...`
- Vérifiez que la clé est valide sur https://platform.openai.com/

### 5. Port 8000 déjà utilisé
**Solution** : Utilisez un autre port :
```bash
uvicorn main:app --reload --port 8001
```
Puis mettez à jour `frontend/.env.local` :
```env
NEXT_PUBLIC_AI_API_URL=http://localhost:8001
```

---

## 📝 **RÉSUMÉ DES COMMANDES**

**Pour démarrer le backend IA chaque fois :**

```bash
cd backend-ai
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Gardez ce terminal ouvert** pendant que vous utilisez l'application.

---

## ✅ **CHECKLIST**

- [ ] Python 3.8+ installé
- [ ] Fichier `backend-ai/.env` créé avec clé OpenAI
- [ ] Environnement virtuel créé (`venv`)
- [ ] Dépendances installées (`pip install -r requirements.txt`)
- [ ] Serveur démarré (`uvicorn main:app --reload --port 8000`)
- [ ] Test http://localhost:8000 réussi
- [ ] Triage IA fonctionne dans l'application

---

## 🎯 **ORDRE DE DÉMARRAGE COMPLET**

Pour faire fonctionner toute l'application :

**Terminal 1 - Backend IA (port 8000)** :
```bash
cd backend-ai
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Backend API (port 3001)** :
```bash
cd backend-api
npm run dev
```

**Terminal 3 - Frontend (port 3000)** :
```bash
cd frontend
npm run dev
```

**Gardez les 3 terminaux ouverts** ! 🚀

---

## 💡 **CONSEILS**

- **Première fois** : Suivez toutes les étapes dans l'ordre
- **Prochaines fois** : Juste activer venv + uvicorn
- **En cas d'erreur** : Regardez les logs dans le terminal
- **Besoin d'aide** : Copiez le message d'erreur complet

---

**🎉 Une fois tout démarré, votre Triage IA fonctionnera parfaitement ! 🤖💚**

