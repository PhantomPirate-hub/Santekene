# 🧪 Test : Upload de Consultation avec Documents

## ✅ Corrections Appliquées

### 1. Ordonnances côté patient
**Problème** : Seul le premier médicament s'affichait  
**Solution** : Ajout de `include: { medications: true }` dans le contrôleur `getPatientPrescriptions`

```typescript
prescription: {
  include: {
    medications: true, // ✅ CORRECTION
  },
},
```

### 2. Documents dans les consultations côté médecin
**Problème** : Section documents affichée dans chaque consultation  
**Solution** : Suppression de la section documents (déjà visible dans l'onglet Documents)

### 3. Visualisation des documents
**Vérification** : Le modal de visualisation existe côté patient et médecin avec support :
- 🖼️ Images (JPG, PNG, GIF, WebP)
- 📄 PDF (avec iframe)
- 📎 Autres fichiers (lien de téléchargement)

---

## 🚀 Test Complet

### Étape 1 : Redémarrer le Backend

```powershell
cd backend-api
# Ctrl+C si déjà lancé
npm run dev
```

**Attendez** : `Server running on port 3001`

---

### Étape 2 : Test Upload de Fichier (Médecin)

1. **Connexion Médecin**
   - http://localhost:3000/login
   - Email : `doctor1@example.com`
   - Mot de passe : `password123`

2. **Rechercher un Patient**
   - Menu : "Consultations"
   - Téléphone : `73963323` (M. Aboubacar BANE)
   - Vérifier : "Accès Approuvé"
   - Cliquer : "Consulter le DSE et créer une consultation"

3. **Créer une Consultation Complète**
   - Cliquer : "Nouvelle Consultation" (bouton vert)
   
   **Notes de consultation** :
   ```
   Patient présente de la fièvre depuis 48h
   Température: 38.7°C
   Toux sèche persistante
   Pas d'essoufflement
   ```
   
   **Diagnostic** :
   ```
   Infection virale respiratoire
   ```
   
   **Allergies** (optionnel) :
   ```
   Aucune
   ```

4. **Ajouter des Médicaments**

   **Médicament 1** :
   - Nom : `Paracétamol`
   - Dosage : `1000mg`
   - Durée : `5 jours`
   - Fréquence : `3 fois par jour`
   - Instructions : `Prendre après les repas`
   - ➕ Ajouter ce médicament

   **Médicament 2** :
   - Nom : `Amoxicilline`
   - Dosage : `500mg`
   - Durée : `7 jours`
   - Fréquence : `2 fois par jour`
   - Instructions : `Matin et soir`
   - ➕ Ajouter ce médicament

   **Médicament 3** :
   - Nom : `Ibuprofène`
   - Dosage : `200mg`
   - Durée : `3 jours`
   - Fréquence : `Si douleur`
   - Instructions : `Max 3 fois par jour`
   - ➕ Ajouter ce médicament

5. **Uploader des Documents**

   **Préparer les métadonnées** :
   - Type de document : `Radiographie thoracique`
   - Titre : (laisser vide pour utiliser le nom du fichier)

   **Sélectionner des fichiers** :
   - Cliquer sur la zone de drop
   - Sélectionner une ou plusieurs images (JPG/PNG) ou PDF
   - Les fichiers apparaissent dans la liste

6. **Enregistrer**
   - Cliquer : "Enregistrer la consultation" (vert)
   - Attendre le toast : "Consultation enregistrée avec succès !"
   - La page se recharge

---

### Étape 3 : Vérifier Côté Médecin

1. **Onglet "Consultations"**
   - La nouvelle consultation est en haut
   - ✅ **Vérifier l'ordonnance** :
     - Section "Ordonnance" avec icône 💊
     - **LES 3 MÉDICAMENTS** sont visibles
     - Chaque médicament affiche :
       - Nom (gras)
       - 💊 Dosage • ⏱️ Durée
       - 📅 Fréquence (si renseignée)
       - Instructions en italique (si renseignées)
   - ✅ **PAS de section "Documents"** (enlevée)

2. **Onglet "Documents"**
   - Les documents uploadés sont visibles
   - Cliquer sur un document
   - **Pop-up s'ouvre** :
     - Image : affichage direct
     - PDF : iframe avec le PDF
     - Bouton "Fermer" et "Ouvrir dans un nouvel onglet"

---

### Étape 4 : Vérifier Côté Patient

1. **Déconnexion & Connexion Patient**
   - Déconnexion du médecin
   - Connexion : `patient1@example.com` / `password123`

2. **Menu "Mon DSE" → Onglet "Consultations"**
   - La consultation est visible
   - ✅ Date, médecin, diagnostic, notes visibles
   - ✅ **PAS de section "Prescription"** (enlevée)

3. **Menu "Mes Ordonnances"**
   - L'ordonnance est visible
   - Cliquer sur "Voir" (bouton bleu avec œil)
   - **Section "Médicaments prescrits (3)"** :
     - ✅ **LES 3 MÉDICAMENTS** sont visibles
     - Chaque médicament affiche :
       - Nom en vert avec icône 💊
       - Dosage (ex: 1000mg)
       - Fréquence (ex: 3 fois par jour)
       - Durée (ex: 5 jours)
       - Instructions en gris italique (si présentes)

4. **Menu "Mon DSE" → Onglet "Documents"**
   - Les documents uploadés sont visibles
   - **Cliquer sur un document**
   - **Pop-up s'ouvre** avec visualisation :
     - 🖼️ Image : affichage direct
     - 📄 PDF : iframe
     - Bouton "X" pour fermer

---

## 🐛 Dépannage

### Problème 1 : "Seul le premier médicament s'affiche"
**Cause** : Le backend ne récupère pas les medications  
**Solution** : ✅ Corrigé dans `patient.controller.ts`

### Problème 2 : "L'image ne s'affiche pas"
**Causes possibles** :
1. Le fichier n'existe pas dans `backend-api/uploads/`
2. Le serveur backend n'est pas redémarré
3. L'URL est incorrecte

**Vérification** :
```powershell
# Vérifier que le dossier uploads existe
cd backend-api
dir uploads

# Si le fichier est là, tester l'URL directement
# Ouvrir dans le navigateur : http://localhost:3001/uploads/[nom-du-fichier]
```

### Problème 3 : "Ça cherche sur le web"
**Cause** : L'URL du document est externe (pas un fichier uploadé)  
**Solution** : Uploader un VRAI fichier via le formulaire (pas une URL externe)

### Problème 4 : "Erreur 404 sur /uploads/..."
**Cause** : Le serveur ne sert pas les fichiers statiques  
**Solution** : Vérifier `backend-api/src/server.ts` ligne 28 :
```typescript
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
```

---

## ✅ Checklist Finale

### Côté Médecin
- [ ] Consultation créée avec succès
- [ ] **Ordonnance affiche LES 3 MÉDICAMENTS** avec tous les détails
- [ ] **PAS de section "Documents" dans les consultations**
- [ ] Documents visibles dans l'onglet "Documents"
- [ ] Pop-up de visualisation fonctionne (image/PDF)

### Côté Patient
- [ ] Consultation visible dans "Mon DSE"
- [ ] **PAS de section "Prescription" dans les consultations**
- [ ] Menu "Mes Ordonnances" accessible
- [ ] **LES 3 MÉDICAMENTS** visibles avec tous les détails
- [ ] Documents visibles dans "Mon DSE" → "Documents"
- [ ] Pop-up de visualisation fonctionne

---

## 📊 Résumé des Corrections

| Problème | Statut | Fichier Modifié |
|----------|--------|----------------|
| Seul 1 médicament affiché (patient) | ✅ Corrigé | `patient.controller.ts` |
| Section documents dans consultations (médecin) | ✅ Enlevée | `medecin/dse/[patientId]/page.tsx` |
| Prescription dans consultations (patient) | ✅ Déjà enlevée | `dse/page.tsx` |
| Visualisation documents | ✅ Déjà fonctionnel | Modal existant |

---

**🎉 Tout est prêt ! Redémarrez le backend et testez !**

