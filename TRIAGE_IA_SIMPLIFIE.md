# 🤖 TRIAGE IA SIMPLIFIÉ - INTERFACE PATIENT

## 🎯 **OBJECTIF**

Interface simple et claire pour les **patients** uniquement :
- ✅ Décrire ses symptômes
- ✅ Recevoir une analyse IA
- ✅ Obtenir des recommandations
- ✅ Voir des médecins disponibles
- ❌ Pas de champs médicaux complexes (poids, tension, etc.)
- ❌ Pas de DSE à ce niveau
- ❌ Pas d'interface médecin (c'est séparé)

---

## 🎨 **INTERFACE SIMPLIFIÉE**

### 📋 **Formulaire de saisie** - `AITriageForm.tsx`

**1. Zone de texte unique**
- Grande zone de saisie (8 lignes)
- Placeholder avec exemple concret
- Instructions intégrées dans le formulaire

**2. Un seul bouton d'action**
- "Analyser mes symptômes" (vert avec icône 🧠)
- Désactivé si texte vide
- Affiche "Analyse en cours..." pendant le traitement

**3. Design moderne**
- Carte avec dégradé vert/bleu
- Icône cerveau dans un cercle vert
- Info-bulle "Comment ça marche ?"
- Messages d'erreur clairs

**4. Logs de debug**
```javascript
console.log('🔄 Envoi des symptômes:', text);
console.log('📍 Géolocalisation ajoutée');
console.log('🌐 Appel API:', url);
console.log('✅ Réponse reçue:', data);
```

---

### 📊 **Résultats de l'analyse** - `AITriageResults.tsx`

**Affichage simple et progressif :**

#### 1. **Niveau d'urgence** (Card colorée)
- 🟢 Vert : Urgence faible
- 🟠 Orange : Urgence modérée
- 🔴 Rouge : Urgence élevée
- Badge + icône + résumé clair

#### 2. **Spécialités recommandées**
- Badges bleus avec les spécialités
- Ex: "Médecine Générale", "Cardiologie"

#### 3. **Précautions à prendre** (si applicable)
- Liste à puces avec icônes
- Mesures avant consultation
- Ex: "Repos", "Hydratation", "Éviter l'effort"

#### 4. **Recommandations** (si applicable)
- Conseils personnalisés
- Ex: "Consulter sous 48h", "Surveiller la température"

#### 5. **Médecins disponibles** (chargés automatiquement)
- Carte pour chaque médecin :
  - Photo (icône utilisateur)
  - Nom + Spécialité
  - Téléphone (si disponible)
  - **Bouton "Prendre RDV"** (vert) → Redirige vers appointments

#### 6. **Hôpitaux proches** (chargés automatiquement)
- Carte pour chaque hôpital :
  - Icône bâtiment
  - Nom + Ville
  - Distance (si géolocalisation activée)
  - Badge "🚨 Urgences 24/7" si applicable
  - **Bouton "Itinéraire"** → Redirige vers la carte

#### 7. **Bouton d'action urgence** (si urgence élevée)
- Gros bouton rouge : "Trouver une urgence maintenant"
- Redirige vers la carte des hôpitaux

---

## 🔄 **FLUX UTILISATEUR**

```
1. Patient ouvre "Triage IA" dans le menu
   ↓
2. Patient tape ses symptômes dans la zone de texte
   Ex: "J'ai de la fièvre et mal à la tête"
   ↓
3. Patient clique sur "Analyser mes symptômes"
   ↓
4. [Géolocalisation demandée si première fois]
   ↓
5. Analyse IA en cours (backend-ai port 8000)
   - Évaluation de l'urgence
   - Identification des spécialités
   - Génération des recommandations
   ↓
6. Résultats s'affichent EN DESSOUS du formulaire
   - Niveau d'urgence (coloré)
   - Précautions et recommandations
   ↓
7. Chargement automatique des médecins (backend-api)
   - Recherche par spécialités recommandées
   - Maximum 5 médecins
   ↓
8. Chargement automatique des hôpitaux
   - 3 hôpitaux les plus proches
   - Calcul des distances
   ↓
9. Patient peut :
   - Cliquer "Prendre RDV" → Page rendez-vous
   - Cliquer "Itinéraire" → Carte interactive
   - Si urgent : "Trouver une urgence" → Carte
```

---

## 🛠️ **TECHNIQUE**

### Frontend - `AITriageForm.tsx`

