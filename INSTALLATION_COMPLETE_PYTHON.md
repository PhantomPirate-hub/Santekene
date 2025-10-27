# 🐍 Installation Complète Python + Backend-AI + Test DSE

## 🎯 Ce guide va résoudre TOUS vos problèmes

1. ✅ Installer Python correctement
2. ✅ Configurer le backend-ai
3. ✅ Tester que tout fonctionne
4. ✅ Corriger l'accès au DSE patient

---

## PARTIE 1 : INSTALLER PYTHON (Windows)

### Étape 1.1 : Vérifier si Python est déjà installé

**Ouvrir PowerShell** :
- Appuyez sur `Windows + X`
- Choisir "Windows PowerShell" ou "Terminal"

**Taper** :
```powershell
python --version
```

**3 scénarios possibles** :

#### ✅ Scénario A : Python est installé
```
Python 3.11.5
```
→ **Passez directement à la PARTIE 2**

#### ❌ Scénario B : Python n'est pas reconnu
```
python : Le terme 'python' n'est pas reconnu...
```
→ **Continuez ci-dessous pour installer Python**

#### ⚠️ Scénario C : Version trop ancienne (< 3.10)
```
Python 2.7.18
```
→ **Désinstallez l'ancienne version et installez Python 3.11+**

---

### Étape 1.2 : Télécharger Python

1. **Aller sur** : https://www.python.org/downloads/
2. **Cliquer sur** : "Download Python 3.12.x" (ou la version stable)
3. **Télécharger** : `python-3.12.x-amd64.exe`

---

### Étape 1.3 : Installer Python

**TRÈS IMPORTANT** : Cochez les bonnes cases !

1. **Lancer** le fichier `.exe` téléchargé
2. ✅ **COCHER** : "Add python.exe to PATH" (EN BAS !)
3. **Cliquer** : "Install Now"
4. Attendre la fin de l'installation
5. **Cliquer** : "Close"

**SANS cette case cochée, Python ne marchera pas !**

---

### Étape 1.4 : Vérifier l'installation

**Fermer et rouvrir PowerShell** (IMPORTANT !)

**Taper** :
```powershell
python --version
```

**Résultat attendu** :
```
Python 3.12.1
```

**Taper aussi** :
```powershell
pip --version
```

**Résultat attendu** :
```
pip 23.3.1 from C:\Users\...\Python312\site-packages\pip (python 3.12)
```

✅ **Si vous voyez ces 2 résultats : Python est installé correctement !**

❌ **Si "python n'est pas reconnu"** :
- Vous avez oublié de cocher "Add to PATH"
- Désinstallez Python
- Réinstallez en cochant la case

---

## PARTIE 2 : CONFIGURER LE BACKEND-AI

### Étape 2.1 : Ouvrir le bon dossier

**Dans PowerShell** :
```powershell
cd C:\laragon\www\Santekene\backend-ai
```

**Vérifier que vous êtes au bon endroit** :
```powershell
dir
```

**Vous devez voir** :
```
main.py
requirements.txt
.env (peut-être pas encore)
```

---

### Étape 2.2 : Créer l'environnement virtuel

```powershell
python -m venv venv
```

**Attendre** : Ça prend 10-30 secondes.

**Résultat attendu** : Un dossier `venv` apparaît.

**Vérifier** :
```powershell
dir
```

Vous devez voir le dossier `venv`.

---

### Étape 2.3 : Activer l'environnement virtuel

```powershell
.\venv\Scripts\Activate.ps1
```

**Résultat attendu** :
```
(venv) PS C:\laragon\www\Santekene\backend-ai>
```

Vous voyez `(venv)` au début de la ligne.

#### ❌ Si erreur "impossible d'exécuter des scripts"

**Exécuter** :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Taper** : `Y` puis `Entrée`

**Réessayer** :
```powershell
.\venv\Scripts\Activate.ps1
```

---

### Étape 2.4 : Installer les dépendances

**Avec venv activé (vous voyez `(venv)`)** :
```powershell
pip install -r requirements.txt
```

**Attendre** : Ça prend 1-2 minutes.

**Résultat attendu** :
```
Successfully installed fastapi-0.104.1 langchain-0.1.0 ...
```

---

### Étape 2.5 : Créer le fichier .env

#### Option A : Avec Notepad
```powershell
notepad .env
```

**Dans le fichier qui s'ouvre** :
```
OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI
```

**Sauvegarder** : Ctrl+S  
**Fermer** : Alt+F4

