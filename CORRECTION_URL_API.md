# 🐛 CORRECTION : Erreur URL API

## 🔴 **PROBLÈME IDENTIFIÉ**

**Erreur affichée** :
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

Cette erreur signifie que l'API renvoie du **HTML** au lieu de **JSON**.

---

## 🎯 **CAUSE**

**Mauvaise URL dans le frontend** :
- ❌ Frontend appelait : `/api/patient/prescriptions` (singulier)
- ✅ Backend attendait : `/api/patients/prescriptions` (pluriel)

➡️ Résultat : **404 Not Found** → Page HTML d'erreur renvoyée

---

## ✅ **CORRECTION APPLIQUÉE**

### Fichier : `frontend/src/app/dashboard/patient/prescriptions/page.tsx`

**Avant** :
```typescript
const response = await fetch('http://localhost:3001/api/patient/prescriptions', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Après** :
```typescript
const response = await fetch('http://localhost:3001/api/patients/prescriptions', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

**Changement** : `patient` → `patients` (avec 's')

---

## 📋 **ROUTES BACKEND ACTUELLES**

Voici les préfixes de routes enregistrés dans `backend-api/src/server.ts` :

```typescript
// Auth
app.use('/api/auth', authRoutes);

// Utilisateurs par rôle (PLURIELS)
app.use('/api/patients', patientRoutes);    // ← PLURIEL
app.use('/api/doctors', doctorRoutes);      // ← PLURIEL

// Données médicales
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/elearning', elearningRoutes);
app.use('/api/kenepoints', kenepointsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/healthcenters', healthcenterRoutes);
app.use('/api/ai', aiRoutes);

// Admin
app.use('/api/admin', adminRoutes);
```

---

## 🔍 **COMMENT DIAGNOSTIQUER CE TYPE D'ERREUR**

### **Symptôme** : "Unexpected token '<', "<!DOCTYPE "..."

**Causes possibles** :

1. **Backend API non démarré**
   - Test : `curl http://localhost:3001/`
   - Solution : Démarrer le backend

2. **URL incorrecte (404)**
   - Test : Vérifier l'URL dans le code
   - Solution : Corriger l'URL pour correspondre aux routes backend

3. **Mauvais port**
   - Test : Vérifier que le backend tourne bien sur 3001
   - Solution : Ajuster le port dans les appels API

4. **Erreur serveur (500)**
   - Test : Regarder les logs du backend
   - Solution : Corriger le bug côté serveur

---

## 🧪 **VÉRIFICATION DE LA CORRECTION**

### **Test 1 : Vérifier l'URL**
```bash
curl -X GET http://localhost:3001/api/patients/prescriptions \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Résultat attendu** : JSON (pas de HTML)

### **Test 2 : Logs frontend (F12)**
```
📡 Statut réponse: 200        ← Bon (pas 404)
✅ Données reçues: {...}
📋 Nombre d'ordonnances: 1
```

### **Test 3 : Logs backend**
```
🔍 Récupération ordonnances pour userId: X
👤 Patient trouvé: ID X
📋 Total consultations patient: X
💊 Consultations avec ordonnances: X
✅ Ordonnances formatées: X
```

---

## 📝 **BONNE PRATIQUE : Convention de nommage des routes**

Pour éviter cette confusion à l'avenir :

### **Backend** (`server.ts`)
```typescript
// Toujours utiliser le PLURIEL pour les collections
app.use('/api/patients', patientRoutes);      // ✅ Pluriel
app.use('/api/doctors', doctorRoutes);        // ✅ Pluriel
app.use('/api/appointments', appointmentRoutes); // ✅ Pluriel
```

### **Frontend**
```typescript
// Utiliser le MÊME préfixe que le backend
fetch('http://localhost:3001/api/patients/...')   // ✅ Pluriel
fetch('http://localhost:3001/api/doctors/...')    // ✅ Pluriel
```

### **Routes spécifiques**
```typescript
// Patient connecté (ses propres données)
GET /api/patients/me/dse            // Mon DSE
GET /api/patients/me/appointments   // Mes RDV
GET /api/patients/prescriptions     // Mes ordonnances (patient connecté)

// Accès à un patient spécifique (médecins/admin)
GET /api/patients/:id               // Patient spécifique
```

---

## ✅ **CHECKLIST DE VÉRIFICATION**

Avant de créer une nouvelle route API :

- [ ] Le préfixe de route dans `server.ts` est-il au pluriel ?
- [ ] L'URL dans le frontend correspond-elle exactement au backend ?
- [ ] Les logs montrent-ils le bon statut (200, pas 404) ?
- [ ] La réponse est-elle du JSON (pas du HTML) ?

---

## 🎉 **RÉSULTAT**

Après correction, la page "Mes Ordonnances" fonctionne correctement :
- ✅ URL corrigée
- ✅ Statut 200 (au lieu de 404)
- ✅ JSON renvoyé (au lieu de HTML)
- ✅ Ordonnances affichées

---

**Date de correction** : 26 octobre 2025
**Fichiers modifiés** : `frontend/src/app/dashboard/patient/prescriptions/page.tsx`

