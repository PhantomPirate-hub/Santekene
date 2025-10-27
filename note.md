# 🐍 Configuration du Backend IA (Python) - Santé Kènè

Ce guide détaille **toutes les étapes** pour installer et lancer le backend IA en local après avoir cloné le projet.

---

## 📋 Prérequis

### ✅ Version Python Requise : **Python 3.11.x**

⚠️ **IMPORTANT** : Utilisez **Python 3.11** (pas 3.12, 3.13 ou 3.14) pour éviter les problèmes de compatibilité avec Pydantic V1.

---

## 📥 ÉTAPE 1 : Installer Python 3.11

### 🔗 Téléchargement

**Lien direct** : [Python 3.11.9 pour Windows (64-bit)](https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe)

### 🛠️ Installation

1. Lancez l'installateur `python-3.11.9-amd64.exe`
2. ⚠️ **IMPORTANT** : Cochez **"Add Python 3.11 to PATH"** (en bas de la fenêtre)
3. Cliquez sur **"Install Now"**
4. Attendez la fin de l'installation
5. Cliquez sur **"Close"**

### 🧪 Vérification

Ouvrez un **nouveau PowerShell** (important : fermez les anciennes fenêtres) et tapez :

```powershell
python --version
```

**Résultat attendu** :
```
Python 3.11.9
```

Si vous voyez une autre version, réinstallez Python 3.11 en cochant bien "Add to PATH".

---

## 🚀 ÉTAPE 2 : Configuration du Backend IA (PREMIÈRE FOIS)

### 1️⃣ Ouvrir PowerShell dans le dossier du projet

```powershell
cd C:\chemin\vers\votre\projet\Santekene\backend-ai
```

*(Remplacez `C:\chemin\vers\votre\projet` par le chemin réel où vous avez cloné le projet)*

### 2️⃣ Créer l'environnement virtuel

```powershell
python -m venv venv
```

**Explication** : Cela crée un dossier `venv` contenant une copie isolée de Python pour ce projet.

### 3️⃣ Activer l'environnement virtuel

```powershell
.\venv\Scripts\Activate.ps1
```

**Résultat attendu** : Vous devriez voir `(venv)` au début de votre ligne de commande :

```powershell
(venv) PS C:\...\Santekene\backend-ai>
```

⚠️ **Si vous avez une erreur de politique d'exécution** :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Puis réessayez d'activer le venv.

### 4️⃣ Mettre à jour pip

```powershell
python -m pip install --upgrade pip
```

### 5️⃣ Installer les dépendances

```powershell
pip install -r requirements.txt
```

**Durée** : ~2-5 minutes selon votre connexion internet.

**Résultat attendu** : Vous devriez voir l'installation de :
- `fastapi`
- `uvicorn`
- `langchain`
- `langchain-openai`
- `python-dotenv`
- `pydantic`
- `python-multipart`
- Et leurs dépendances (numpy, httpx, etc.)

### 6️⃣ Créer le fichier `.env`

Créez un fichier nommé `.env` dans le dossier `backend-ai` :

```powershell
notepad .env
```

**Contenu du fichier** :

```env
OPENAI_API_KEY="sk-proj-VOTRE_CLE_API_OPENAI_ICI"
```

⚠️ **Important** :
- Remplacez `VOTRE_CLE_API_OPENAI_ICI` par votre vraie clé OpenAI
- Obtenez une clé sur : https://platform.openai.com/api-keys
- Gardez les guillemets autour de la clé

**Enregistrez** (`Ctrl+S`) et **fermez** le fichier.

### 7️⃣ Vérifier que tout est prêt

```powershell
python main.py
```

**Résultat attendu** :

