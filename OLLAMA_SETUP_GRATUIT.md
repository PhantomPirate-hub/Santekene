# 🆓 OLLAMA - IA LOCALE GRATUITE

## 🎯 **POURQUOI OLLAMA ?**

Ollama est une **alternative 100% gratuite** à OpenAI qui fonctionne **localement** sur votre ordinateur.

### ✅ **Avantages**
- 🆓 **Gratuit** : Aucun coût, utilisation illimitée
- 🔒 **Privé** : Vos données restent sur votre ordinateur
- 🚀 **Rapide** : Pas de limite de quota
- 🌐 **Hors ligne** : Fonctionne sans internet

### ⚠️ **Inconvénients**
- Légèrement moins précis qu'OpenAI GPT-4
- Nécessite 8GB+ de RAM
- Premier téléchargement : ~4GB

---

## 🚀 **INSTALLATION OLLAMA (5 MINUTES)**

### 📥 **Étape 1 : Télécharger Ollama**

1. Allez sur : **https://ollama.ai/download**
2. Téléchargez la version **Windows**
3. Installez (double-clic sur le .exe)
4. Suivez l'assistant d'installation

### 🤖 **Étape 2 : Télécharger le modèle**

Ouvrez un **nouveau terminal** (PowerShell ou CMD) et tapez :

```bash
ollama pull llama3.2
```

⏳ **Attendez le téléchargement** (~4GB, peut prendre 5-10 minutes)

Vous verrez :
```
pulling manifest
pulling 8eeb52dfb3bb... 100%
success
```

### ✅ **Étape 3 : Tester Ollama**

Dans le même terminal, tapez :

```bash
ollama run llama3.2 "Bonjour, comment vas-tu ?"
```

Si vous voyez une réponse en français, **c'est bon !** ✅

---

## 🔧 **CONFIGURATION DANS SANTEKENE**

### 📝 **Étape 1 : Modifier le backend IA**

Ouvrez le fichier : `backend-ai/main.py`

**Remplacez tout le contenu** par ce code optimisé pour Ollama :

```python
from fastapi import FastAPI, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import requests

app = FastAPI(
    title="Santé Kènè - AI Service (Ollama)",
    description="API IA locale avec Ollama",
    version="0.2.0",
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_API_URL = "http://localhost:11434/api/generate"

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": "Santé Kènè AI Service (Ollama) is running."}

@app.post("/api/ai/triage", tags=["AI - Ollama"])
async def ai_triage(symptoms: str = Form(...), latitude: float = Form(None), longitude: float = Form(None)):
    if not symptoms:
        raise HTTPException(status_code=400, detail="Les symptômes sont requis.")
    
    try:
        # Prompt optimisé pour le triage médical
        prompt = f"""Tu es un assistant médical IA expert. Analyse les symptômes suivants et réponds UNIQUEMENT au format JSON (sans markdown, juste le JSON brut):

Symptômes du patient: {symptoms}

Réponds avec ce format JSON exact:
{{
  "summary": "Résumé concis des symptômes en 1-2 phrases",
  "urgency": "faible" ou "modéré" ou "urgent",
  "specialties": ["Spécialité1", "Spécialité2"],
  "precautions": ["Précaution 1", "Précaution 2", "Précaution 3"],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "consultation_type": "presentiel" ou "en_ligne" ou "urgence",
  "explanation": "Explication détaillée de l'analyse"
}}

Critères d'urgence:
- "urgent": Symptômes graves (douleur thoracique, difficulté respiratoire sévère, saignement important)
- "modéré": Symptômes significatifs (fièvre élevée persistante, douleur intense)
- "faible": Symptômes légers (rhume, légère fatigue)

Spécialités disponibles: Médecine Générale, Cardiologie, Dermatologie, Pédiatrie, Gynécologie, Neurologie, Orthopédie, ORL, Pneumologie, Gastro-entérologie

Type de consultation:
- "urgence": Cas urgents nécessitant intervention immédiate
- "presentiel": Cas nécessitant un examen physique
- "en_ligne": Cas pouvant être gérés en téléconsultation

Réponds UNIQUEMENT en JSON, rien d'autre."""

        # Appel à Ollama
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": "llama3.2",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Erreur Ollama: {response.text}")
        
        result = response.json()
        ai_response = result.get("response", "")
        
        # Nettoyer le résultat
        cleaned_result = ai_response.strip()
        if cleaned_result.startswith("```json"):
            cleaned_result = cleaned_result[7:]
        if cleaned_result.startswith("```"):
            cleaned_result = cleaned_result[3:]
        if cleaned_result.endswith("```"):
            cleaned_result = cleaned_result[:-3]
        cleaned_result = cleaned_result.strip()
        
        # Parser le JSON
        try:
            triage_data = json.loads(cleaned_result)
        except json.JSONDecodeError as e:
            print(f"Erreur JSON: {e}")
            print(f"Réponse brute: {ai_response}")
            # Fallback
            triage_data = {
                "summary": "Analyse en cours...",
                "urgency": "modéré",
                "specialties": ["Médecine Générale"],
                "precautions": ["Consultez un médecin"],
                "recommendations": ["Prenez rendez-vous"],
                "consultation_type": "presentiel",
                "explanation": ai_response
            }
        
        # Valider et normaliser
        urgency = triage_data.get("urgency", "modéré").lower()
        if urgency not in ["faible", "modéré", "urgent"]:
            urgency = "modéré"
        
        consultation_type = triage_data.get("consultation_type", "presentiel").lower()
        if consultation_type not in ["presentiel", "en_ligne", "urgence"]:
            consultation_type = "presentiel"
        
        # Réponse finale
        response_data = {
            "summary": triage_data.get("summary", "Analyse terminée"),
            "urgency": urgency,
            "urgency_label": {
                "faible": "Urgence Faible",
                "modéré": "Urgence Modérée",
                "urgent": "Urgence Élevée"
            }.get(urgency, "Urgence Modérée"),
            "urgency_color": {
                "faible": "green",
                "modéré": "orange",
                "urgent": "red"
            }.get(urgency, "orange"),
            "specialties": triage_data.get("specialties", ["Médecine Générale"]),
            "precautions": triage_data.get("precautions", []),
            "recommendations": triage_data.get("recommendations", []),
            "consultation_type": consultation_type,
            "consultation_type_label": {
                "presentiel": "Consultation en présentiel recommandée",
                "en_ligne": "Téléconsultation possible",
                "urgence": "Consultation d'urgence nécessaire"
            }.get(consultation_type, "Consultation recommandée"),
            "explanation": triage_data.get("explanation", ""),
            "raw_response": ai_response
        }
        
        return JSONResponse(response_data)
        
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=500, 
            detail="Impossible de se connecter à Ollama. Assurez-vous qu'Ollama est démarré."
        )
    except Exception as e:
        print(f"Erreur: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")
