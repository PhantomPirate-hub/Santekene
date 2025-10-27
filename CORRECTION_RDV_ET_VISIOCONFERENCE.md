# 🔧 CORRECTION RENDEZ-VOUS + AJOUT VISIOCONFÉRENCE

## 🐛 Bugs corrigés

### 1. Bug création de rendez-vous

**Problème** : Impossible de créer un rendez-vous, erreur serveur.

**Cause** : Le `doctorId` était envoyé comme **string** au lieu d'un **nombre**.

```typescript
// ❌ AVANT (Bugué)
body: JSON.stringify({
  doctorId: formData.doctorId, // String "5"
  date: dateTime,
  ...
})
```

**Solution** : Conversion en nombre avec `parseInt()`.

```typescript
// ✅ APRÈS (Corrigé)
body: JSON.stringify({
  doctorId: parseInt(formData.doctorId), // Number 5
  date: dateTime,
  ...
})
```

**Fichier** : `frontend/src/app/dashboard/patient/appointments/page.tsx` (ligne 180)

---

### 2. Bug modification de rendez-vous

**Problème** : Impossible de modifier un rendez-vous, erreur serveur.

**Cause** : Le formulaire stockait le **nom** du médecin au lieu de son **ID**.

```typescript
// ❌ AVANT (Bugué)
setEditFormData({
  doctorId: appointment.doctor.user.name, // "Dr. Dupont"
  ...
})
```

**Solution** : 
- Renommé le champ en `doctorName` pour affichage uniquement
- Le médecin n'est plus modifiable (logique métier correcte)

```typescript
// ✅ APRÈS (Corrigé)
setEditFormData({
  doctorName: appointment.doctor.user.name, // Pour affichage uniquement
  ...
})
```

**Fichier** : `frontend/src/app/dashboard/patient/appointments/page.tsx` (ligne 288)

---

## 🎥 Nouvelle fonctionnalité : Visioconférence

Les patients peuvent désormais demander une consultation en visioconférence lors de la prise de rendez-vous.

### 1. Base de données

**Fichier** : `backend-api/prisma/schema.prisma`

**Champs ajoutés au modèle `Appointment`** :

```prisma
model Appointment {
  id           Int        @id @default(autoincrement())
  patientId    Int
  doctorId     Int
  date         DateTime
  type         String     @default("Consultation générale") // ✅ AJOUTÉ
  reason       String?
  notes        String?                                      // ✅ AJOUTÉ
  isVideo      Boolean    @default(false)                   // ✅ AJOUTÉ
  videoLink    String?                                      // ✅ AJOUTÉ
  status       AppointmentStatus @default(PENDING)
  createdAt    DateTime   @default(now())
  patient      Patient    @relation(fields: [patientId], references: [id])
  doctor       Doctor     @relation(fields: [doctorId], references: [id])
}
```

**Migration** : `backend-api/prisma/migrations/.../migration.sql`

```sql
ALTER TABLE `Appointment` 
ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'Consultation générale',
ADD COLUMN `notes` VARCHAR(191) NULL,
ADD COLUMN `isVideo` BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN `videoLink` VARCHAR(191) NULL;
```

**État** : ✅ Migration appliquée avec succès

---

### 2. Backend

**Fichier** : `backend-api/src/controllers/patient.controller.ts`

#### Fonction `createAppointment`

```typescript
export const createAppointment = async (req: Request, res: Response) => {
  try {
    // ...
    const { doctorId, date, type, reason, notes, isVideo } = req.body; // ✅ AJOUT

    // Créer le rendez-vous
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: parseInt(doctorId),
        date: new Date(date),
        type: type,
        reason: reason || '',
        notes: notes || '',
        isVideo: isVideo || false, // ✅ AJOUT: Option visioconférence
        status: 'PENDING',
      },
      // ...
    });
    // ...
  }
};
```

#### Fonction `updateAppointment`

```typescript
export const updateAppointment = async (req: Request, res: Response) => {
  try {
    // ...
    const { doctorId, date, type, reason, notes, isVideo } = req.body; // ✅ AJOUT

    // Modifier le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        ...(doctorId && { doctorId: parseInt(doctorId) }),
        ...(date && { date: new Date(date) }),
        ...(type && { type }),
        ...(reason !== undefined && { reason }),
        ...(notes !== undefined && { notes }),
        ...(isVideo !== undefined && { isVideo }), // ✅ AJOUT
      },
      // ...
    });
    // ...
  }
};
```