#### Option B : Avec PowerShell
```powershell
echo "OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI" > .env
```

**⚠️ IMPORTANT** : Remplacez `sk-proj-VOTRE_CLE_ICI` par votre vraie clé OpenAI !

**Obtenir une clé OpenAI** :
1. Aller sur : https://platform.openai.com/api-keys
2. Se connecter (créer un compte si nécessaire)
3. Cliquer "Create new secret key"
4. Copier la clé (commence par `sk-proj-` ou `sk-`)
5. La coller dans le `.env`

---

### Étape 2.6 : Vérifier le fichier .env

```powershell
type .env
```

**Résultat attendu** :
```
OPENAI_API_KEY=sk-proj-AbCd1234EfGh5678IjKl...
```

---

## PARTIE 3 : LANCER LE BACKEND-AI

### Étape 3.1 : Lancer le serveur

**Dans le terminal backend-ai (avec venv activé)** :
```powershell
python main.py
```

**Attendre 2-3 secondes.**

### Étape 3.2 : Vérifier que ça marche

**Résultat attendu (SUCCÈS)** :
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

✅ **Si vous voyez ça : LE BACKEND-AI FONCTIONNE !**

**LAISSEZ CE TERMINAL OUVERT !**

---

### ❌ Erreurs possibles et solutions

#### Erreur 1 : "No module named 'fastapi'"
```
ModuleNotFoundError: No module named 'fastapi'
```

**Cause** : Dépendances pas installées ou venv pas activé

**Solution** :
```powershell
# Vérifier que (venv) est visible
# Si non :
.\venv\Scripts\Activate.ps1

# Réinstaller :
pip install -r requirements.txt

# Relancer :
python main.py
```

#### Erreur 2 : "OPENAI_API_KEY n'est pas définie"
```
ValueError: OPENAI_API_KEY n'est pas définie...
```

**Cause** : Fichier `.env` manquant ou incorrect

**Solution** :
```powershell
# Vérifier le fichier :
type .env

# Si vide ou incorrect :
notepad .env

# Ajouter :
OPENAI_API_KEY=sk-proj-VOTRE_VRAIE_CLE

# Sauvegarder et relancer :
python main.py
```

#### Erreur 3 : "Port 8000 already in use"
```
OSError: [Errno 98] Address already in use
```

**Cause** : Un autre processus utilise le port 8000

**Solution** :
```powershell
# Trouver le processus :
netstat -ano | findstr :8000

# Tuer le processus (remplacer XXXX par le PID) :
taskkill /PID XXXX /F

# Relancer :
python main.py
```

---

## PARTIE 4 : TESTER LE BACKEND-AI

### Étape 4.1 : Tester avec Swagger

**Ouvrir dans le navigateur** :
```
http://localhost:8000/docs
```

**Résultat attendu** :
- Vous voyez l'interface Swagger UI
- Liste des endpoints dont `/api/ai/medical-assistant`

✅ **Si vous voyez ça : L'API fonctionne !**

---

### Étape 4.2 : Tester l'endpoint

**Dans Swagger UI** :
1. **Cliquer** sur `POST /api/ai/medical-assistant`
2. **Cliquer** sur "Try it out"
3. **Remplir** :
   ```
   symptoms: Fièvre 39°C, toux sèche
   patient_info: Test Patient, 35 ans, Homme
   medical_history: Aucun antécédent
   current_findings: Auscultation normale
   ```
4. **Cliquer** "Execute"

**Résultat attendu** :
- Code 200
- Une réponse JSON avec diagnostics, traitements, etc.

✅ **Si vous voyez ça : L'IA FONCTIONNE !**

---

## PARTIE 5 : RÉSOUDRE LE PROBLÈME D'ACCÈS AU DSE

### Problème : "dse is not defined" ou erreur d'accès

**La correction a déjà été appliquée**, mais vérifiez :

### Étape 5.1 : Rafraîchir le frontend

