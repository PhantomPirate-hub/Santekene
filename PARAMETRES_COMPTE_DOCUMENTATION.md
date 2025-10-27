# 📋 DOCUMENTATION - PARAMÈTRES DU COMPTE

## ✅ Vue d'ensemble

Une page complète de paramètres permettant à l'utilisateur de gérer ses informations personnelles et son mot de passe.

**Accès** : `/dashboard/settings`

---

## 🔗 Navigation

La page est accessible depuis **deux endroits** :

### 1. Header (Dropdown utilisateur)
- Cliquer sur le nom d'utilisateur en haut à droite
- Sélectionner "Paramètres" dans le menu déroulant

### 2. Sidebar (Menu principal)
- Menu "Paramètres" en bas du sidebar
- Icône : ⚙️ Settings

**✅ Les deux liens pointent vers `/dashboard/settings`**

---

## 🎯 Fonctionnalités

### 1. 📝 Modification des informations personnelles

**Champs modifiables** :
- **Nom complet** (obligatoire)
- **Adresse email** (obligatoire, unique)
- **Numéro de téléphone** (optionnel)

**Validation** :
- ✅ Email unique (vérifié côté backend)
- ✅ Champs requis
- ✅ Feedback immédiat (succès/erreur)

**API** : `PUT /api/auth/update-profile`

```typescript
// Exemple de requête
fetch('http://localhost:3001/api/auth/update-profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    name: 'Nouveau Nom',
    email: 'nouveau@email.com',
    phone: '+221 XX XXX XX XX',
  }),
})
```

