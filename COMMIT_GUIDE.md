# 📝 Guide pour faire votre commit

## 🔍 État actuel

Vous avez beaucoup de fichiers modifiés et de nouveaux fichiers. Voici comment procéder proprement :

---

## 📋 ÉTAPE 1 : Aller à la racine du projet

```powershell
cd ..
# Vous devez être dans C:\laragon\www\Santekene
```

---

## 🗑️ ÉTAPE 2 : (Optionnel) Nettoyer les fichiers de documentation temporaires

Si vous voulez supprimer les fichiers de documentation de debug :

```powershell
# Ces fichiers peuvent être supprimés (ils ne sont pas nécessaires pour le projet)
rm ACCESSIBILITE_VOCALE_COMPLETE.md
rm AMELIORATIONS_APPLIQUEES.md
rm ANALYSE_ETAT_ACTUEL_VS_SPECS.md
rm BUG_AUTHENTIFICATION_RESOLU.md
rm CARTE_INTERACTIVE_*.md
rm CORRECTIONS_*.md
rm DEBUG_*.md
rm DIAGNOSTIC_*.md
# etc...

# OU GARDER UNIQUEMENT :
# - SETUP.md (guide d'installation)
# - note.md (guide Python)
# - README.md (si vous en avez un)
```

---

## ✅ ÉTAPE 3 : Ajouter les fichiers modifiés

### Option A : Tout ajouter en une fois (recommandé)

```powershell
git add .
```

### Option B : Ajouter par catégorie (plus propre)

```powershell
# Backend API
git add backend-api/

# Backend AI
git add backend-ai/

# Frontend
git add frontend/

# Fichiers racine
git add .gitignore
git add SETUP.md
git add note.md
```

---

## 🚫 ÉTAPE 4 : Vérifier ce qui sera commité

```powershell
git status
```

**Assurez-vous que les fichiers suivants NE SONT PAS dans la liste :**
- ❌ `node_modules/`
- ❌ `.env` ou `.env.local`
- ❌ `venv/`
- ❌ `__pycache__/`
- ❌ `.next/`
- ❌ `uploads/`

Si vous voyez ces fichiers, ils seront ignorés automatiquement grâce aux `.gitignore`.

---

## 💾 ÉTAPE 5 : Faire le commit

```powershell
git commit -m "feat: Ajout fonctionnalités médecin (historique, calendrier, modifications, notifications)"
```

**Message de commit détaillé (optionnel) :**

```powershell
git commit -m "feat: Ajout fonctionnalités médecin complètes

- Historique des consultations avec filtres
- Vue calendrier (jour/semaine/mois) dans Mes RDV
- Modification des consultations en cas d'erreur
- Système de notifications temps réel (RDV, accès DSE)
- Amélioration de la configuration (gitignore, setup)
- Documentation d'installation"
```

---

## 🌐 ÉTAPE 6 : Push vers GitHub

```powershell
# Si vous êtes sur la branche 'main'
git push origin main

# Si vous êtes sur la branche 'bane' (selon votre git status)
git push origin bane
```

---

## 🔄 ÉTAPE 7 : (Optionnel) Merger dans main

Si vous travaillez sur une branche et voulez merger dans `main` :

```powershell
git checkout main
git merge bane
git push origin main
```

---

## ✅ Vérification finale

Après le push, allez sur GitHub et vérifiez que :
- ✅ Les fichiers `.env` ne sont **PAS** visibles
- ✅ Les dossiers `node_modules/` et `venv/` ne sont **PAS** visibles
- ✅ Tous vos fichiers de code source sont bien présents

---

## 📚 Fichiers importants à garder

✅ **À commiter** :
- Tous les fichiers `.ts`, `.tsx`, `.py`
- `package.json`, `package-lock.json`
- `requirements.txt`
- `prisma/schema.prisma`
- `SETUP.md`, `note.md`
- `.gitignore` (tous)

❌ **À NE PAS commiter** :
- `.env`, `.env.local`
- `node_modules/`
- `venv/`, `__pycache__/`
- `.next/`, `build/`
- `uploads/`
- Fichiers de documentation temporaires (`DEBUG_*.md`, `CORRECTIONS_*.md`)

---

## 🆘 En cas de problème

### Problème : "warning: LF will be replaced by CRLF"
**Solution** : C'est normal sur Windows, ignorez.

### Problème : ".env ajouté par erreur"
**Solution** :
```powershell
git rm --cached backend-ai/.env
git rm --cached backend-api/.env
git rm --cached frontend/.env.local
git commit -m "fix: Retirer fichiers .env du commit"
```

### Problème : "Too many files"
**Solution** : Vérifiez que `node_modules/` est bien dans `.gitignore`