**Dans le navigateur (sur l'application)** :
- Appuyez sur `Ctrl + Shift + R` (rafraîchissement forcé)
- Ou fermez et rouvrez le navigateur

---

### Étape 5.2 : Vérifier les logs backend

**Dans le terminal backend-api** :

Vous devez voir des logs quand vous accédez au DSE.

**Si erreur 500** : Regarder le message d'erreur complet.

---

### Étape 5.3 : Test complet d'accès au DSE

**Connexion médecin** :
- Email : `doctor1@example.com`
- Mot de passe : `password123`

**Dans Consultations** :
1. Chercher patient : `73963323`
2. Cliquer "Rechercher"
3. Cliquer "Demander l'accès au DSE"
4. Se déconnecter

**Connexion patient** :
- Email : `patient1@example.com`
- Mot de passe : `password123`

**Dans Demandes d'accès** :
1. Voir la demande du médecin
2. Cliquer "Approuver"
3. Se déconnecter

**Re-connexion médecin** :
1. Consultations → Chercher `73963323`
2. Cliquer "Consulter le DSE et créer une consultation"

✅ **Ça doit s'ouvrir sans erreur !**

---

## PARTIE 6 : TESTER L'ASSISTANT IA (TOUT EN UN)

### Prérequis (checklist)

- [ ] Backend-api lancé (port 3001)
- [ ] Frontend lancé (port 3000)
- [ ] **Backend-ai lancé (port 8000)** ← NOUVEAU
- [ ] Patient a approuvé l'accès au DSE

### Test complet

1. **Médecin** : Consultations → Chercher patient
2. Cliquer "Consulter le DSE..."
3. **En haut à droite** : Bouton violet "Assistant IA"
4. Cliquer dessus
5. **Remplir** :
   - Symptômes : `Fièvre 39°C depuis 2 jours, toux sèche`
   - Observations : `Auscultation : râles bronchiques`
6. Cliquer "**Analyser avec l'IA**"
7. **Attendre 3-5 secondes**

**Résultat attendu** :
- Diagnostics différentiels (3-5 suggestions)
- Examens recommandés
- Traitements suggérés
- Signes d'alerte
- Précautions
- Suivi recommandé
- Raisonnement médical

**Regarder le terminal backend-ai** :
```
📋 Assistant médical - Analyse en cours...
📝 Symptômes reçus: Fièvre 39°C...
✅ Résultat reçu de OpenAI
✅ JSON parsé avec succès !
```

✅ **Si vous voyez ça : TOUT FONCTIONNE !**

---

## 🆘 AIDE RAPIDE - Si rien ne marche

### Problème 1 : Python n'est pas installé
```powershell
python --version
# Si erreur → Installer Python (voir PARTIE 1)
```

### Problème 2 : Backend-ai ne démarre pas
```powershell
cd C:\laragon\www\Santekene\backend-ai
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

### Problème 3 : Erreur OpenAI
```powershell
# Vérifier la clé :
type .env

# Doit contenir :
# OPENAI_API_KEY=sk-proj-...
```

### Problème 4 : Accès DSE bloqué
1. Rafraîchir la page (`Ctrl + Shift + R`)
2. Vérifier que le patient a approuvé l'accès
3. Regarder les logs dans le terminal backend-api

---

## 📋 COMMANDES RÉSUMÉES (COPIER-COLLER)

### Pour lancer le backend-ai (à chaque fois)

```powershell
# 1. Aller dans le dossier
cd C:\laragon\www\Santekene\backend-ai

# 2. Activer venv
.\venv\Scripts\Activate.ps1

# 3. Lancer
python main.py
```

### Pour tout installer (première fois seulement)

```powershell
# 1. Aller dans le dossier
cd C:\laragon\www\Santekene\backend-ai

# 2. Créer venv
python -m venv venv

# 3. Activer venv
.\venv\Scripts\Activate.ps1

# 4. Installer dépendances
pip install -r requirements.txt

# 5. Créer .env
notepad .env
# Ajouter : OPENAI_API_KEY=sk-proj-...

# 6. Lancer
python main.py
```

---

## ✅ CHECKLIST FINALE

Avant de dire "ça ne marche pas", vérifier :

- [ ] Python installé (`python --version`)
- [ ] Dans le bon dossier (`cd backend-ai`)
- [ ] Venv activé (voir `(venv)`)
- [ ] Dépendances installées (`pip list`)
- [ ] Fichier `.env` créé (`type .env`)
- [ ] Clé OpenAI valide (commence par `sk-`)
- [ ] Backend-ai lancé (voir "Uvicorn running")
- [ ] http://localhost:8000/docs fonctionne
- [ ] Backend-api lancé (port 3001)
- [ ] Frontend lancé (port 3000)
- [ ] Patient a approuvé l'accès DSE

---

**Si après tout ça ça ne marche toujours pas, copiez-moi le message d'erreur EXACT que vous voyez dans le terminal !**

