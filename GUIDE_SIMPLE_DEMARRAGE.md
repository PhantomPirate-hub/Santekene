# 🚀 Guide Simple - Démarrer TOUT en 5 Minutes

## 📋 Checklist Rapide

Pour que l'Assistant IA fonctionne, vous avez besoin de **3 serveurs** :

1. ✅ **Backend-API** (port 3001) - Déjà lancé normalement
2. ✅ **Frontend** (port 3000) - Déjà lancé normalement  
3. ❌ **Backend-AI** (port 8000) - **À LANCER** ← C'est ça qui manque !

---

## 🐍 MÉTHODE RAPIDE : Script Automatique

### Étape 1 : Installer Python (si pas déjà fait)

**Télécharger** : https://www.python.org/downloads/

**⚠️ TRÈS IMPORTANT** : Cocher **"Add Python to PATH"** pendant l'installation !

### Étape 2 : Lancer le script automatique

**Ouvrir PowerShell dans le dossier backend-ai** :
1. Ouvrir l'Explorateur Windows
2. Naviguer vers : `C:\laragon\www\Santekene\backend-ai`
3. Dans la barre d'adresse, taper : `powershell` puis `Entrée`
4. Taper :
   ```powershell
   .\LANCER_BACKEND_AI.ps1
   ```

**Le script va** :
- ✅ Vérifier Python
- ✅ Créer l'environnement virtuel
- ✅ Installer les dépendances
- ✅ Demander votre clé OpenAI
- ✅ Lancer le serveur

**Suivez les instructions à l'écran !**

---

## 📝 MÉTHODE MANUELLE (si le script ne marche pas)

### Étape 1 : Vérifier Python

```powershell
python --version
```

**Résultat attendu** : `Python 3.11.x` ou supérieur

**Si erreur** : Installez Python (voir ci-dessus)

---

### Étape 2 : Commandes complètes

**Copier-coller TOUT ça** :

```powershell
# Aller dans le dossier
cd C:\laragon\www\Santekene\backend-ai

# Créer venv (première fois)
python -m venv venv

# Activer venv
.\venv\Scripts\Activate.ps1

# Installer dépendances (première fois)
pip install -r requirements.txt

# Lancer le serveur
python main.py
```

---

### Étape 3 : Créer le fichier .env

**Avant de lancer**, créer le fichier `.env` :

```powershell
notepad .env
```

**Dans le fichier** :
```
OPENAI_API_KEY=sk-proj-VOTRE_VRAIE_CLE_ICI
```

**Obtenir une clé** : https://platform.openai.com/api-keys

**Sauvegarder** : `Ctrl+S` et fermer

---

## ✅ Comment Savoir que Ça Marche ?

### Dans le terminal PowerShell

Vous devez voir :
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

✅ **Si vous voyez ça : C'EST BON !**

---

### Dans le navigateur

**Ouvrir** : http://localhost:8000/docs

**Vous devez voir** : L'interface Swagger UI avec la liste des endpoints

✅ **Si vous voyez ça : L'API FONCTIONNE !**

---

## 🧪 Tester l'Assistant IA

### Prérequis

- [ ] Backend-API lancé (`npm run dev` dans backend-api)
- [ ] Frontend lancé (`npm run dev` dans frontend)
- [ ] **Backend-AI lancé** (`python main.py` dans backend-ai) ← NOUVEAU
- [ ] Navigateur sur http://localhost:3000

### Test Complet

1. **Connexion médecin** :
   - Email : `doctor1@example.com`
   - Mot de passe : `password123`

2. **Aller dans Consultations**

3. **Chercher un patient** :
   - Téléphone : `73963323`
   - Cliquer "Rechercher"

4. **Demander l'accès au DSE** :
   - Cliquer "Demander l'accès au DSE"

5. **Se déconnecter et se reconnecter en patient** :
   - Email : `patient1@example.com`
   - Mot de passe : `password123`

6. **Aller dans "Demandes d'accès"** (menu latéral)

7. **Approuver la demande** :
   - Cliquer "Approuver"

8. **Se reconnecter en médecin**

9. **Consultations → Chercher patient → Consulter le DSE**

10. **En haut à droite : Bouton violet "Assistant IA"**

11. **Cliquer et tester** :
    - Symptômes : `Fièvre 39°C, toux sèche`
    - Cliquer "Analyser avec l'IA"

12. **Attendre 3-5 secondes**

✅ **Vous devez voir les diagnostics, traitements, etc. !**

---

## 🆘 Problèmes Fréquents

### Problème 1 : "python n'est pas reconnu"

**Solution** :
1. Installer Python : https://www.python.org/downloads/
2. **COCHER** "Add Python to PATH" pendant l'installation
3. Fermer et rouvrir PowerShell

---

### Problème 2 : "impossible d'exécuter des scripts"

**Solution** :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Taper `Y` puis `Entrée`

---

### Problème 3 : "OPENAI_API_KEY n'est pas définie"

**Solution** :
1. Créer le fichier `.env` dans `backend-ai`
2. Ajouter : `OPENAI_API_KEY=sk-proj-...`
3. Obtenir clé : https://platform.openai.com/api-keys

---

### Problème 4 : "dse is not defined" (accès DSE)

**Solution** :
1. Rafraîchir la page : `Ctrl + Shift + R`
2. Vérifier que le patient a approuvé l'accès
3. Re-connexion médecin

---

### Problème 5 : "Port 8000 already in use"

**Solution** :
```powershell
# Trouver le processus :
netstat -ano | findstr :8000

# Tuer le processus (remplacer XXXX) :
taskkill /PID XXXX /F

# Relancer :
python main.py
```

---

## 📊 Récapitulatif : Les 3 Serveurs

| Serveur | Dossier | Commande | Port | URL Test |
|---------|---------|----------|------|----------|
| Backend-API | `backend-api` | `npm run dev` | 3001 | http://localhost:3001 |
| Frontend | `frontend` | `npm run dev` | 3000 | http://localhost:3000 |
| **Backend-AI** | `backend-ai` | `python main.py` | 8000 | http://localhost:8000/docs |

**Tous les 3 doivent tourner en même temps !**

---

## 🎯 Configuration des Terminaux

**Vous devez avoir 3 terminaux ouverts** :

### Terminal 1 : Backend-API
```powershell
cd C:\laragon\www\Santekene\backend-api
npm run dev
```

### Terminal 2 : Frontend
```powershell
cd C:\laragon\www\Santekene\frontend
npm run dev
```

### Terminal 3 : Backend-AI (NOUVEAU)
```powershell
cd C:\laragon\www\Santekene\backend-ai
.\venv\Scripts\Activate.ps1
python main.py
```

**LAISSEZ LES 3 OUVERTS !**

---

## ✅ Confirmation que Tout Marche

**Ouvrir ces 3 URLs** :

1. http://localhost:3001 → Doit afficher "Cannot GET /" (normal)
2. http://localhost:3000 → Doit afficher l'appli Santé Kènè
3. http://localhost:8000/docs → Doit afficher Swagger UI

✅ **Si les 3 fonctionnent : TOUT EST BON !**

---

## 🎉 Félicitations !

Maintenant l'Assistant IA fonctionne :
- ✅ Diagnostics automatiques
- ✅ Suggestions de traitement
- ✅ Examens recommandés
- ✅ Utilise l'historique médical du patient
- ✅ Compatible mobile (Flutter)

---

**Besoin d'aide ?** Copiez le message d'erreur EXACT que vous voyez et envoyez-le moi !

