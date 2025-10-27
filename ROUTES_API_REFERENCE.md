# 📚 RÉFÉRENCE DES ROUTES API - Santé Kènè

## 🎯 **BASE URL**

```
http://localhost:3001/api
```

---

## 🔐 **AUTHENTIFICATION**

### `POST /api/auth/register`
- **Description** : Inscription d'un nouvel utilisateur
- **Body** : `{ name, email, password, role }`
- **Auth** : Non requis
- **Réponse** : `{ user, token }`

### `POST /api/auth/login`
- **Description** : Connexion utilisateur
- **Body** : `{ email, password }`
- **Auth** : Non requis
- **Réponse** : `{ user, token }`

### `POST /api/auth/logout`
- **Description** : Déconnexion utilisateur
- **Auth** : ✅ Requis (Bearer token)
- **Réponse** : `{ message }`

---

## 👤 **PATIENTS** (`/api/patients`)

### Routes personnelles (patient connecté)

#### `GET /api/patients/me/dse`
- **Description** : Récupérer le DSE complet du patient connecté
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : DSE complet avec consultations, allergies, documents, etc.

#### `GET /api/patients/me/consultations`
- **Description** : Récupérer les consultations du patient
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ consultations: [...] }`

#### `GET /api/patients/me/documents`
- **Description** : Récupérer les documents du patient
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ documents: [...] }`

#### `GET /api/patients/me/appointments`
- **Description** : Récupérer les rendez-vous du patient
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ appointments: [...] }`

#### `GET /api/patients/me/kenepoints`
- **Description** : Récupérer les KènèPoints du patient
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ totalPoints, history: [...], leaderboard: [...] }`

#### `GET /api/patients/prescriptions`
- **Description** : Récupérer les ordonnances du patient connecté
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ prescriptions: [...], total }`

### Gestion des rendez-vous

#### `GET /api/patients/doctors`
- **Description** : Liste de tous les médecins disponibles
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ doctors: [...] }`

#### `POST /api/patients/appointments`
- **Description** : Créer un rendez-vous
- **Body** : `{ doctorId, date, type, reason, notes }`
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ message, appointment }`

#### `PUT /api/patients/appointments/:id`
- **Description** : Modifier un rendez-vous
- **Body** : `{ doctorId?, date?, type?, reason?, notes? }`
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ message, appointment }`

#### `DELETE /api/patients/appointments/:id`
- **Description** : Annuler un rendez-vous
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ message }`

### Accès spécifique (médecins/admin)

#### `GET /api/patients/:id`
- **Description** : Récupérer un patient spécifique
- **Auth** : ✅ Requis (MEDECIN/ADMIN)
- **Réponse** : Patient avec toutes ses données

---

## 👨‍⚕️ **MÉDECINS** (`/api/doctors`)

#### `GET /api/doctors/:id`
- **Description** : Récupérer un médecin spécifique
- **Auth** : ✅ Requis
- **Réponse** : Médecin avec ses consultations

#### `GET /api/doctors/me/consultations`
- **Description** : Consultations du médecin connecté
- **Auth** : ✅ Requis (MEDECIN)
- **Réponse** : `{ consultations: [...] }`

#### `GET /api/doctors/me/appointments`
- **Description** : Rendez-vous du médecin connecté
- **Auth** : ✅ Requis (MEDECIN)
- **Réponse** : `{ appointments: [...] }`

#### `PUT /api/doctors/appointments/:id/accept`
- **Description** : Accepter un rendez-vous
- **Auth** : ✅ Requis (MEDECIN)
- **Réponse** : `{ message, appointment }`

#### `PUT /api/doctors/appointments/:id/reject`
- **Description** : Rejeter un rendez-vous
- **Auth** : ✅ Requis (MEDECIN)
- **Réponse** : `{ message, appointment }`

---

## 🩺 **CONSULTATIONS** (`/api/consultations`)

#### `POST /api/consultations`
- **Description** : Créer une consultation
- **Body** : `{ patientId, date, diagnosis, notes }`
- **Auth** : ✅ Requis (MEDECIN)
- **Réponse** : `{ message, consultation }`

#### `GET /api/consultations/:id`
- **Description** : Détails d'une consultation
- **Auth** : ✅ Requis
- **Réponse** : Consultation complète

#### `PUT /api/consultations/:id`
- **Description** : Modifier une consultation
- **Auth** : ✅ Requis (MEDECIN)
- **Réponse** : `{ message, consultation }`

---

## 💊 **ORDONNANCES** (`/api/prescriptions`)

#### `POST /api/prescriptions`
- **Description** : Créer une ordonnance pour une consultation
- **Body** : `{ consultationId, medication, dosage, duration }`
- **Auth** : ✅ Requis (MEDECIN)
- **Réponse** : `{ message, prescription }`

#### `GET /api/prescriptions/:id`
- **Description** : Détails d'une ordonnance
- **Auth** : ✅ Requis
- **Réponse** : Ordonnance complète

---

## 📄 **DOCUMENTS** (`/api/documents`)

#### `POST /api/documents`
- **Description** : Uploader un document médical
- **Body** : FormData avec fichier
- **Auth** : ✅ Requis
- **Réponse** : `{ message, document }`

#### `GET /api/documents/:id`
- **Description** : Télécharger un document
- **Auth** : ✅ Requis
- **Réponse** : Fichier

---

## 🏆 **KÈNEPOINTS** (`/api/kenepoints`)

#### `POST /api/kenepoints/earn`
- **Description** : Gagner des points
- **Body** : `{ patientId, points, reason }`
- **Auth** : ✅ Requis
- **Réponse** : `{ message, newTotal }`

#### `POST /api/kenepoints/redeem`
- **Description** : Utiliser des points
- **Body** : `{ rewardId }`
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ message, newTotal }`

