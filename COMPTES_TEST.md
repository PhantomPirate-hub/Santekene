# 🔐 Comptes de Test - Santé Kènè

**Date:** 25 Octobre 2025  
**Base de données:** santekene ✅ Créée et remplie

---

## 👤 Comptes Disponibles

Tous les comptes utilisent le mot de passe : **`1234`**

---

### 👨‍💼 Administrateur

**Email:** `lassinemale1@gmail.com`  
**Mot de passe:** `1234`  
**Rôle:** ADMIN

**Accès à :**
- Dashboard Admin complet
- Gestion des utilisateurs
- Monitoring système
- Création de tokens Hedera
- Statistiques globales

---

### 👨‍⚕️ Médecins

#### Dr. Diallo (Médecine Générale)
**Email:** `doctor1@example.com`  
**Mot de passe:** `1234`  
**Rôle:** MEDECIN  
**Spécialité:** Médecine Générale  
**Licence:** MG-ML-001

**Accès à :**
- Dashboard Médecin
- Liste des patients
- Agenda/Rendez-vous
- Consultations
- Prescriptions

---

#### Dr. Traoré (Pédiatrie)
**Email:** `doctor2@example.com`  
**Mot de passe:** `1234`  
**Rôle:** MEDECIN  
**Spécialité:** Pédiatrie  
**Licence:** PED-ML-002

**Accès à :**
- Dashboard Médecin
- Liste des patients
- Agenda/Rendez-vous
- Consultations pédiatriques
- Prescriptions

---

### 🏥 Patients

#### Patient One
**Email:** `patient1@example.com`  
**Mot de passe:** `1234`  
**Rôle:** PATIENT

**Profil :**
- Date de naissance : 20/08/1995
- Genre : Homme
- Groupe sanguin : O+
- Allergie : Pollen (Légère)

**Historique :**
- 1 consultation (Paludisme simple)
- 1 ordonnance (Artemether-Lumefantrine)
- 1 document médical
- 1 rendez-vous à venir
- 100 KènèPoints

---

#### Patient Two
**Email:** `patient2@example.com`  
**Mot de passe:** `1234`  
**Rôle:** PATIENT

**Profil :**
- Date de naissance : 12/03/1989
- Genre : Femme
- Groupe sanguin : A-
- Allergie : Arachides (Sévère)

**Historique :**
- 1 consultation (Allergie alimentaire)
- 1 ordonnance (Loratadine)
- 1 document médical
- 1 rendez-vous à venir
- 50 KènèPoints

---

#### Patient Three
**Email:** `patient3@example.com`  
**Mot de passe:** `1234`  
**Rôle:** PATIENT

**Profil :**
- Date de naissance : 05/11/2000
- Genre : Femme
- Groupe sanguin : B+
- Allergie : Antibiotique - Amoxicilline (Modérée)

**Historique :**
- 1 consultation (Toux persistante)
- 1 ordonnance (Sirop antitussif)
- 1 document médical
- 1 rendez-vous à venir
- 150 KènèPoints

---

## 📊 Données de Test Créées

### Statistiques globales
- **5 Utilisateurs** (1 Admin, 2 Médecins, 3 Patients)
- **3 Profils Patients** complets
- **2 Profils Médecins** complets
- **3 Allergies** enregistrées
- **3 Consultations** avec historique
- **3 Ordonnances** avec NFT simulés
- **3 Documents médicaux** (liens simulés)
- **3 Rendez-vous** à venir
- **3 Transactions KènèPoints**
- **3 Logs d'audit** blockchain

---

## 🧪 Scénarios de Test Recommandés

### Test 1 : Connexion Patient
1. Connectez-vous avec `patient1@example.com` / `1234`
2. Explorez le Dashboard Patient
3. Consultez votre DSE (Dossier Santé Électronique)
4. Vérifiez vos rendez-vous
5. Consultez vos KènèPoints

### Test 2 : Connexion Médecin
1. Connectez-vous avec `doctor1@example.com` / `1234`
2. Explorez le Dashboard Médecin
3. Consultez la liste des patients
4. Vérifiez l'agenda
5. Consultez les consultations passées

### Test 3 : Connexion Admin
1. Connectez-vous avec `lassinemale1@gmail.com` / `1234`
2. Explorez le Dashboard Admin
3. Consultez les statistiques globales
4. Vérifiez la gestion des utilisateurs
5. Consultez les logs d'audit

### Test 4 : Inscription Nouveau Patient
1. Allez sur http://localhost:3000/register
2. Créez un nouveau compte avec vos propres données
3. Explorez le dashboard vide (sans historique)

---

## 🔐 Sécurité

- ✅ Tous les mots de passe sont hashés avec bcrypt
- ✅ JWT pour l'authentification
- ✅ Rate limiting actif
- ✅ CORS configuré
- ⚠️ **Comptes de test uniquement** - Ne pas utiliser en production !

---

## 📝 Notes

### Données Simulées
- Les **NFT Token IDs** sont simulés (format: HTS-NFT-XXXX)
- Les **transactions blockchain** sont simulées (format: HCS-TX-XXXX)
- Les **URLs de documents** pointent vers des liens fictifs

### Réinitialisation
Pour réinitialiser la base de données :
```bash
cd backend-api
npx prisma migrate reset
npm run seed
```

---

## 🧪 Tests API avec Postman/Thunder Client

### Inscription
**POST** `http://localhost:3001/api/auth/register`
```json
{
  "name": "Nouveau Patient",
  "email": "nouveau@example.com",
  "password": "password123",
  "role": "PATIENT"
}
```

### Connexion
**POST** `http://localhost:3001/api/auth/login`
```json
{
  "email": "patient1@example.com",
  "password": "1234"
}
```

### Récupérer un Patient (avec token JWT)
**GET** `http://localhost:3001/api/patients/1`
```
Headers:
Authorization: Bearer <votre_token_jwt>
```

---

## 🎯 Prochaines Étapes

1. ✅ **Connectez-vous** avec un des comptes ci-dessus
2. ✅ **Explorez** les différents dashboards selon le rôle
3. ✅ **Testez** les fonctionnalités disponibles
4. 🔄 **Créez** de nouvelles consultations, rendez-vous, etc.
5. 🧪 **Testez** l'API avec Postman/Thunder Client

---

**Bon test ! 🌿**

Pour toute question, consultez `STATUS.md` ou `GUIDE_DEMARRAGE.md`.

