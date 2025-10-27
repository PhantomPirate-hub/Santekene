# 📅 Nouvelle Logique de Rendez-vous

## 🔄 Changement Important

### ✅ AVANT
- Le patient choisissait la date et l'heure du RDV
- Le médecin acceptait ou refusait
- Problème : Pas de gestion de disponibilités

### ✅ APRÈS (Nouveau système)
- Le patient fait une **demande de RDV** (sans date/heure)
- Le médecin **propose** une date et une heure disponibles
- Le patient accepte ou demande une autre date
- Plus logique et professionnel !

---

## 📋 Modifications apportées

### 1️⃣ **Base de données (Prisma Schema)**

**Fichier** : `backend-api/prisma/schema.prisma`

**Changement** :
```prisma
model Appointment {
  // ...
  date  DateTime?  // ✅ Maintenant nullable (optionnel)
  // ...
}
```

**Avant** : `date DateTime` (obligatoire)  
**Après** : `date DateTime?` (optionnel)

**Migration** : Appliquée avec `npx prisma db push`

---

### 2️⃣ **Backend (Contrôleur)**

**Fichier** : `backend-api/src/controllers/patient.controller.ts`

#### Fonction `createAppointment`

**Changements** :
1. ❌ Supprimé `date` des paramètres requis
2. ✅ Validation : seulement `doctorId` et `type`
3. ✅ `date: null` lors de la création
4. ✅ Message : "Demande de rendez-vous envoyée avec succès. Le médecin vous proposera une date."

**Avant** :
```typescript
const { doctorId, date, type, reason, notes, isVideo } = req.body;

if (!doctorId || !date || !type) {
  return res.status(400).json({ error: 'Médecin, date et type requis' });
}

const appointmentData = {
  date: new Date(date),
  // ...
};
```

**Après** :
```typescript
const { doctorId, type, reason, notes, isVideo } = req.body;

if (!doctorId || !type) {
  return res.status(400).json({ error: 'Médecin et type requis' });
}

const appointmentData = {
  date: null, // ✅ Le médecin choisira la date plus tard
  // ...
};
```

---

### 3️⃣ **Frontend (Formulaire Patient)**

**Fichier** : `frontend/src/app/dashboard/patient/appointments/page.tsx`

#### A. États du formulaire

**Supprimé** : `date` et `time`

**Avant** :
```typescript
const [formData, setFormData] = useState({
  doctorId: '',
  date: '',      // ❌ SUPPRIMÉ
  time: '',      // ❌ SUPPRIMÉ
  type: '',
  reason: '',
  notes: '',
  isVideo: false,
});
```

**Après** :
```typescript
const [formData, setFormData] = useState({
  doctorId: '',
  type: 'Consultation générale',
  reason: '',
  notes: '',
  isVideo: false,
});
```

---

#### B. Validation

**Avant** :
```typescript
if (!formData.doctorId || !formData.date || !formData.time || !formData.type || !formData.reason) {
  toast.error('Veuillez remplir tous les champs obligatoires');
  return;
}
```

**Après** :
```typescript
if (!formData.doctorId || !formData.type || !formData.reason) {
  toast.error('Veuillez remplir tous les champs obligatoires');
  return;
}
```

---

#### C. Requête backend

**Avant** :
```typescript
const dateTime = `${formData.date}T${formData.time}:00`;

const requestBody = {
  doctorId: parseInt(formData.doctorId),
  date: dateTime,  // ❌ SUPPRIMÉ
  type: formData.type,
  reason: formData.reason,
  notes: formData.notes,
  isVideo: formData.isVideo,
};
```

**Après** :
```typescript
const requestBody = {
  doctorId: parseInt(formData.doctorId),
  type: formData.type,
  reason: formData.reason,
  notes: formData.notes,
  isVideo: formData.isVideo,
};
```

---

#### D. Interface utilisateur

**Supprimé** : Champs `Date` et `Heure`

**Ajouté** : Message d'information

```tsx
{/* Information importante */}
<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
  <div className="flex items-start space-x-3">
    <svg>...</svg>
    <div>
      <h4 className="text-sm font-semibold text-blue-900 mb-1">
        📅 Date et heure à confirmer
      </h4>
      <p className="text-sm text-blue-700">
        Vous faites une demande de rendez-vous. Le médecin vous proposera une date et une heure disponibles qui vous conviendront.
      </p>
    </div>
  </div>
</div>
```

---

