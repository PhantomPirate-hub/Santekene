# 📋 Documentation des Contrôleurs Backend

## 🎯 Vue d'ensemble

Cette documentation présente tous les contrôleurs backend de l'application **Santé Kènè** avec leurs fonctionnalités complètes.

---

## 📂 Structure des Contrôleurs

### 1. **auth.controller.ts** ✅
**Authentification et gestion des sessions**

#### Fonctionnalités :
- ✅ `register` - Inscription d'un nouvel utilisateur
- ✅ `login` - Connexion avec JWT
- ✅ `logout` - Déconnexion et invalidation du token
- ✅ Création automatique des profils selon le rôle

#### Routes :
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

---

### 2. **patient.controller.ts** ✅
**Gestion des patients et de leur DSE**

#### Fonctionnalités :
- ✅ `getMyDSE` - DSE complet du patient connecté
- ✅ `getMyConsultations` - Consultations du patient
- ✅ `getMyDocuments` - Documents médicaux
- ✅ `getMyAppointments` - Rendez-vous
- ✅ `getMyKenePoints` - Points KènèPoints
- ✅ `getAllDoctors` - Liste des médecins disponibles
- ✅ `createAppointment` - Créer un rendez-vous
- ✅ `updateAppointment` - Modifier un rendez-vous (PENDING uniquement)
- ✅ `cancelAppointment` - Annuler un rendez-vous

#### Routes :
- `GET /api/patients/me/dse`
- `GET /api/patients/me/consultations`
- `GET /api/patients/me/documents`
- `GET /api/patients/me/appointments`
- `GET /api/patients/me/kenepoints`
- `GET /api/patients/doctors`
- `POST /api/patients/appointments`
- `PUT /api/patients/appointments/:id`
- `DELETE /api/patients/appointments/:id`

---

### 3. **doctor.controller.ts** ✅ **NOUVEAU**
**Gestion des médecins**

#### Fonctionnalités :
- ✅ `getMyProfile` - Profil du médecin connecté
- ✅ `updateMyProfile` - Mise à jour du profil (spécialité, licence)
- ✅ `getMyAppointments` - Rendez-vous du médecin (filtrage par statut/date)
- ✅ `acceptAppointment` - Accepter un rendez-vous (PENDING → CONFIRMED)
- ✅ `rejectAppointment` - Rejeter un rendez-vous avec motif
- ✅ `getMyConsultations` - Consultations du médecin
- ✅ `getMyStats` - Statistiques complètes du médecin

#### Routes :
- `GET /api/doctors/me/profile`
- `PUT /api/doctors/me/profile`
- `GET /api/doctors/me/appointments`
- `PUT /api/doctors/appointments/:id/accept`
- `PUT /api/doctors/appointments/:id/reject`
- `GET /api/doctors/me/consultations`
- `GET /api/doctors/me/stats`

---

### 4. **consultation.controller.ts** ✅ **NOUVEAU**
**Gestion des consultations médicales**

#### Fonctionnalités :
- ✅ `createConsultation` - Créer une consultation (Médecin uniquement)
  - Enregistrement complet des observations
  - Lien avec rendez-vous
  - Notification au patient
  - Audit logging