```
============================================================
🚀 Démarrage du serveur Santé Kènè AI...
============================================================
📡 URL: http://localhost:8000
📚 Documentation: http://localhost:8000/docs
============================================================
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

✅ **Si vous voyez ce message, BRAVO ! Le backend IA fonctionne !**

---

## 🔄 ÉTAPE 3 : Lancer le Backend IA (UTILISATION QUOTIDIENNE)

Une fois l'installation terminée, pour relancer le serveur les prochaines fois :

### 📂 Ouvrir PowerShell dans le dossier

```powershell
cd C:\chemin\vers\votre\projet\Santekene\backend-ai
```

### ▶️ Activer le venv et lancer le serveur

```powershell
.\venv\Scripts\Activate.ps1
python main.py
```

**C'est tout !** Le serveur démarre sur http://localhost:8000

### ⏹️ Arrêter le serveur

Appuyez sur `Ctrl+C` dans la fenêtre PowerShell.

---

## 🧪 ÉTAPE 4 : Tester que tout fonctionne

### Test 1 : Endpoint racine

Ouvrez votre navigateur et allez sur : **http://localhost:8000**

**Résultat attendu** :
```json
{"message":"Santé Kènè AI Service is running."}
```

### Test 2 : Documentation interactive

Ouvrez : **http://localhost:8000/docs**

Vous devriez voir l'interface **Swagger** avec tous les endpoints disponibles :
- `GET /` - Health Check
- `POST /api/ai/transcribe` - Transcription audio (Whisper)
- `POST /api/ai/triage` - Triage intelligent des patients
- `POST /api/ai/medical-assistant` - Assistant médical IA

### Test 3 : Depuis le frontend

1. Lancez le frontend Next.js (`npm run dev` dans le dossier `frontend`)
2. Connectez-vous en tant que médecin
3. Allez dans le DSE d'un patient
4. Cliquez sur **"Assistant IA"** (bouton à côté de "Nouvelle Consultation")
5. Remplissez les symptômes
6. Cliquez sur **"Analyser"**
7. Vous devriez voir les recommandations de l'IA en quelques secondes

---

## 🛠️ Dépannage (Troubleshooting)

### ❌ Problème : "python n'est pas reconnu..."

**Solution** : Python n'est pas dans le PATH.
1. Réinstallez Python 3.11 en cochant **"Add Python 3.11 to PATH"**
2. Redémarrez PowerShell

### ❌ Problème : "Impossible d'exécuter des scripts... ExecutionPolicy"

**Solution** :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Problème : "ModuleNotFoundError: No module named 'fastapi'"

**Solution** : Les dépendances ne sont pas installées ou le venv n'est pas activé.
1. Vérifiez que `(venv)` apparaît au début de votre ligne de commande
2. Si non, tapez : `.\venv\Scripts\Activate.ps1`
3. Réinstallez : `pip install -r requirements.txt`

### ❌ Problème : "OPENAI_API_KEY n'est pas définie..."

**Solution** : Le fichier `.env` est manquant ou mal configuré.
1. Vérifiez qu'il existe : `dir .env`
2. Vérifiez son contenu : `type .env`
3. Il doit contenir : `OPENAI_API_KEY="sk-proj-..."`

### ❌ Problème : "Port 8000 already in use"

**Solution** : Le port est déjà utilisé par une autre application.

**Option 1** - Arrêter l'ancien serveur :
1. Appuyez sur `Ctrl+C` dans la fenêtre PowerShell qui exécute `python main.py`

**Option 2** - Changer de port (dans `main.py`, ligne 330) :
```python
uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
```

### ❌ Problème : Erreurs de compatibilité Pydantic / Python 3.14

**Solution** : Vous utilisez une version trop récente de Python.
1. Désinstallez Python 3.14
2. Installez **Python 3.11.9** (lien dans ÉTAPE 1)
3. Supprimez le venv : `Remove-Item -Recurse -Force venv`
4. Recréez tout depuis l'ÉTAPE 2

---

## 📚 URLs Utiles

| Service | URL | Description |
|---------|-----|-------------|
| **Backend IA** | http://localhost:8000 | API principale |
| **Documentation** | http://localhost:8000/docs | Interface Swagger |
| **Health Check** | http://localhost:8000 | Test rapide |
| **Frontend** | http://localhost:3000 | Application Next.js |
| **Backend API** | http://localhost:5000 | API Node.js/Express |

---

## 📦 Structure du dossier `backend-ai`

```
backend-ai/
├── main.py              # Point d'entrée FastAPI
├── requirements.txt     # Dépendances Python
├── .env                 # Clé API OpenAI (à créer)
└── venv/                # Environnement virtuel (créé automatiquement)
```

---

## 🎯 Récapitulatif Rapide

### Première installation
```powershell
cd backend-ai
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
notepad .env  # Ajouter OPENAI_API_KEY="sk-proj-..."
python main.py
```

### Utilisation quotidienne
```powershell
cd backend-ai
.\venv\Scripts\Activate.ps1
python main.py
```

---

**✅ Votre backend IA est maintenant opérationnel !** 🚀