#### E. Interface TypeScript

**Avant** :
```typescript
interface Appointment {
  date: string;  // ❌ Toujours une string
  // ...
}
```

**Après** :
```typescript
interface Appointment {
  date: string | null;  // ✅ Peut être null
  // ...
}
```

---

#### F. Fonctions de formatage

**Avant** :
```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { ... });
};
```

**Après** :
```typescript
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Date à confirmer par le médecin';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { ... });
};

const formatTime = (dateString: string | null) => {
  if (!dateString) return 'Heure à définir';
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', { ... });
};
```

---

#### G. Filtrage des RDV

**Avant** :
```typescript
const upcomingAppointments = appointments.filter(apt => 
  new Date(apt.date) >= today && (apt.status === 'PENDING' || apt.status === 'CONFIRMED')
);
```

**Après** :
```typescript
const upcomingAppointments = appointments.filter(apt => 
  // Inclure les RDV sans date (demandes en attente) et ceux à venir
  (!apt.date || new Date(apt.date) >= today) && (apt.status === 'PENDING' || apt.status === 'CONFIRMED')
);
```

---

#### H. Détection RDV passé

**Avant** :
```typescript
const isPast = new Date(appointment.date) < today || 
               appointment.status === 'COMPLETED' || 
               appointment.status === 'CANCELLED';
```

**Après** :
```typescript
const isPast = (appointment.date && new Date(appointment.date) < today) || 
               appointment.status === 'COMPLETED' || 
               appointment.status === 'CANCELLED';
```

---

## 🎨 Interface Utilisateur

### Formulaire de demande de RDV

```
┌─────────────────────────────────────────────┐
│  Nouveau Rendez-vous                        │
├─────────────────────────────────────────────┤
│                                             │
│  📅 Date et heure à confirmer               │
│  Vous faites une demande de rendez-vous.   │
│  Le médecin vous proposera une date...     │
│                                             │
│  Médecin : [Dr. Dupont ▼]                  │
│                                             │
│  Type : [Consultation générale ▼]          │
│                                             │
│  Motif : [Décrire le motif...]             │
│                                             │
│  📹 Consultation en visioconférence [ ]     │
│                                             │
│  Notes : [Informations complémentaires...] │
│                                             │
│  [Annuler]  [✅ Enregistrer]                │
└─────────────────────────────────────────────┘
```

---

### Affichage d'une demande de RDV (sans date)

```
┌─────────────────────────────────────────────┐
│  👨‍⚕️ Dr. Jean Dupont                         │
│  Cardiologue                                │
│                                     [PENDING]│
├─────────────────────────────────────────────┤
│                                             │
│  📅 Date à confirmer par le médecin         │
│  🕐 Heure à définir                         │
│                                             │
│  Type : Consultation générale               │
│                                             │
│  Motif : Douleurs thoraciques               │
│                                             │
│  Actions :                                  │
│  [✏️ Modifier]  [❌ Annuler]                 │
└─────────────────────────────────────────────┘
```

---

### Affichage d'un RDV confirmé (avec date)

```
┌─────────────────────────────────────────────┐
│  👨‍⚕️ Dr. Jean Dupont                         │
│  Cardiologue                              ✅│
├─────────────────────────────────────────────┤
│                                             │
│  📅 Lundi 15 janvier 2024                   │
│  🕐 14:30                                   │
│                                             │
│  Type : Consultation générale               │
│                                             │
│  Motif : Douleurs thoraciques               │
│                                             │
│  Actions :                                  │
│  [✏️ Modifier]  [❌ Annuler]                 │
└─────────────────────────────────────────────┘
```

---

## 🔄 Workflow complet

### 1️⃣ Patient : Faire une demande

1. Aller sur **Mes Rendez-vous**
2. Cliquer sur **"Nouveau Rendez-vous"**
3. Remplir :
   - Médecin
   - Type de consultation
   - Motif
   - Notes (optionnel)
   - Visio (optionnel)
4. **Pas de date/heure à choisir** ✅
5. Cliquer sur **"Enregistrer"**
6. Toast : *"Demande de rendez-vous envoyée avec succès. Le médecin vous proposera une date."*

### 2️⃣ État de la demande

- **Status** : `PENDING`
- **Date** : `null`
- **Affichage** : "Date à confirmer par le médecin"

### 3️⃣ Médecin : Proposer une date (à implémenter)