#### `GET /api/kenepoints/rewards`
- **Description** : Liste des récompenses disponibles
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ rewards: [...] }`

#### `GET /api/kenepoints/leaderboard`
- **Description** : Classement des patients
- **Auth** : ✅ Requis (PATIENT)
- **Réponse** : `{ leaderboard: [...] }`

---

## 👥 **COMMUNAUTÉ** (`/api/community`)

### Posts

#### `GET /api/community/posts`
- **Description** : Liste des posts (avec pagination et filtres)
- **Query** : `?category=X&search=Y&page=1&limit=10`
- **Auth** : ✅ Requis
- **Réponse** : `{ posts: [...], total, page, totalPages }`

#### `POST /api/community/posts`
- **Description** : Créer un post
- **Body** : `{ title, content, category }`
- **Auth** : ✅ Requis
- **Réponse** : `{ message, post }`

#### `PUT /api/community/posts/:id`
- **Description** : Modifier un post
- **Body** : `{ title?, content?, category? }`
- **Auth** : ✅ Requis (Auteur ou Admin)
- **Réponse** : `{ message, post }`

#### `DELETE /api/community/posts/:id`
- **Description** : Supprimer un post
- **Auth** : ✅ Requis (Auteur ou Admin)
- **Réponse** : `{ message }`

#### `GET /api/community/my-posts`
- **Description** : Posts de l'utilisateur connecté
- **Auth** : ✅ Requis
- **Réponse** : `{ posts: [...] }`

### Likes

#### `POST /api/community/posts/:id/like`
- **Description** : Liker/Unliker un post
- **Auth** : ✅ Requis
- **Réponse** : `{ liked, likesCount }`

### Commentaires

#### `POST /api/community/posts/:id/comments`
- **Description** : Ajouter un commentaire
- **Body** : `{ content }`
- **Auth** : ✅ Requis
- **Réponse** : `{ message, comment }`

#### `GET /api/community/posts/:id/comments`
- **Description** : Récupérer les commentaires d'un post
- **Auth** : ✅ Requis
- **Réponse** : `{ comments: [...] }`

#### `DELETE /api/community/comments/:id`
- **Description** : Supprimer un commentaire
- **Auth** : ✅ Requis (Auteur ou Admin)
- **Réponse** : `{ message }`

### Catégories

#### `GET /api/community/categories`
- **Description** : Liste des catégories de posts
- **Auth** : ✅ Requis
- **Réponse** : `{ categories: [...] }`

---

## 🗺️ **CENTRES DE SANTÉ** (`/api/healthcenters`)

#### `GET /api/healthcenters`
- **Description** : Liste des centres de santé
- **Query** : `?lat=X&lon=Y` (optionnel pour tri par distance)
- **Auth** : ✅ Requis
- **Réponse** : `{ healthCenters: [...] }`

#### `GET /api/healthcenters/search`
- **Description** : Rechercher un centre de santé
- **Query** : `?query=nom&lat=X&lon=Y`
- **Auth** : ✅ Requis
- **Réponse** : `{ results: [...] }`

---

## 🤖 **IA** (`/api/ai`)

#### `GET /api/ai/recommended-doctors`
- **Description** : Médecins recommandés selon spécialités
- **Query** : `?specialties=Cardiologie,Dermatologie`
- **Auth** : ✅ Requis
- **Réponse** : `{ doctors: [...] }`

#### `GET /api/ai/recommended-healthcenters`
- **Description** : Centres de santé proches
- **Query** : `?latitude=X&longitude=Y`
- **Auth** : ✅ Requis
- **Réponse** : `{ healthCenters: [...] }`

---

## 🔔 **NOTIFICATIONS** (`/api/notifications`)

#### `GET /api/notifications`
- **Description** : Notifications de l'utilisateur
- **Auth** : ✅ Requis
- **Réponse** : `{ notifications: [...], unreadCount }`

#### `PUT /api/notifications/:id/read`
- **Description** : Marquer comme lue
- **Auth** : ✅ Requis
- **Réponse** : `{ message }`

#### `PUT /api/notifications/read-all`
- **Description** : Marquer toutes comme lues
- **Auth** : ✅ Requis
- **Réponse** : `{ message }`

---

## 👔 **ADMIN** (`/api/admin`)

#### `GET /api/admin/stats`
- **Description** : Statistiques globales
- **Auth** : ✅ Requis (ADMIN/SUPERADMIN)
- **Réponse** : `{ users, patients, doctors, consultations, ... }`

#### `GET /api/admin/users`
- **Description** : Liste des utilisateurs
- **Auth** : ✅ Requis (ADMIN/SUPERADMIN)
- **Réponse** : `{ users: [...] }`

#### `PUT /api/admin/users/:id`
- **Description** : Modifier un utilisateur
- **Auth** : ✅ Requis (ADMIN/SUPERADMIN)
- **Réponse** : `{ message, user }`

#### `DELETE /api/admin/users/:id`
- **Description** : Supprimer un utilisateur
- **Auth** : ✅ Requis (SUPERADMIN)
- **Réponse** : `{ message }`

---

## 📊 **E-LEARNING** (`/api/elearning`)

#### `GET /api/elearning/courses`
- **Description** : Liste des cours
- **Auth** : ✅ Requis
- **Réponse** : `{ courses: [...] }`

#### `POST /api/elearning/courses/:id/enroll`
- **Description** : S'inscrire à un cours
- **Auth** : ✅ Requis
- **Réponse** : `{ message, enrollment }`

#### `GET /api/elearning/my-courses`
- **Description** : Cours de l'utilisateur
- **Auth** : ✅ Requis
- **Réponse** : `{ courses: [...] }`

---

## 🎓 **NFT CERTIFICATIONS** (Inclus dans E-Learning)

#### `POST /api/elearning/certifications/mint`
- **Description** : Créer un NFT de certification
- **Body** : `{ courseId }`
- **Auth** : ✅ Requis
- **Réponse** : `{ message, nft, tokenId }`

---

## 🔐 **AUTHENTIFICATION DES REQUÊTES**

### Headers requis pour routes protégées

```javascript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
  'Content-Type': 'application/json'
}
```

### Format de réponse d'erreur

```json
{
  "error": "Message d'erreur"
}
```

### Codes de statut HTTP

- `200` : Succès
- `201` : Créé
- `400` : Mauvaise requête
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Non trouvé
- `500` : Erreur serveur

---

## 💡 **CONVENTION DE NOMMAGE**

- **Préfixes de routes** : TOUJOURS au pluriel (`/patients`, `/doctors`, `/appointments`)
- **IDs** : Toujours en paramètre de route (`/:id`)
- **Filtres/Recherche** : En query string (`?category=X&search=Y`)
- **Actions spécifiques** : En suffixe (`/accept`, `/reject`, `/read`)

---

**📅 Dernière mise à jour** : 26 octobre 2025
**📝 Document de référence** : À consulter avant tout appel API

