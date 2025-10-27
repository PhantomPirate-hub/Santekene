# 🔍 DEBUG - Erreurs Rendez-vous

## ❌ Problèmes rencontrés

### 1. Erreur lors de la création d'un RDV
```
localhost:3000 indique
Erreur serveur :
Invalid prisma.appointment.create() invocation in
C:\laragon\www\Santenkene\backend-api\src\controllers\patient.controller.ts:458:50
```

### 2. Erreur lors de la modification d'un RDV
```
Erreur serveur
```

---

## ✅ Corrections appliquées

### Backend - `patient.controller.ts`

#### 1. Création de RDV (`createAppointment`)

**Problèmes possibles** :
- Types incorrects (string au lieu de number, etc.)
- Champs manquants dans la DB
- Valeurs null/undefined mal gérées

**Corrections** :
```typescript
// Conversion explicite des types
const appointmentData = {
  patientId: patient.id,
  doctorId: parseInt(doctorId),           // ✅ Conversion explicite
  date: new Date(date),                    // ✅ Conversion en Date
  type: type || 'Consultation générale',   // ✅ Valeur par défaut
  reason: reason || null,                  // ✅ null au lieu de string vide
  notes: notes || null,                    // ✅ null au lieu de string vide
  isVideo: Boolean(isVideo),               // ✅ Conversion explicite en boolean
  status: 'PENDING' as const,              // ✅ Type littéral
};
```

**Logs ajoutés** :
```typescript
console.log('🔍 Données reçues:', { doctorId, date, type, reason, notes, isVideo });
console.log('🔍 Types:', {
  doctorId: typeof doctorId,
  date: typeof date,
  type: typeof type,
  isVideo: typeof isVideo,
});
console.log('✅ Données préparées:', appointmentData);
```

**Gestion d'erreur améliorée** :
```typescript
catch (error: any) {
  console.error('=== ERREUR CRÉATION RDV ===');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.error('Détails complets:', error);
  return res.status(500).json({ 
    error: 'Erreur serveur',
    details: error.message 
  });
}
```

---

#### 2. Modification de RDV (`updateAppointment`)

**Problèmes possibles** :
- Mêmes problèmes que la création
- Données mal récupérées depuis le formulaire

**Corrections** :
```typescript
// Préparer les données de mise à jour
const updateData: any = {};
if (doctorId) updateData.doctorId = parseInt(doctorId);
if (date) updateData.date = new Date(date);
if (type) updateData.type = type;
if (reason !== undefined) updateData.reason = reason || null;
if (notes !== undefined) updateData.notes = notes || null;
if (isVideo !== undefined) updateData.isVideo = Boolean(isVideo);
```

**Logs ajoutés** :
```typescript
console.log('🔍 Modification RDV ID:', id);
console.log('🔍 Données reçues:', { doctorId, date, type, reason, notes, isVideo });
console.log('✅ Données préparées pour mise à jour:', updateData);
console.log('✅ RDV modifié avec succès:', updatedAppointment.id);
```

**Gestion d'erreur améliorée** :
```typescript
catch (error: any) {
  console.error('❌ Erreur modification RDV:', error);
  console.error('❌ Stack:', error.stack);
  return res.status(500).json({ 
    error: 'Erreur serveur',
    details: error.message 
  });
}
```

---

### Frontend - `appointments/page.tsx`

#### 1. Interface Appointment

**Ajout des champs manquants** :
```typescript
interface Appointment {
  id: number;
  date: string;
  type: string;
  status: string;
  reason?: string;
  notes?: string;
  isVideo?: boolean;      // ✅ AJOUTÉ
  videoLink?: string;     // ✅ AJOUTÉ
  location?: string;
  doctor: {
    user: {
      name: string;
      email: string;
      phone?: string;
    };
    speciality: string;
  };
}
```

---

#### 2. Logs de création

**Ajout de logs détaillés** :
```typescript
const requestBody = {
  doctorId: parseInt(formData.doctorId),
  date: dateTime,
  type: formData.type,
  reason: formData.reason,
  notes: formData.notes,
  isVideo: formData.isVideo,
};

console.log('🔍 Données envoyées au backend:', requestBody);
console.log('🔍 Types:', {
  doctorId: typeof requestBody.doctorId,
  date: typeof requestBody.date,
  type: typeof requestBody.type,
  isVideo: typeof requestBody.isVideo,
});
```

---

#### 3. Récupération isVideo pour modification

**Correction** :
```typescript
// ❌ AVANT
isVideo: (appointment as any).isVideo || false,

// ✅ APRÈS
isVideo: appointment.isVideo || false,
```

---

## 🧪 Procédure de test

### 1. Redémarrer le backend

```bash
cd backend-api
npm run dev
```

**Vérifiez que le serveur démarre sans erreur.**