```

**Sauvegardez le fichier** (Ctrl+S)

---

### 🚀 **Étape 2 : Redémarrer le backend IA**

1. **Arrêtez** le backend IA actuel (Ctrl+C dans le terminal)
2. **Relancez** :
   ```bash
   cd backend-ai
   venv\Scripts\activate
   uvicorn main:app --reload --port 8000
   ```

Vous devriez voir :
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### 🧪 **Étape 3 : Tester**

1. **Retournez sur l'application** (http://localhost:3000)
2. **Menu** → **IA Clinique**
3. **Tapez** : `"J'ai mal à la tête et de la fièvre depuis 2 jours"`
4. **Cliquez** : "Analyser mes symptômes"
5. ⏳ **Attendez** (peut prendre 10-15 secondes la première fois)
6. ✅ **Les résultats s'affichent !**

---

## 🐛 **DÉPANNAGE**

### Problème 1 : "Impossible de se connecter à Ollama"

**Solution** : Démarrez Ollama

**Windows** :
- Ollama démarre automatiquement après installation
- Si pas démarré : Cherchez "Ollama" dans le menu Démarrer et lancez-le
- Ou dans le terminal : `ollama serve`

### Problème 2 : "Model llama3.2 not found"

**Solution** :
```bash
ollama pull llama3.2
```

### Problème 3 : Réponses lentes

**C'est normal** la première fois ! Ollama charge le modèle en mémoire.
- Première requête : 10-20 secondes
- Requêtes suivantes : 2-5 secondes

### Problème 4 : "Out of memory"

**Solution** : Utilisez un modèle plus petit
```bash
ollama pull llama3.2:1b
```
Puis dans `main.py`, changez `"model": "llama3.2"` en `"model": "llama3.2:1b"`

---

## 📊 **COMPARAISON OLLAMA vs OPENAI**

| Critère | Ollama | OpenAI |
|---------|--------|--------|
| **Prix** | Gratuit ✅ | Payant 💰 |
| **Vitesse** | 2-5 sec | 1-2 sec |
| **Précision médicale** | 7/10 | 9/10 |
| **Installation** | Locale | API Cloud |
| **Quota** | Illimité ✅ | Limité |
| **Vie privée** | 100% privé ✅ | Cloud |
| **RAM requise** | 8GB+ | 0 |

---

## ✅ **CHECKLIST**

- [ ] Ollama téléchargé et installé
- [ ] Modèle `llama3.2` téléchargé (`ollama pull llama3.2`)
- [ ] Test `ollama run llama3.2 "test"` fonctionne
- [ ] Fichier `backend-ai/main.py` modifié
- [ ] Backend IA redémarré sur port 8000
- [ ] Test dans l'application réussi

---

## 🎯 **AVANTAGES POUR VOTRE PROJET**

### Développement
- ✅ Testez sans limite
- ✅ Pas de frais
- ✅ Pas besoin de carte bancaire

### Production
- Pour la production, vous pourrez choisir :
  - Ollama (gratuit, privé)
  - OpenAI (plus précis, mais payant)
  - Les deux (OpenAI en priorité, Ollama en fallback)

---

## 🔄 **RETOUR À OPENAI (si souhaité plus tard)**

Pour revenir à OpenAI :
1. Récupérez l'ancien code de `main.py` (voir TRIAGE_IA_CLINIQUE.md)
2. Ajoutez des crédits OpenAI
3. Redémarrez le backend

---

**🎉 Avec Ollama, votre Triage IA est 100% gratuit et illimité ! 🤖💚**

