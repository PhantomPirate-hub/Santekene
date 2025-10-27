# 🔍 Guide de Debug - Assistant IA Médical

## ✅ Ce qui a été fait

### 1. **Select Médecin Simplifié** (Côté Patient)
- ✅ Le menu déroulant affiche **JUSTE le nom du médecin**
- ✅ Les détails complets s'affichent dans une **card bleue** en dessous
- ✅ Fini la surcharge visuelle !

### 2. **Bouton Assistant IA Déplacé** (Côté Médecin)
- ✅ **Retiré** de la page "Consultations"
- ✅ **Ajouté** à côté du bouton "Nouvelle Consultation" dans le **DSE du patient**
- ✅ Pré-rempli automatiquement avec :
  - Infos du patient (nom, âge, groupe sanguin, sexe)
  - **Historique médical complet** (toutes les consultations antérieures)

### 3. **IA Améliorée**
- ✅ Prompt amélioré pour **utiliser systématiquement l'historique médical**
- ✅ Logs détaillés pour le debug
- ✅ Gestion d'erreurs robuste
- ✅ Messages d'erreur clairs

---

## 🚨 Si l'IA ne marche pas - Checklist Debug

### Étape 1 : Vérifier que le backend-ai est lancé

```bash
cd backend-ai
python main.py
```

**Ce que vous devez voir** :
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Si erreur "ModuleNotFoundError"** :
```bash
pip install -r requirements.txt
```

---

### Étape 2 : Vérifier la clé OpenAI

**Fichier** : `backend-ai/.env`

**Doit contenir** :
```env
OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI
```

**Vérifier que la clé est valide** :
- Aller sur https://platform.openai.com/api-keys
- Créer une nouvelle clé si nécessaire
- **Vérifier le quota** : https://platform.openai.com/usage

**Erreur commune** : `Error code: 429 - insufficient_quota`
- → Votre quota OpenAI est dépassé
- → Solution : Ajouter des crédits ou utiliser une autre clé

---

### Étape 3 : Tester l'endpoint directement

**Ouvrir** : http://localhost:8000/docs

Cela ouvre l'interface **Swagger** de FastAPI.

**Tester** :
1. Cliquer sur `POST /api/ai/medical-assistant`
2. Cliquer sur "Try it out"
3. Remplir :
   ```
   symptoms: "Fièvre 39°C depuis 2 jours, toux sèche"
   patient_info: "Jean Dupont, 45 ans, Homme, O+"
   medical_history: "12/10/2024: Grippe\n05/09/2024: Hypertension"
   current_findings: "Auscultation: râles bronchiques"
   ```
4. Cliquer "Execute"

**Si ça marche** : Vous verrez une réponse JSON avec diagnostics, examens, etc.

**Si erreur** : Regarder les logs du terminal backend-ai

---

### Étape 4 : Lire les logs du backend-ai

Le terminal backend-ai affiche maintenant des logs **très détaillés** :

```
📋 Assistant médical - Analyse en cours...
📝 Symptômes reçus: Fièvre 39°C depuis 2 jours...
👤 Patient info: Jean Dupont, 45 ans, Homme, O+
📚 Historique médical: 12/10/2024: Grippe...
🔍 Observations: Auscultation: râles...
✅ Résultat reçu de OpenAI
📄 Longueur réponse: 1234 caractères
🧹 JSON nettoyé, tentative de parsing...
✅ JSON parsé avec succès !
✅ Réponse préparée et envoyée au frontend
```

**Si erreur** :
```
❌ ERREUR COMPLÈTE: ...
❌ Type: ...
❌ Traceback: ...
```

**Erreurs communes** :

| Erreur | Cause | Solution |
|--------|-------|----------|
| `openai.AuthenticationError` | Clé API invalide | Vérifier `.env` |
| `openai.RateLimitError` | Quota dépassé | Ajouter crédits OpenAI |
| `ConnectionError` | Backend-ai non lancé | `python main.py` |
| `JSON parsing error` | Réponse OpenAI incorrecte | Vérifier les logs |

---

## 🎯 Comment Tester l'Assistant IA

### Test Complet (Côté Médecin)

1. **Lancer le backend-ai** :
   ```bash
   cd backend-ai
   python main.py
   ```

2. **Connexion médecin** :
   - Email : `doctor1@example.com`
   - Mot de passe : `password123`

3. **Aller dans Consultations** :
   - Rechercher patient par téléphone : `73963323`
   - Cliquer "Rechercher"

4. **Accéder au DSE du patient** :
   - Cliquer "Consulter le DSE et créer une consultation"

5. **Trouver le bouton Assistant IA** :
   - En haut à droite
   - Bouton **violet** "Assistant IA"
   - À **côté** du bouton vert "Nouvelle Consultation"

6. **Cliquer sur "Assistant IA"** :
   - Modal s'ouvre
   - Infos patient déjà remplies
   - Historique médical inclus

7. **Remplir le formulaire** :
   - **Symptômes** : `Fièvre 39°C depuis 2 jours, toux sèche persistante, fatigue importante`
   - **Observations** : `Température 39.2°C, fréquence cardiaque 95 bpm, auscultation: râles bronchiques bilatéraux`

8. **Cliquer "Analyser avec l'IA"** :
   - Attendre 3-5 secondes
   - Résultats s'affichent