**État simplifié :**
```typescript
const [symptomsText, setSymptomsText] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Fonction d'envoi :**
```typescript
const sendSymptomsForTriage = async (text: string) => {
  setIsLoading(true);
  setError(null);
  
  const formData = new URLSearchParams();
  formData.append('symptoms', text);
  
  // Géolocalisation optionnelle
  if (navigator.geolocation) {
    const position = await new Promise(...);
    formData.append('latitude', position.coords.latitude.toString());
    formData.append('longitude', position.coords.longitude.toString());
  }
  
  const response = await fetch(`${AI_API_URL}/api/ai/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });
  
  const data = await response.json();
  setTriageResults(data); // Affiche les résultats
  setIsLoading(false);
};
```

### Frontend - `AITriageResults.tsx`

**Chargement automatique des recommandations :**
```typescript
useEffect(() => {
  fetchRecommendations();
}, [results.specialties, userLocation]);

const fetchRecommendations = async () => {
  // 1. Récupérer les médecins
  const doctorsRes = await fetch(
    `${API_URL}/api/ai/recommended-doctors?specialties=${results.specialties.join(',')}`
  );
  
  // 2. Récupérer les hôpitaux
  const healthCentersRes = await fetch(
    `${API_URL}/api/ai/recommended-healthcenters?latitude=${lat}&longitude=${lon}`
  );
};
```

---

## ✅ **CE QUI A ÉTÉ ENLEVÉ**

Pour simplifier l'interface patient :

- ❌ **Champs poids/tension** - Pas nécessaire pour triage
- ❌ **Accès au DSE** - C'est pour le médecin
- ❌ **Historique médical** - Pas à ce niveau
- ❌ **Enregistrement vocal Whisper** - Simplifié (à réactiver si besoin)
- ❌ **Données médicales complexes** - Interface trop technique

**Résultat :** Interface épurée, focalisée sur l'essentiel

---

## 🧪 **COMMENT TESTER**

### Prérequis
1. **Backend IA** doit tourner sur port 8000
2. **Backend API** doit tourner sur port 3001
3. **Frontend** doit tourner sur port 3000

### Démarrage

**Terminal 1 - Backend IA :**
```bash
cd backend-ai
python -m venv venv
venv\Scripts\activate  # Windows
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Backend API :**
```bash
cd backend-api
npm run dev
```

**Terminal 3 - Frontend :**
```bash
cd frontend
npm run dev
```

### Test complet

1. **Connexion** : `patient1@example.com` / `1234`

2. **Navigation** : Menu → Triage IA

3. **Saisie symptômes** (exemples) :

   **Urgence faible :**
   ```
   J'ai un petit rhume depuis hier, j'éternue de temps en temps
   ```

   **Urgence modérée :**
   ```
   J'ai de la fièvre à 38.5°C depuis 2 jours, des maux de tête 
   intenses et je me sens très fatigué
   ```

   **Urgence élevée :**
   ```
   J'ai une douleur intense dans la poitrine qui irradie vers 
   le bras gauche, j'ai du mal à respirer
   ```

4. **Clic sur "Analyser mes symptômes"**

5. **Vérifier l'affichage :**
   - ✅ Badge d'urgence coloré apparaît
   - ✅ Résumé de l'analyse
   - ✅ Spécialités recommandées
   - ✅ Précautions listées
   - ✅ Recommandations listées
   - ✅ Médecins disponibles (avec bouton RDV)
   - ✅ Hôpitaux proches (avec distance)

6. **Tester les actions :**
   - Cliquer "Prendre RDV" → Redirection appointments
   - Cliquer "Itinéraire" → Redirection carte
   - Si urgent : "Trouver une urgence" → Redirection carte

---

## 🐛 **DEBUGGING**

### Ouvrir la Console (F12)

**Messages attendus :**
```
🔄 Envoi des symptômes: J'ai de la fièvre...
📍 Géolocalisation ajoutée
🌐 Appel API: http://localhost:8000/api/ai/triage
✅ Réponse reçue: {urgency: "modéré", summary: "...", ...}
```

### Problèmes courants

**1. "Erreur lors du triage IA"**
- ❌ Backend IA pas démarré
- ✅ Solution : `uvicorn main:app --reload --port 8000`

**2. "Aucun médecin trouvé"**
- ❌ Backend API pas démarré OU pas de médecins en DB
- ✅ Solution : 
  - `npm run dev` (backend-api)
  - `npm run seed` (si besoin)

**3. "Distance non affichée"**
- ❌ Géolocalisation refusée
- ✅ Solution : Accepter la géolocalisation dans le navigateur

**4. "Failed to fetch"**
- ❌ URL incorrecte ou backend non accessible
- ✅ Solution : Vérifier `.env.local` :
  ```
  NEXT_PUBLIC_AI_API_URL=http://localhost:8000
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

---

## 📈 **AVANTAGES DE LA SIMPLIFICATION**

### Pour les patients :
- ✅ Interface intuitive (1 champ, 1 bouton)
- ✅ Pas de termes médicaux compliqués
- ✅ Résultats clairs et visuels
- ✅ Actions directes (RDV, Itinéraire)
- ✅ Rapide (pas de formulaire long)

### Pour le système :
- ✅ Code plus maintenable
- ✅ Moins de bugs potentiels
- ✅ Performance optimale
- ✅ Focus sur l'essentiel
- ✅ Séparation claire patient/médecin

---

## 🔮 **PROCHAINES ÉTAPES**

### Pour les médecins (séparé)
- [ ] Interface médecin pour consultation
- [ ] Accès au DSE du patient
- [ ] Saisie poids/tension/constantes
- [ ] Prescription en ligne
- [ ] Notes de consultation

### Améliorations patient (optionnel)
- [ ] Réactiver enregistrement vocal Whisper
- [ ] Historique des analyses IA
- [ ] Partage résultats avec médecin
- [ ] Notifications SMS si urgence
- [ ] Multi-langues (Bambara, Français, Anglais)

---

## ✅ **RÉSUMÉ**

L'interface de **Triage IA** est maintenant :

- ✅ **Simple** : 1 champ de texte, 1 bouton
- ✅ **Claire** : Résultats visuels et explicites
- ✅ **Fonctionnelle** : Analyse IA + Recommandations
- ✅ **Actionable** : Boutons RDV et Itinéraire
- ✅ **Adaptée** : Pour patients uniquement
- ✅ **Debuggable** : Logs dans console

**🎉 Interface patient optimisée et opérationnelle ! 🤖💚**

---

## 📞 **SUPPORT**

En cas de problème :
1. Ouvrir la console (F12)
2. Chercher les logs de debug (🔄 📍 🌐 ✅)
3. Vérifier que les 3 services tournent
4. Vérifier les variables d'environnement

**Tout est maintenant prêt pour aider les patients ! 🚀**