---

### 2. Tester la création d'un RDV

**Ouvrir les consoles** :
1. Console du navigateur (F12 → Console)
2. Terminal du backend (là où tourne `npm run dev`)

**Créer un RDV** :
1. Aller sur `/dashboard/patient/appointments`
2. Cliquer sur "Nouveau Rendez-vous"
3. Remplir tous les champs
4. Cliquer sur "Enregistrer"

**Observer les logs** :

**Frontend (Console navigateur)** :
```
🔍 Données envoyées au backend: {
  doctorId: 1,
  date: "2024-01-15T14:30:00",
  type: "Consultation générale",
  reason: "...",
  notes: "...",
  isVideo: false
}
🔍 Types: {
  doctorId: "number",
  date: "string",
  type: "string",
  isVideo: "boolean"
}
```

**Backend (Terminal)** :
```
🔍 Données reçues: { doctorId: 1, date: '2024-01-15T14:30:00', ... }
🔍 Types: { doctorId: 'number', date: 'string', ... }
✅ Données préparées: { patientId: 2, doctorId: 1, ... }
✅ RDV créé avec succès: 5
```

**Si erreur** :
```
❌ Erreur création RDV: Error
❌ Message: [MESSAGE D'ERREUR PRÉCIS]
❌ Stack: [STACK TRACE]
```

---

### 3. Tester la modification d'un RDV

**Même processus** :
1. Ouvrir les deux consoles
2. Cliquer sur "Modifier" d'un RDV
3. Modifier des champs
4. Cliquer sur "Enregistrer les modifications"

**Observer les logs** :

**Backend (Terminal)** :
```
🔍 Modification RDV ID: 5
🔍 Données reçues: { date: '2024-01-16T10:00:00', ... }
✅ Données préparées pour mise à jour: { date: Date, ... }
✅ RDV modifié avec succès: 5
```

**Si erreur** :
```
❌ Erreur modification RDV: Error
❌ Stack: [STACK TRACE]
```

---

## 📊 Diagnostics possibles

### Erreur : "Unknown field 'X'"

**Cause** : Le champ n'existe pas dans la table `Appointment` de la DB.

**Solution** :
```bash
cd backend-api
npx prisma db push
npx prisma generate
```

Puis redémarrer le backend.

---

### Erreur : "Invalid type for X"

**Cause** : Un champ a le mauvais type.

**Exemple** :
```
Expected type: Int
Received type: String
```

**Solution** : Les logs montreront quel champ pose problème. Vérifier le type envoyé dans le frontend.

---

### Erreur : "Foreign key constraint failed"

**Cause** : Le `doctorId` n'existe pas dans la table `Doctor`.

**Solution** : Vérifier que le médecin sélectionné existe dans la base de données.

**Test** :
```bash
cd backend-api
npx prisma studio
# Aller dans la table Doctor et vérifier les IDs
```

---

### Erreur : "Cannot read property 'id' of null"

**Cause** : L'utilisateur ou le patient n'a pas été trouvé.

**Solution** : Vérifier que :
1. L'utilisateur est bien connecté (token valide)
2. Un profil `Patient` existe pour cet utilisateur

---

## 📋 Checklist de vérification

Avant de tester :

- [x] Backend redémarré
- [x] Console navigateur ouverte (F12)
- [x] Terminal backend visible
- [x] Médecins présents dans la DB (vérifier avec Prisma Studio)

Lors du test :

- [ ] Logs frontend affichés
- [ ] Logs backend affichés
- [ ] Types corrects (number, string, boolean)
- [ ] Pas d'erreur Prisma

Si erreur :

- [ ] Copier les logs frontend
- [ ] Copier les logs backend
- [ ] Copier le message d'erreur exact
- [ ] Envoyer tout au développeur

---

## 🔧 Commandes utiles

**Vérifier la DB** :
```bash
cd backend-api
npx prisma studio
```

**Réinitialiser la DB** (⚠️ DANGER : supprime toutes les données) :
```bash
cd backend-api
npx prisma migrate reset
npx prisma db seed
```

**Vérifier le schéma Prisma** :
```bash
cd backend-api
npx prisma format
npx prisma validate
```

**Régénérer le client Prisma** :
```bash
cd backend-api
npx prisma generate
```

---

## 📞 Informations à fournir si l'erreur persiste

1. **Logs du backend** (copier tout ce qui s'affiche dans le terminal)
2. **Logs du frontend** (console navigateur, onglet "Console")
3. **Message d'erreur exact** (capture d'écran si possible)
4. **Données envoyées** (affichées dans les logs `🔍`)
5. **Version de Node.js** : `node --version`
6. **Version de Prisma** : `npx prisma --version`

---

**🔍 Avec tous ces logs, nous pourrons identifier le problème précis !**