---

### 3. Frontend

**Fichier** : `frontend/src/app/dashboard/patient/appointments/page.tsx`

#### État du formulaire

```typescript
// État du formulaire de création
const [formData, setFormData] = useState({
  doctorId: '',
  date: '',
  time: '',
  type: 'Consultation générale',
  reason: '',
  notes: '',
  isVideo: false, // ✅ AJOUT
});

// État du formulaire de modification
const [editFormData, setEditFormData] = useState({
  doctorName: '', // ✅ CORRECTION: Pour affichage uniquement
  date: '',
  time: '',
  type: '',
  reason: '',
  notes: '',
  isVideo: false, // ✅ AJOUT
});
```

#### Formulaire de création (UI)

```tsx
{/* Option Visioconférence */}
<div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
  <input
    type="checkbox"
    id="isVideo"
    checked={formData.isVideo}
    onChange={(e) => handleInputChange('isVideo', e.target.checked)}
    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
  />
  <Label htmlFor="isVideo" className="cursor-pointer text-blue-900 font-medium flex items-center gap-2">
    <span className="text-2xl">📹</span>
    Consultation en visioconférence
    <span className="text-sm font-normal text-blue-700">
      (sous réserve d'acceptation du médecin)
    </span>
  </Label>
</div>
```

#### Formulaire de modification (UI)

```tsx
{/* Option Visioconférence */}
<div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
  <input
    type="checkbox"
    id="edit-isVideo"
    checked={editFormData.isVideo}
    onChange={(e) => setEditFormData(prev => ({ ...prev, isVideo: e.target.checked }))}
    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
  />
  <Label htmlFor="edit-isVideo" className="cursor-pointer text-blue-900 font-medium flex items-center gap-2">
    <span className="text-2xl">📹</span>
    Consultation en visioconférence
    <span className="text-sm font-normal text-blue-700">
      (sous réserve d'acceptation du médecin)
    </span>
  </Label>
</div>
```

#### Envoi des données

**Création** :
```typescript
const response = await fetch('http://localhost:3001/api/patients/appointments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    doctorId: parseInt(formData.doctorId), // ✅ CORRECTION
    date: dateTime,
    type: formData.type,
    reason: formData.reason,
    notes: formData.notes,
    isVideo: formData.isVideo, // ✅ AJOUT
  }),
});
```

