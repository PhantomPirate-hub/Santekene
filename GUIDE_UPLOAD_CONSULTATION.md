# 📋 Guide : Upload de Fichiers & Consultation Complète

## ✅ Fonctionnalités Implémentées

### 1. 📤 Upload Réel de Fichiers
- **Middleware Multer** configuré pour gérer les uploads (images + PDF)
- **Stockage local** dans `backend-api/uploads/`
- **Fichiers servis** via `http://localhost:3001/uploads/[filename]`
- **Limite** : 10 MB par fichier
- **Formats acceptés** : JPG, JPEG, PNG, GIF, PDF

### 2. 💊 Affichage Complet des Ordonnances
- **Côté Médecin** : Liste complète des médicaments avec tous les détails
  - Nom du médicament
  - Dosage (ex: 500mg)
  - Durée (ex: 7 jours)
  - Fréquence (ex: 3 fois par jour) - optionnel
  - Instructions (ex: Prendre après les repas) - optionnel
- **Affichage dans l'historique** : Chaque consultation montre l'ordonnance associée

### 3. 🩺 Interface Patient Simplifiée
- **Partie prescription enlevée** des consultations dans le DSE patient
- Les prescriptions sont consultables via le menu dédié "Mes Ordonnances"

---

## 🚀 Comment Tester

### Étape 1 : Démarrer les Services

```powershell
# Terminal 1 : Backend API
cd backend-api
npm run dev

# Terminal 2 : Frontend
cd frontend
npm run dev
```

### Étape 2 : Créer une Consultation Complète (Médecin)

1. **Connexion Médecin**
   - Email : `doctor1@example.com`
   - Mot de passe : `password123`

2. **Rechercher un Patient**
   - Menu : "Consultations"
   - Numéro : `73963323` (M. Aboubacar BANE)
   - Vérifier que l'accès est "Approuvé"

3. **Ouvrir le DSE**
   - Cliquer sur "Consulter le DSE et créer une consultation"
   - Le DSE du patient s'affiche

4. **Créer une Nouvelle Consultation**
   - Cliquer sur "Nouvelle Consultation" (bouton vert)
   - Remplir les champs :

   **Notes de consultation :**
   ```
   Patient présente des symptômes grippaux depuis 3 jours.
   Température : 38.5°C
   Examen clinique : Gorge rouge, ganglions gonflés
   Auscultation pulmonaire normale
   ```

   **Diagnostic :**
   ```
   Grippe saisonnière
   ```

   **Allergies (optionnel) :**
   ```
   Aucune allergie connue
   ```

5. **Ajouter des Médicaments**

   **Médicament 1 :**
   - Nom : `Paracétamol`
   - Dosage : `500mg`
   - Durée : `5 jours`
   - Fréquence : `3 fois par jour`
   - Instructions : `Prendre après les repas avec un grand verre d'eau`
   - Cliquer sur "Ajouter ce médicament"

   **Médicament 2 :**
   - Nom : `Vitamine C`
   - Dosage : `1000mg`
   - Durée : `7 jours`
   - Fréquence : `1 fois par jour`
   - Instructions : `Le matin à jeun`
   - Cliquer sur "Ajouter ce médicament"

6. **Uploader des Documents**

   **Préparer les métadonnées :**
   - Type de document : `Analyse sanguine`
   - Titre (optionnel) : `Numération formule sanguine`

   **Sélectionner des fichiers :**
   - Cliquer sur la zone de drop "Cliquez pour sélectionner des fichiers"
   - Sélectionner une ou plusieurs images/PDFs (max 10 MB)
   - Les fichiers apparaissent dans la liste avec leur taille

7. **Enregistrer la Consultation**
   - Cliquer sur "Enregistrer la consultation" (bouton vert)
   - Attendre le toast de succès
   - La page se recharge automatiquement

### Étape 3 : Vérifier l'Affichage (Médecin)

1. **Onglet "Consultations"**
   - La nouvelle consultation apparaît en haut
   - **Vérifier** :
     - ✅ Date et diagnostic visibles
     - ✅ Notes complètes affichées
     - ✅ Allergies (si renseignées)
     - ✅ **Ordonnance avec TOUS les médicaments**
       - Nom, dosage, durée
       - Fréquence et instructions (si renseignés)
     - ✅ Documents uploadés (avec compteur)
   
2. **Cliquer sur un Document**
   - Un pop-up s'ouvre
   - **Pour une image** : Affichage direct
   - **Pour un PDF** : iframe avec le PDF
   - Bouton "Ouvrir dans un nouvel onglet"

### Étape 4 : Vérifier Côté Patient

1. **Déconnexion & Connexion Patient**
   - Déconnexion du médecin
   - Connexion : `patient1@example.com` / `password123`