9. **Vérifier les résultats** :
   - ✅ Diagnostics différentiels (3-5 suggestions)
   - ✅ Examens recommandés
   - ✅ Traitements suggérés
   - ✅ Signes d'alerte
   - ✅ Précautions
   - ✅ Recommandations de suivi
   - ✅ Raisonnement médical (doit citer l'historique si pertinent)

---

## 📊 Exemple de Résultat Attendu

```json
{
  "differential_diagnosis": [
    "Infection respiratoire basse (bronchite aiguë)",
    "Pneumonie communautaire",
    "Grippe saisonnière",
    "COVID-19",
    "Exacerbation d'une pathologie respiratoire chronique"
  ],
  "recommended_tests": [
    "Radiographie thoracique pour évaluer une pneumonie",
    "Numération formule sanguine pour infection",
    "CRP et VS pour marqueurs inflammatoires",
    "Test rapide COVID-19 / Grippe",
    "Oxymétrie de pouls pour saturation"
  ],
  "treatment_suggestions": [
    "Antipyrétique: Paracétamol 1g toutes les 6h",
    "Antitussif si toux sèche invalidante",
    "Hydratation abondante (2-3L/jour)",
    "Repos au lit pendant 3-5 jours",
    "Antibiotiques si pneumonie confirmée (Amoxicilline 1g x3/j)"
  ],
  "red_flags": [
    "Dyspnée importante ou cyanose",
    "Douleur thoracique intense",
    "Confusion ou altération de conscience",
    "Persistance fièvre >48h sous traitement"
  ],
  "precautions": [
    "Surveiller température et fréquence respiratoire",
    "Isolement si suspicion COVID-19",
    "Éviter contact avec personnes fragiles"
  ],
  "follow_up": "Réévaluation dans 48-72h. Consultation urgence si signes d'alarme. Si amélioration: consultation J7 pour vérifier guérison complète.",
  "confidence_level": "élevé",
  "explanation": "Compte tenu des symptômes (fièvre, toux, râles) et de l'historique de grippe récente, une infection respiratoire basse est la plus probable. Les râles bilatéraux suggèrent une atteinte bronchique. L'historique de grippe peut indiquer une susceptibilité aux infections respiratoires."
}
```

---

## 🆘 Problèmes Fréquents

### Problème : "Failed to fetch"

**Cause** : Le backend-ai n'est pas lancé

**Solution** :
```bash
cd backend-ai
python main.py
```

---

### Problème : "Error code: 401 - Incorrect API key"

**Cause** : Clé OpenAI invalide ou mal configurée

**Solution** :
1. Vérifier `backend-ai/.env`
2. Copier une nouvelle clé depuis https://platform.openai.com/api-keys
3. Format : `OPENAI_API_KEY=sk-proj-...`
4. Relancer `python main.py`

---

### Problème : "Error code: 429 - insufficient_quota"

**Cause** : Quota OpenAI dépassé

**Solution** :
1. Vérifier usage : https://platform.openai.com/usage
2. Ajouter crédits : https://platform.openai.com/billing
3. Ou utiliser une autre clé API

---

### Problème : "Erreur de parsing JSON"

**Cause** : OpenAI a renvoyé un format incorrect

**Solution** :
- Regarder les logs détaillés dans le terminal backend-ai
- Copier la réponse brute et vérifier le format
- Si persistant : ouvrir une issue avec les logs

---

## 📝 Notes Importantes

### L'IA utilise l'historique médical

Le médecin **n'a PAS besoin de retaper** l'historique médical.

**Automatique** :
- Toutes les consultations antérieures sont récupérées
- Transmises à l'IA sous forme de liste chronologique
- L'IA les analyse et les cite si pertinent

**Format transmis** :
```
12/10/2024: Grippe saisonnière
05/09/2024: Hypertension artérielle
15/06/2024: Gastroentérite aiguë
```

---

### Les suggestions sont des AIDES à la décision

⚠️ **IMPORTANT** : L'IA ne remplace PAS le médecin.

**But** :
- Aider à ne rien oublier
- Suggérer des pistes de diagnostic
- Proposer des examens pertinents
- Rappeler les précautions importantes

**Le médecin reste SEUL responsable** :
- Du diagnostic final
- Du traitement prescrit
- Des décisions médicales

---

## 🎨 Architecture de l'Assistant IA

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  DSE Patient (Médecin)                                │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  [Bouton Violet] Assistant IA                    │  │  │
│  │  │  • Pré-rempli avec infos patient                 │  │  │
│  │  │  • Inclut historique médical automatiquement     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP POST
                             │ FormData (symptoms, patient_info,
                             │           medical_history, findings)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND-AI (FastAPI)                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  POST /api/ai/medical-assistant                       │  │
│  │  1. Reçoit les données                                │  │
│  │  2. Crée le prompt enrichi                            │  │
│  │  3. Appelle OpenAI GPT-4                              │  │
│  │  4. Parse le JSON                                     │  │
│  │  5. Renvoie les suggestions                           │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ API Request
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  OpenAI API (GPT-4)                                         │
│  • Analyse médicale intelligente                            │
│  • Utilise l'historique médical                             │
│  • Génère diagnostics + traitements + précautions           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Finale

Avant de signaler un bug, vérifier :

- [ ] Backend-ai est lancé (`python main.py`)
- [ ] Clé OpenAI valide dans `.env`
- [ ] Quota OpenAI suffisant
- [ ] Page correcte (DSE du patient, pas Consultations)
- [ ] Bouton "Assistant IA" visible (violet, à droite)
- [ ] Logs backend-ai affichent les étapes
- [ ] Testé l'endpoint avec Swagger (http://localhost:8000/docs)

---

**Support** : Si le problème persiste après toutes ces vérifications, copier les logs du terminal backend-ai et les partager.