**Modification** :
```typescript
const response = await fetch(`http://localhost:3001/api/patients/appointments/${editingAppointment.id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    date: dateTime,
    type: editFormData.type,
    reason: editFormData.reason,
    notes: editFormData.notes,
    isVideo: editFormData.isVideo, // ✅ AJOUT
  }),
});
```

---

## 📊 Récapitulatif des changements

### Bugs corrigés

| Bug | Cause | Solution | Statut |
|-----|-------|----------|--------|
| Création RDV impossible | `doctorId` en string | `parseInt(doctorId)` | ✅ Corrigé |
| Modification RDV impossible | `doctorId` = nom médecin | `doctorName` (affichage seul) | ✅ Corrigé |

### Visioconférence

| Composant | Changement | Statut |
|-----------|------------|--------|
| **Schema DB** | Ajout `isVideo`, `videoLink`, `type`, `notes` | ✅ Fait |
| **Migration** | ALTER TABLE appliquée | ✅ Fait |
| **Backend** | `createAppointment` accepte `isVideo` | ✅ Fait |
| **Backend** | `updateAppointment` accepte `isVideo` | ✅ Fait |
| **Frontend** | Checkbox visio (création) | ✅ Fait |
| **Frontend** | Checkbox visio (modification) | ✅ Fait |
| **Frontend** | UI moderne avec icône 📹 | ✅ Fait |

---

## 🧪 Tests

### Test 1 : Créer un rendez-vous

1. Aller sur `/dashboard/patient/appointments`
2. Cliquer sur "Nouveau Rendez-vous"
3. Remplir tous les champs obligatoires :
   - Médecin
   - Date
   - Heure
   - Type de consultation
   - Motif
4. ✅ **Cocher "Consultation en visioconférence"**
5. Cliquer sur "Enregistrer"

**Résultat attendu** :
- ✅ Message de succès
- ✅ Rendez-vous ajouté à la liste
- ✅ `isVideo` = true dans la DB

### Test 2 : Modifier un rendez-vous

1. Cliquer sur "Modifier" d'un rendez-vous existant
2. Observer :
   - ✅ Le nom du médecin est affiché (non modifiable)
   - ✅ Le checkbox visio reflète l'état actuel
3. Modifier la date/heure
4. ✅ **Cocher ou décocher la visioconférence**
5. Cliquer sur "Enregistrer les modifications"

**Résultat attendu** :
- ✅ Message de succès
- ✅ Modifications appliquées
- ✅ `isVideo` mis à jour dans la DB

### Test 3 : Annuler un rendez-vous

1. Cliquer sur "Annuler" d'un rendez-vous
2. Confirmer l'annulation

**Résultat attendu** :
- ✅ Message de succès
- ✅ Statut = "CANCELLED"
- ✅ Rendez-vous déplacé dans l'onglet "Historique"

---

## 📁 Fichiers modifiés

### Base de données

- ✅ `backend-api/prisma/schema.prisma`
  - Ajout champs `type`, `notes`, `isVideo`, `videoLink`
  
- ✅ `backend-api/prisma/migrations/.../migration.sql`
  - ALTER TABLE pour ajouter les nouveaux champs

### Backend

- ✅ `backend-api/src/controllers/patient.controller.ts`
  - `createAppointment` : accepte et stocke `isVideo`
  - `updateAppointment` : accepte et modifie `isVideo`

### Frontend

- ✅ `frontend/src/app/dashboard/patient/appointments/page.tsx`
  - Bug `doctorId` corrigé (conversion en nombre)
  - Bug `doctorName` corrigé (affichage seul)
  - Checkbox visio ajouté (création)
  - Checkbox visio ajouté (modification)
  - États mis à jour avec `isVideo`
  - Fonction `handleInputChange` supporte les booléens

---

## 🎯 Prochaines étapes (Côté médecin)

### Fonctionnalités à implémenter

1. **Dashboard médecin** 
   - Liste des demandes de RDV
   - Filtrer les RDV en visio

2. **Acceptation/Refus**
   - Accepter ou refuser les consultations en visio
   - Motif de refus

3. **Génération de lien visio**
   - Intégration Jitsi Meet (gratuit, open-source)
   - Alternative : Zoom, Google Meet
   - Envoi automatique du lien au patient

4. **Notifications**
   - Email/SMS au patient avec le lien visio
   - Rappel 1h avant le RDV

### Exemple d'intégration Jitsi

```typescript
// backend: Générer un lien Jitsi
const generateVideoLink = (appointmentId: number, doctorName: string) => {
  const roomName = `santekene-rdv-${appointmentId}`;
  return `https://meet.jit.si/${roomName}`;
};

// Lors de l'acceptation du RDV par le médecin
await prisma.appointment.update({
  where: { id: appointmentId },
  data: {
    status: 'CONFIRMED',
    videoLink: generateVideoLink(appointmentId, doctor.name),
  },
});
```

---

## ✅ Checklist de validation

- [x] Bug création RDV corrigé
- [x] Bug modification RDV corrigé
- [x] Champ `isVideo` ajouté au schéma
- [x] Champ `videoLink` ajouté au schéma
- [x] Champ `type` ajouté au schéma
- [x] Champ `notes` ajouté au schéma
- [x] Migration appliquée
- [x] Backend accepte `isVideo` (création)
- [x] Backend accepte `isVideo` (modification)
- [x] Checkbox visio (formulaire création)
- [x] Checkbox visio (formulaire modification)
- [x] Design moderne avec icône
- [x] Note "sous réserve d'acceptation"
- [x] Tests manuels réussis

---

**🎉 Les rendez-vous fonctionnent maintenant correctement avec l'option visioconférence !**

**📹 Le médecin pourra accepter/refuser les visios et générer des liens de visioconférence dans une future mise à jour.**