2. **Menu "Mon DSE"**
   - Onglet "Consultations"
   - **Vérifier** :
     - ✅ Consultation visible
     - ✅ Diagnostic et notes affichés
     - ✅ **PAS de section "Prescription"** (enlevée)

3. **Menu "Mes Ordonnances"**
   - **Vérifier** :
     - ✅ Ordonnance de la consultation créée
     - ✅ Tous les médicaments listés avec détails complets
     - ✅ Date, médecin, diagnostic

4. **Documents dans le DSE**
   - Onglet "Documents"
   - **Cliquer sur un document**
   - Pop-up s'ouvre avec visualisation

---

## 📁 Structure des Fichiers

### Backend

```
backend-api/
├── src/
│   ├── middleware/
│   │   └── upload.middleware.ts    ✅ Configuration Multer
│   ├── controllers/
│   │   └── medecin.controller.ts   ✅ Upload avec req.file
│   ├── routes/
│   │   └── medecin.routes.ts       ✅ Route avec multer
│   └── server.ts                    ✅ Servir /uploads en static
└── uploads/                         📂 Dossier de stockage
```

### Frontend

```
frontend/
└── src/
    └── app/
        └── dashboard/
            ├── medecin/
            │   └── dse/
            │       └── [patientId]/
            │           └── page.tsx  ✅ Input file + FormData
            └── dse/
                └── page.tsx          ✅ Prescription enlevée
```

---

## 🔧 Modifications du Schéma

### Prisma Schema

```prisma
model Prescription {
  id              Int            @id @default(autoincrement())
  consultationId  Int            @unique
  consultation    Consultation   @relation(fields: [consultationId], references: [id])
  medications     Medication[]   ✅ Relation vers Medication
  issuedAt        DateTime       @default(now())
  nftTokenId      String?
  hashOnChain     String?
}

model Medication {
  id              Int            @id @default(autoincrement())
  prescriptionId  Int
  prescription    Prescription   @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  name            String         ✅ Nom du médicament
  dosage          String         ✅ Dosage
  duration        String         ✅ Durée
  frequency       String?        ✅ Fréquence (optionnel)
  instructions    String?        ✅ Instructions (optionnel)
  createdAt       DateTime       @default(now())
}
```

---

## ✅ Checklist de Test

### Côté Médecin
- [ ] Recherche patient fonctionne
- [ ] Accès DSE approuvé
- [ ] Formulaire de consultation complet
- [ ] Ajout de plusieurs médicaments avec tous les champs
- [ ] Upload de fichiers (images + PDF)
- [ ] Liste des fichiers uploadés visible
- [ ] Enregistrement réussi
- [ ] Consultation visible dans l'historique
- [ ] Ordonnance complète affichée dans la consultation
- [ ] Documents cliquables avec pop-up fonctionnel
- [ ] Visualisation d'images et PDF

### Côté Patient
- [ ] DSE accessible
- [ ] Consultation visible dans l'onglet Consultations
- [ ] **Pas de section "Prescription" dans les consultations**
- [ ] Menu "Mes Ordonnances" affiche l'ordonnance
- [ ] Tous les médicaments visibles avec détails complets
- [ ] Documents visibles dans l'onglet Documents
- [ ] Pop-up de visualisation fonctionne

---

## 🐛 Dépannage

### Erreur "Aucun fichier fourni"
- **Cause** : Le fichier n'est pas envoyé correctement
- **Solution** : Vérifier que `FormData` est utilisé et que `Content-Type` n'est **PAS** défini (il sera automatiquement en `multipart/form-data`)

### Fichiers non visibles
- **Cause** : Le dossier `uploads` n'est pas servi
- **Solution** : Vérifier `server.ts` ligne 28 : `app.use('/uploads', express.static(...))`

### Ordonnance vide côté médecin
- **Cause** : L'include ne récupère pas les medications
- **Solution** : Vérifier que `prescription: { include: { medications: true } }` est présent dans `getPatientDse`

### Erreur CORS pour les images
- **Cause** : Helmet bloque les images de localhost
- **Solution** : Vérifier `server.ts` ligne 20 : `imgSrc: [..., "http://localhost:3001"]`

---

## 🎉 Résumé

Vous avez maintenant :
1. ✅ Un système d'upload de fichiers **RÉEL** (pas de simples URLs)
2. ✅ Des ordonnances **COMPLÈTES** avec plusieurs médicaments et tous les détails
3. ✅ Un affichage **OPTIMISÉ** côté patient (sans duplication des prescriptions)
4. ✅ Une visualisation **IMMÉDIATE** des documents (pop-up pour images et PDF)

Le système est prêt pour une utilisation en production locale ! 🚀