**Réponse succès** :
```json
{
  "message": "Profil mis à jour avec succès",
  "user": {
    "id": 1,
    "name": "Nouveau Nom",
    "email": "nouveau@email.com",
    "phone": "+221 XX XXX XX XX",
    "role": "PATIENT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 🔒 Modification du mot de passe

**Champs** :
- **Mot de passe actuel** (obligatoire)
- **Nouveau mot de passe** (obligatoire, min 6 caractères)
- **Confirmation** (obligatoire)

**Sécurité** :
- ✅ Vérification de l'ancien mot de passe
- ✅ Validation de la longueur (min 6 caractères)
- ✅ Vérification de la correspondance des mots de passe
- ✅ Hashing bcrypt (backend)
- ✅ Toggle visibilité des mots de passe (👁️)

**API** : `PUT /api/auth/update-password`

```typescript
// Exemple de requête
fetch('http://localhost:3001/api/auth/update-password', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    currentPassword: 'ancien_mdp',
    newPassword: 'nouveau_mdp',
  }),
})
```

**Réponse succès** :
```json
{
  "message": "Mot de passe modifié avec succès"
}
```

**Erreur** :
```json
{
  "error": "Mot de passe actuel incorrect"
}
```

---

## 🛠️ Backend

### Contrôleurs (`auth.controller.ts`)

#### `updateProfile`

```typescript
export const updateProfile = async (req: Request, res: Response) => {
  // 1. Récupérer l'utilisateur connecté via JWT
  const userId = (req as any).user?.id;
  
  // 2. Validation des données
  const { name, email, phone } = req.body;
  
  // 3. Vérifier si l'email est déjà utilisé
  if (email !== currentUser.email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }
  }
  
  // 4. Mettre à jour dans la DB
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name, email, phone },
  });
  
  // 5. Audit log
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE_PROFILE',
      userId,
      details: `Utilisateur ${updatedUser.email} a mis à jour son profil`,
    },
  });
  
  // 6. Retourner le résultat
  return res.status(200).json({ message: 'Profil mis à jour', user });
};
```

#### `updatePassword`

```typescript
export const updatePassword = async (req: Request, res: Response) => {
  // 1. Récupérer l'utilisateur connecté
  const userId = (req as any).user?.id;
  
  // 2. Validation
  const { currentPassword, newPassword } = req.body;
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Minimum 6 caractères' });
  }
  
  // 3. Vérifier l'ancien mot de passe
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }
  
  // 4. Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // 5. Mettre à jour dans la DB
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  
  // 6. Audit log
  await prisma.auditLog.create({
    data: {
      action: 'UPDATE_PASSWORD',
      userId,
      details: `Utilisateur a modifié son mot de passe`,
    },
  });
  
  // 7. Retourner le résultat
  return res.status(200).json({ message: 'Mot de passe modifié' });
};
```

---

### Routes (`auth.routes.ts`)

```typescript
import { updateProfile, updatePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

router.put('/update-profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);
```

**🔐 Routes protégées** : Authentification JWT requise

---

## 🎨 Frontend

### Structure du fichier

**Fichier** : `frontend/src/app/dashboard/settings/page.tsx`

**Composants utilisés** :
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button`
- `Input`
- `Label`

**Icônes** :
- `User` (infos personnelles)
- `Lock` (mot de passe)
- `Save` (bouton enregistrer)
- `Eye` / `EyeOff` (toggle visibilité)
- `CheckCircle2` / `AlertCircle` (feedback)

---

### États du composant

```typescript
// Informations personnelles
const [profileData, setProfileData] = useState({
  name: '',
  email: '',
  phone: '',
});

// Mot de passe
const [passwordData, setPasswordData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Visibilité des mots de passe
const [showPasswords, setShowPasswords] = useState({
  current: false,
  new: false,
  confirm: false,
});

// Loading et messages
const [isLoadingProfile, setIsLoadingProfile] = useState(false);
const [isLoadingPassword, setIsLoadingPassword] = useState(false);
const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
```

---

### Validation frontend

#### Profil
- ✅ Nom et email requis
- ✅ Format email valide (HTML5)

#### Mot de passe
- ✅ Tous les champs requis
- ✅ Nouveau mot de passe ≥ 6 caractères
- ✅ Confirmation = nouveau mot de passe

---

## 🔒 Sécurité

### Backend

1. **Authentification JWT** :
   ```typescript
   router.put('/update-profile', protect, updateProfile);
   ```
   - Middleware `protect` vérifie le token
   - Seul l'utilisateur connecté peut modifier son profil

2. **Hashing bcrypt** :
   ```typescript
   const hashedPassword = await bcrypt.hash(newPassword, 10);
   ```
   - Mot de passe jamais stocké en clair
   - Salt rounds = 10

3. **Validation email unique** :
   ```typescript
   const existingUser = await prisma.user.findUnique({ where: { email } });
   if (existingUser) {
     return res.status(400).json({ error: 'Email déjà utilisé' });
   }
   ```

4. **Vérification ancien mot de passe** :
   ```typescript
   const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
   if (!isPasswordValid) {
     return res.status(401).json({ error: 'Mot de passe incorrect' });
   }
   ```

5. **Audit logs** :
   - Chaque modification est enregistrée
   - Action + userId + timestamp + détails

### Frontend

1. **Validation frontend** :
   - Empêche les requêtes inutiles
   - Feedback immédiat

2. **Messages d'erreur clairs** :
   - "Mot de passe actuel incorrect"
   - "Les mots de passe ne correspondent pas"
   - "Minimum 6 caractères"

3. **Loading states** :
   - Désactivation des boutons pendant l'envoi
   - Spinner de chargement

---

## 🎨 Design

### Palette de couleurs

- **Fond** : Dégradé `from-green-50 via-blue-50 to-purple-50`
- **Infos personnelles** : Card avec header `from-green-50 to-blue-50`
- **Mot de passe** : Card avec header `from-purple-50 to-blue-50`
- **Boutons** :
  - Profil : `bg-green-600 hover:bg-green-700`
  - Mot de passe : `bg-purple-600 hover:bg-purple-700`

### Feedback visuel

**Succès** :
```typescript
<div className="bg-green-50 border border-green-200">
  <CheckCircle2 className="text-green-600" />
  <p className="text-green-800">Profil mis à jour avec succès !</p>
</div>
```

**Erreur** :
```typescript
<div className="bg-red-50 border border-red-200">
  <AlertCircle className="text-red-600" />
  <p className="text-red-800">{errorMessage}</p>
</div>
```

---

## 📊 Tests

### Scénarios à tester

#### Profil
1. ✅ Modification du nom uniquement
2. ✅ Modification de l'email (nouveau email)
3. ✅ Modification de l'email (email existant → erreur)
4. ✅ Ajout/suppression du téléphone
5. ✅ Champs vides → erreur

#### Mot de passe
1. ✅ Modification avec ancien mot de passe correct
2. ✅ Ancien mot de passe incorrect → erreur
3. ✅ Nouveau mot de passe < 6 caractères → erreur
4. ✅ Mots de passe ne correspondent pas → erreur
5. ✅ Formulaire réinitialisé après succès

#### Sécurité
1. ✅ Requête sans token → 401
2. ✅ Token invalide → 401
3. ✅ Audit log créé après chaque modification

---

## ❌ Fonctionnalités supprimées

Comme demandé par l'utilisateur :

### 1. MFA (Authentification à 2 facteurs)
- ❌ Page `/dashboard/settings/security`
- ❌ Composant `SecuritySettings.tsx`

### 2. Notifications
- ❌ Page `/dashboard/settings/notifications`
- ❌ Composant `NotificationSettings.tsx`

### 3. Autres composants
- ❌ `ProfileSettings.tsx` (remplacé par la nouvelle page)
- ❌ `SettingsLayout.tsx` (structure simplifiée)

---

## 🚀 Démarrage rapide

### 1. Accéder à la page

```
http://localhost:3000/dashboard/settings
```

### 2. Modifier son profil

1. Cliquer sur le nom d'utilisateur en haut à droite
2. Sélectionner "Paramètres"
3. Modifier les champs souhaités
4. Cliquer sur "Enregistrer les modifications"

### 3. Modifier son mot de passe

1. Aller dans la section "Sécurité du compte"
2. Entrer l'ancien mot de passe
3. Entrer le nouveau mot de passe (2 fois)
4. Cliquer sur "Modifier le mot de passe"

---

## 🐛 Dépannage

### Erreur : "Non authentifié"
- **Cause** : Token JWT manquant ou expiré
- **Solution** : Se déconnecter et se reconnecter

### Erreur : "Email déjà utilisé"
- **Cause** : Un autre compte utilise cet email
- **Solution** : Utiliser un autre email

### Erreur : "Mot de passe actuel incorrect"
- **Cause** : Mauvais ancien mot de passe
- **Solution** : Vérifier et réessayer

### Erreur serveur
- **Cause** : Backend non démarré
- **Solution** : 
  ```bash
  cd backend-api
  npm run dev
  ```

---

## 📝 Conseils de sécurité

Un encadré d'information est affiché en bas de la page :

🔒 **Conseils de sécurité** :
- Utilisez un mot de passe unique et complexe
- Ne partagez jamais votre mot de passe
- Changez votre mot de passe régulièrement
- Déconnectez-vous après chaque session sur un appareil public

---

## ✅ Checklist de fonctionnalités

- [x] Modification du nom
- [x] Modification de l'email
- [x] Modification du téléphone
- [x] Modification du mot de passe
- [x] Validation frontend
- [x] Validation backend
- [x] Sécurité JWT
- [x] Hashing bcrypt
- [x] Email unique
- [x] Vérification ancien mot de passe
- [x] Audit logs
- [x] Messages de feedback
- [x] Loading states
- [x] Toggle visibilité mots de passe
- [x] Responsive design
- [x] Suppression MFA
- [x] Suppression notifications

---

**🎉 La page de paramètres est complète et fonctionnelle !**