- ✅ `getConsultationById` - Récupérer une consultation (avec contrôle d'accès)
- ✅ `updateConsultation` - Modifier une consultation (Médecin uniquement)
- ✅ `deleteConsultation` - Supprimer une consultation (Admin uniquement)
- ✅ `getAllConsultations` - Liste complète (Admin uniquement, avec filtres)

#### Routes :
- `POST /api/consultations` (Médecin)
- `GET /api/consultations/:id` (Patient/Médecin/Admin)
- `PUT /api/consultations/:id` (Médecin)
- `DELETE /api/consultations/:id` (Admin/SuperAdmin)
- `GET /api/consultations` (Admin/SuperAdmin)

---

### 5. **prescription.controller.ts** ✅ **NOUVEAU**
**Gestion des prescriptions avec NFT Hedera**

#### Fonctionnalités :
- ✅ `createPrescription` - Créer une prescription (Médecin uniquement)
  - Création automatique de NFT sur Hedera (si configuré)
  - Enregistrement dans HederaTransaction
  - Notification au patient
  - Support multi-médicaments
- ✅ `getPrescriptionById` - Récupérer une prescription (avec contrôle d'accès)
- ✅ `updatePrescription` - Modifier une prescription (Médecin uniquement)
- ✅ `deletePrescription` - Supprimer une prescription (Admin uniquement)
- ✅ `getPatientPrescriptions` - Prescriptions d'un patient
- ✅ `verifyPrescriptionNFT` - Vérifier l'authenticité d'un NFT de prescription (Public)

#### Routes :
- `POST /api/prescriptions` (Médecin)
- `GET /api/prescriptions/:id` (Patient/Médecin/Admin)
- `PUT /api/prescriptions/:id` (Médecin)
- `DELETE /api/prescriptions/:id` (Admin/SuperAdmin)
- `GET /api/prescriptions/patient/:patientId` (Patient/Médecin/Admin)
- `GET /api/prescriptions/verify/:tokenId/:serialNumber` (Public)

---

### 6. **document.controller.ts** ✅ **NOUVEAU**
**Gestion des documents médicaux avec Hedera HFS**

#### Fonctionnalités :
- ✅ `uploadDocument` - Upload de document
  - Stockage sur Hedera File Service (si configuré)
  - Calcul du hash SHA-256 pour intégrité
  - Métadonnées complètes (nom, type, taille, MIME)
  - Notification au patient
- ✅ `getDocumentById` - Récupérer un document (avec contrôle d'accès)
- ✅ `getPatientDocuments` - Documents d'un patient (filtrage par type)
- ✅ `updateDocument` - Mettre à jour les métadonnées
- ✅ `deleteDocument` - Supprimer un document (Admin uniquement)
- ✅ `downloadDocument` - Télécharger un document depuis HFS
- ✅ `verifyDocumentIntegrity` - Vérifier l'intégrité d'un document (hash)

#### Routes :
- `POST /api/documents` (upload avec multer)
- `GET /api/documents/:id`
- `GET /api/documents/patient/:patientId`
- `GET /api/documents/:id/download`
- `POST /api/documents/:id/verify`
- `PUT /api/documents/:id` (Médecin/Admin/SuperAdmin)
- `DELETE /api/documents/:id` (Admin/SuperAdmin)

---

### 7. **notification.controller.ts** ✅ **NOUVEAU**
**Système de notifications**

#### Fonctionnalités :
- ✅ `getMyNotifications` - Notifications de l'utilisateur (filtrage)
- ✅ `markNotificationAsRead` - Marquer comme lue
- ✅ `markAllNotificationsAsRead` - Tout marquer comme lu
- ✅ `deleteNotification` - Supprimer une notification
- ✅ `getUnreadCount` - Nombre de notifications non lues
- ✅ `createNotification` - Créer une notification (Admin uniquement)
- ✅ `createBulkNotifications` - Notifications en masse (par rôle ou userIds)

#### Routes :
- `GET /api/notifications/me`
- `GET /api/notifications/me/unread-count`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `POST /api/notifications` (Admin/SuperAdmin)
- `POST /api/notifications/bulk` (Admin/SuperAdmin)

---

### 8. **admin.controller.ts** ✅ **NOUVEAU**
**Administration complète du système**

#### Fonctionnalités :
- ✅ **CRUD Utilisateurs**
  - `createUser` - Créer un utilisateur avec son profil
  - `updateUser` - Mettre à jour un utilisateur
  - `deleteUser` - Supprimer un utilisateur (avec protection)
  - `getAllUsers` - Liste avec pagination et recherche
- ✅ **Statistiques**
  - `getGlobalStats` - Dashboard admin complet
  - Statistiques par rôle
  - Activité récente
  - Tendances sur 6 mois
- ✅ **Audit**
  - `getAuditLogs` - Logs d'audit avec filtres et pagination
- ✅ **RGPD**
  - `exportUserData` - Exporter toutes les données d'un utilisateur
  - `anonymizeUser` - Droit à l'oubli (anonymisation complète)

#### Routes :
- `POST /api/admin/users`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/stats`
- `GET /api/admin/audit-logs`
- `GET /api/admin/users/:userId/export`
- `POST /api/admin/users/:userId/anonymize`

---

### 9. **elearning.controller.ts** ✅ **NOUVEAU**
**Plateforme e-learning avec certifications NFT**

#### Fonctionnalités :
- ✅ **Gestion des cours**
  - `getAllCourses` - Liste avec pagination et filtres
  - `getCourseById` - Détails d'un cours
  - `createCourse` - Créer un cours (Admin uniquement)
  - `updateCourse` - Modifier un cours (Admin uniquement)
  - `deleteCourse` - Supprimer un cours (Admin uniquement)
- ✅ **Inscriptions et progression**
  - `enrollInCourse` - S'inscrire à un cours
  - `getMyCourses` - Mes cours avec progression
  - `updateCourseProgress` - Mettre à jour la progression
  - Attribution automatique de KènèPoints à 100%
  - Création automatique de NFT de certification (si activé)
- ✅ **Certifications**
  - `getMyCertifications` - Mes certifications NFT
  - `verifyCertification` - Vérifier une certification (Public)

#### Routes :
- `GET /api/elearning/courses`
- `GET /api/elearning/courses/:id`
- `POST /api/elearning/courses` (Admin/SuperAdmin)
- `PUT /api/elearning/courses/:id` (Admin/SuperAdmin)
- `DELETE /api/elearning/courses/:id` (Admin/SuperAdmin)
- `POST /api/elearning/courses/:courseId/enroll`
- `GET /api/elearning/my-courses`
- `PUT /api/elearning/courses/:courseId/progress`
- `GET /api/elearning/my-certifications`
- `GET /api/elearning/certifications/verify/:tokenId/:serialNumber` (Public)

---

### 10. **hedera.controller.ts** ✅
**Intégration Hedera Hashgraph**

#### Fonctionnalités :
- ✅ `submitHcsMessage` - Soumettre un message à HCS (audit trail)
- ✅ `uploadFileToHFS` - Upload de fichier sur HFS
- ✅ `createKenePointsToken` - Créer le token HTS KènèPoints (Admin)

#### Routes :
- `POST /api/hedera/hcs/submit`
- `POST /api/hedera/hfs/upload`
- `POST /api/hedera/token/create` (Admin/SuperAdmin)

---

### 11. **healthcenter.controller.ts** ✅
**Carte des établissements de santé**

#### Fonctionnalités :
- ✅ `getAllHealthCenters` - Liste des centres de santé
  - Recherche par nom
  - Calcul de proximité (distance Haversine)
  - Tri par distance

#### Routes :
- `GET /api/healthcenters?search=&lat=&lon=&limit=`

---

## 🔐 Sécurité et Contrôle d'Accès

### Middlewares appliqués :
- ✅ `protect` - Authentification JWT requise
- ✅ `authorize(roles)` - Vérification du rôle
- ✅ `generalLimiter` - Rate limiting (100 req/15min par IP)
- ✅ CORS activé
- ✅ Helmet (sécurité des en-têtes HTTP)

### Contrôles d'accès dans les contrôleurs :
- ✅ Vérification propriétaire (patient/médecin)
- ✅ Hiérarchie des rôles (PATIENT < MEDECIN < ADMIN < SUPERADMIN)
- ✅ Audit logging sur toutes les actions sensibles

---

## 📊 Fonctionnalités Transversales

### 1. **Audit Logging**
Toutes les actions importantes sont enregistrées dans `AuditLog` :
- Création/modification/suppression d'entités
- Accès aux données sensibles
- Opérations Hedera (HCS, HFS, HTS)

### 2. **Notifications Automatiques**
Des notifications sont créées automatiquement pour :
- Nouvelle consultation
- Nouvelle prescription
- Rendez-vous confirmé/annulé
- Nouveau document
- Cours terminé

### 3. **Intégration Hedera (optionnelle)**
- **HCS** : Audit trail immuable
- **HFS** : Stockage décentralisé de documents
- **HTS** : Token KènèPoints
- **NFT** : Prescriptions et certifications

### 4. **RGPD**
- Export complet des données utilisateur
- Anonymisation (droit à l'oubli)
- Hash des documents pour intégrité

---

## 📈 Statistiques Disponibles

### Patient :
- Nombre de consultations, documents, rendez-vous
- KènèPoints totaux
- Prochains rendez-vous

### Médecin :
- Total/Pending/Confirmed/Completed appointments
- Consultations et prescriptions
- Patients uniques traités
- Prochains rendez-vous

### Admin :
- Statistiques globales (utilisateurs, consultations, etc.)
- Activité récente
- Tendances mensuelles
- Rendez-vous en attente

---

## 🎯 Points Forts

1. ✅ **Sécurité renforcée** : JWT, RBAC, rate limiting, hash des documents
2. ✅ **Blockchain ready** : Intégration Hedera optionnelle et non-bloquante
3. ✅ **RGPD compliant** : Export et anonymisation
4. ✅ **Traçabilité** : Audit logging complet
5. ✅ **Notifications temps réel** : Système de notifications intégré
6. ✅ **Gamification** : KènèPoints et certifications NFT
7. ✅ **E-learning** : Plateforme complète avec progression
8. ✅ **Contrôle d'accès fin** : Vérification à plusieurs niveaux

---

## 🚀 API Endpoints Résumé

| Catégorie | Endpoints | Authentification | Rôles |
|-----------|-----------|------------------|-------|
| **Auth** | 3 | Non (register/login), Oui (logout) | Tous |
| **Patients** | 9 | Oui | PATIENT |
| **Doctors** | 7 | Oui | MEDECIN |
| **Consultations** | 5 | Oui | MEDECIN, ADMIN |
| **Prescriptions** | 6 | Oui + 1 Public | MEDECIN, ADMIN |
| **Documents** | 7 | Oui | Tous (selon propriété) |
| **Notifications** | 7 | Oui | Tous + ADMIN |
| **Admin** | 8 | Oui | ADMIN, SUPERADMIN |
| **E-learning** | 10 | Oui + 1 Public | Tous + ADMIN |
| **Hedera** | 3 | Oui | Tous + ADMIN |
| **Health Centers** | 1 | Oui | Tous |

**Total : ~66 endpoints complets et fonctionnels** 🎉

---

## 📝 Notes Importantes

1. **Hedera est optionnel** : Si les clés ne sont pas configurées, les fonctionnalités continuent de fonctionner sans blockchain
2. **Multer configuré** : Upload de fichiers jusqu'à 10 MB
3. **Pagination** : Implémentée sur toutes les listes (users, courses, audit logs, etc.)
4. **Recherche** : Disponible sur users, courses, health centers
5. **Filtres** : Par date, statut, type, etc. selon les endpoints

---

**Date de création** : 2025-01-XX  
**Version** : 1.0  
**Auteur** : Claude AI pour Santé Kènè