**Dashboard médecin** (futur) :
1. Voir les demandes de RDV
2. Consulter les disponibilités
3. Proposer une date et une heure
4. Envoyer au patient

### 4️⃣ Patient : Accepter ou refuser (à implémenter)

**Options** :
- ✅ Accepter → Status = `CONFIRMED`
- ❌ Refuser → Demander une autre date
- 🔄 Le médecin propose une nouvelle date

---

## 🧪 Comment tester

### Test 1 : Créer une demande de RDV

1. **Démarrer les services** :
```bash
# Terminal 1 - Backend
cd backend-api
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

2. **Se connecter** comme patient :
   - Email : `patient1@example.com`
   - Mot de passe : `password123`

3. **Aller sur** : `/dashboard/patient/appointments`

4. **Cliquer sur** : "Nouveau Rendez-vous"

5. **Remplir** :
   - Médecin : Dr. Jean Dupont
   - Type : Consultation générale
   - Motif : Test de demande

6. **Vérifier** :
   - ✅ Pas de champ Date/Heure
   - ✅ Message "Date à confirmer par le médecin"

7. **Cliquer sur** : "Enregistrer"

8. **Vérifier** :
   - ✅ Toast vert : "Demande de rendez-vous envoyée avec succès..."
   - ✅ Nouveau RDV affiché
   - ✅ Badge "EN ATTENTE"
   - ✅ "Date à confirmer par le médecin"

---

### Test 2 : Vérifier en base de données

```bash
cd backend-api
npx prisma studio
```

1. **Ouvrir la table** : `Appointment`
2. **Trouver** : Le dernier RDV créé
3. **Vérifier** :
   - `date` = `null` ✅
   - `status` = `PENDING` ✅
   - `patientId`, `doctorId`, `type`, `reason` remplis ✅

---

### Test 3 : Simuler la proposition du médecin

**Dans Prisma Studio** :
1. Sélectionner un RDV avec `date` = `null`
2. Modifier `date` : `2024-01-15 14:30:00`
3. Modifier `status` : `CONFIRMED`
4. Sauvegarder

**Dans le frontend** :
1. Rafraîchir la page
2. Le RDV affiche maintenant :
   - ✅ "Lundi 15 janvier 2024"
   - ✅ "14:30"
   - ✅ Badge "CONFIRMÉ"

---

## 📊 Résumé des fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `backend-api/prisma/schema.prisma` | `date DateTime?` (nullable) |
| `backend-api/src/controllers/patient.controller.ts` | Enlever validation de `date`, mettre `date: null` |
| `frontend/src/app/dashboard/patient/appointments/page.tsx` | Enlever champs date/heure, gérer `date: null` |

---

## 🎯 Prochaines étapes (Dashboard Médecin)

### Fonctionnalités à implémenter :

1. **Voir les demandes de RDV** :
   - Liste des RDV avec `date = null` et `status = PENDING`
   - Détails du patient
   - Motif de la consultation

2. **Proposer une date** :
   - Calendrier des disponibilités
   - Sélectionner date + heure
   - Envoyer au patient

3. **Notifications** :
   - Notifier le patient de la proposition
   - Email ou notification in-app

4. **Gestion des réponses** :
   - Patient accepte → `CONFIRMED`
   - Patient refuse → Proposer une nouvelle date

---

## ✅ Avantages du nouveau système

1. ✅ **Plus professionnel** : Le médecin gère ses disponibilités
2. ✅ **Moins d'annulations** : Pas de conflit d'agenda
3. ✅ **Meilleure UX** : Le patient n'a pas à deviner les disponibilités
4. ✅ **Workflow clair** : Demande → Proposition → Confirmation
5. ✅ **Flexible** : Le patient peut refuser et demander une autre date

---

## 📞 En cas de problème

### Erreur : "date is required"

**Cause** : Le backend attend toujours une date  
**Solution** : Redémarrer le backend après avoir appliqué `npx prisma db push`

### Erreur : "Cannot read property 'toLocaleDateString' of null"

**Cause** : Le frontend ne gère pas les dates nulles  
**Solution** : Les fonctions `formatDate` et `formatTime` ont été mises à jour pour gérer `null`

### RDV n'apparaît pas dans la liste

**Cause** : Le filtrage ne prend pas en compte les dates nulles  
**Solution** : Le filtre `upcomingAppointments` a été mis à jour

---

**🎉 Le nouveau système de demande de RDV est opérationnel ! 🎉**

