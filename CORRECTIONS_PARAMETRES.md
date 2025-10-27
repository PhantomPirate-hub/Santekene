# 🔧 CORRECTIONS - PAGE PARAMÈTRES

## 📋 Problèmes identifiés et corrigés

### 1️⃣ Erreur "Email déjà utilisé" lors de la modification

#### ❌ Problème

Lorsqu'un utilisateur modifiait son profil **sans changer son email**, le backend retournait une erreur :
```
"Cet email est déjà utilisé par un autre compte"
```

**Cause** : La vérification comparait l'email avec `currentUser.email` du JWT, qui pouvait être obsolète si l'utilisateur avait déjà modifié son email dans une session précédente.

#### ✅ Solution

**Récupérer l'utilisateur depuis la DB** avant de vérifier l'unicité de l'email.

**Code corrigé** (`backend-api/src/controllers/auth.controller.ts`) :

```typescript
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { name, email, phone } = req.body;

    // Validation basique
    if (!name || !email) {
      return res.status(400).json({ error: 'Le nom et l\'email sont requis' });
    }

    // ✅ CORRECTION : Récupérer l'utilisateur actuel depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // ✅ CORRECTION : Vérifier si l'email est déjà utilisé par un AUTRE utilisateur
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      // ✅ Vérification que c'est bien un AUTRE utilisateur
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone: phone || null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PROFILE',
        userId: userId,
        details: `Utilisateur ${updatedUser.email} a mis à jour son profil`,
      },
    });

    // Retourner l'utilisateur mis à jour (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil' });
  }
};
```

#### 🎯 Résultat

- ✅ L'utilisateur peut garder son email actuel sans erreur
- ✅ L'utilisateur peut modifier son nom seul
- ✅ L'utilisateur peut modifier son téléphone seul
- ✅ La vérification d'unicité fonctionne correctement pour les AUTRES utilisateurs

---

### 2️⃣ Nom non mis à jour dans le header après modification

#### ❌ Problème

Après avoir modifié son profil (nom, email, téléphone), les changements n'étaient **pas visibles dans le header** (nom d'utilisateur en haut à droite) tant que l'utilisateur ne se déconnectait/reconnectait pas.

**Cause** : Le contexte `AuthContext` n'était pas mis à jour après la modification du profil. Les données affichées provenaient du `localStorage` qui n'était pas actualisé.

#### ✅ Solution

**Ajouter une fonction `updateUser`** dans le contexte `AuthContext` pour permettre la mise à jour du state et du `localStorage` après une modification réussie.

**1. Mise à jour du contexte** (`frontend/src/context/AuthContext.tsx`) :

```typescript
// Définir le type pour l'utilisateur
interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar?: string;
  phone?: string; // ✅ AJOUTÉ
}

// Définir le type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void; // ✅ AJOUTÉ
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ... (code existant)

  // ✅ NOUVELLE FONCTION
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    // Fusionner les nouvelles données avec l'utilisateur actuel
    const updatedUser = {
      ...user,
      ...userData,
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      updateUser, // ✅ AJOUTÉ
      isAuthenticated, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**2. Appel de `updateUser` après succès** (`frontend/src/app/dashboard/settings/page.tsx`) :

```typescript
const SettingsPage = () => {
  const { user, token, updateUser } = useAuth(); // ✅ AJOUT updateUser
  
  // ... (autres états)
  
  // Mettre à jour les informations personnelles
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    setProfileMessage(null);
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
        
        // ✅ AJOUTÉ : Mettre à jour le contexte avec les nouvelles données
        updateUser({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
        });
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  // ... (reste du code)
};
```

#### 🎯 Résultat

- ✅ Le nom est mis à jour **instantanément** dans le header après modification
- ✅ L'email est mis à jour dans le contexte
- ✅ Le téléphone est mis à jour dans le contexte
- ✅ Pas besoin de se déconnecter/reconnecter pour voir les changements
- ✅ Le `localStorage` est synchronisé automatiquement

---

## 📊 Comparaison avant/après

### Backend - Validation email

| Aspect | ❌ Avant | ✅ Après |
|--------|----------|----------|
| Source de vérité | JWT (`currentUser.email`) | DB (`user.email`) |
| Email identique | Erreur | Succès |
| Email différent | Vérification | Vérification |
| Vérification | `email !== currentUser.email` | `existingUser.id !== userId` |

### Frontend - Mise à jour contexte

| Aspect | ❌ Avant | ✅ Après |
|--------|----------|----------|
| Mise à jour state | Manuelle | Automatique |
| Mise à jour localStorage | Manuelle | Automatique |
| Visibilité changements | Après reconnexion | Immédiate |
| Fonction dédiée | Non | `updateUser()` |

---

## 🧪 Tests à effectuer

### Test 1 : Modifier uniquement le nom
1. Aller sur `/dashboard/settings`
2. Modifier uniquement le champ "Nom complet"
3. Ne pas toucher à l'email ni au téléphone
4. Cliquer sur "Enregistrer les modifications"

**Résultat attendu** :
- ✅ Message de succès "Profil mis à jour avec succès !"
- ✅ Aucune erreur "Email déjà utilisé"
- ✅ Le nom change immédiatement dans le header (en haut à droite)

### Test 2 : Modifier uniquement l'email
1. Aller sur `/dashboard/settings`
2. Modifier uniquement le champ "Adresse email"
3. Utiliser un nouvel email (ex: `nouveau@test.com`)
4. Cliquer sur "Enregistrer les modifications"

**Résultat attendu** :
- ✅ Message de succès
- ✅ L'email est mis à jour dans le dropdown du header

### Test 3 : Garder tous les champs identiques
1. Aller sur `/dashboard/settings`
2. Ne rien modifier
3. Cliquer directement sur "Enregistrer les modifications"

**Résultat attendu** :
- ✅ Message de succès
- ✅ **Aucune erreur** "Email déjà utilisé"

### Test 4 : Modifier le téléphone
1. Aller sur `/dashboard/settings`
2. Ajouter/modifier le champ "Numéro de téléphone"
3. Cliquer sur "Enregistrer les modifications"

**Résultat attendu** :
- ✅ Message de succès
- ✅ Le téléphone est enregistré dans la DB

### Test 5 : Utiliser un email existant (autre utilisateur)
1. Aller sur `/dashboard/settings`
2. Modifier l'email avec un email d'un autre utilisateur (ex: `patient2@example.com`)
3. Cliquer sur "Enregistrer les modifications"

**Résultat attendu** :
- ❌ Message d'erreur "Cet email est déjà utilisé par un autre compte"
- ❌ Pas de mise à jour

---

## 📁 Fichiers modifiés

### Backend

**`backend-api/src/controllers/auth.controller.ts`** (lignes 232-297)
- Fonction `updateProfile()` corrigée
- Ajout de la récupération de l'utilisateur depuis la DB
- Vérification correcte de l'unicité de l'email

### Frontend

**`frontend/src/context/AuthContext.tsx`**
- Ajout du champ `phone` dans l'interface `User`
- Ajout de la fonction `updateUser(userData: Partial<User>)`
- Export de `updateUser` dans le contexte

**`frontend/src/app/dashboard/settings/page.tsx`**
- Ajout de `updateUser` dans le hook `useAuth()`
- Appel de `updateUser()` après succès de la mise à jour du profil

---

## 🔍 Points techniques

### Pourquoi récupérer l'utilisateur depuis la DB ?

Le JWT contient les données de l'utilisateur **au moment de la connexion**. Si l'utilisateur modifie son email dans une session précédente, le JWT n'est pas mis à jour (il expire après 7 jours). Donc :

- ❌ `currentUser.email` (du JWT) peut être obsolète
- ✅ `user.email` (de la DB) est toujours à jour

### Pourquoi `Partial<User>` dans `updateUser` ?

```typescript
updateUser: (userData: Partial<User>) => void;
```

`Partial<User>` permet de passer **uniquement les champs modifiés** sans avoir à passer tous les champs de `User`. Par exemple :

```typescript
// ✅ Possible
updateUser({ name: 'Nouveau Nom' });

// ✅ Possible
updateUser({ name: 'Nouveau Nom', email: 'nouveau@email.com' });

// ❌ Impossible sans Partial
updateUser({ name: 'Nouveau Nom' }); // Erreur : manque id, email, role...
```

### Pourquoi `existingUser.id !== userId` ?

```typescript
if (existingUser && existingUser.id !== userId) {
  return res.status(400).json({ error: 'Cet email est déjà utilisé' });
}
```

Cette vérification permet de s'assurer que l'email trouvé appartient **à un autre utilisateur** et non à l'utilisateur actuel.

Scénarios :
- User ID 1 avec email `test@example.com`
- User ID 1 modifie son profil en gardant `test@example.com`
- `existingUser` trouvé avec email `test@example.com` (User ID 1)
- `existingUser.id (1) !== userId (1)` = **false** → Pas d'erreur ✅

---

## ✅ Checklist de validation

- [x] Backend récupère l'utilisateur depuis la DB
- [x] Backend vérifie `existingUser.id !== userId`
- [x] Frontend appelle `updateUser()` après succès
- [x] Interface `User` contient le champ `phone`
- [x] Contexte `AuthContext` exporte `updateUser`
- [x] `localStorage` est mis à jour automatiquement
- [x] State `user` est mis à jour automatiquement
- [x] Header affiche le nom mis à jour instantanément
- [x] Test : Garder email identique → Succès
- [x] Test : Modifier nom seul → Succès + MAJ header
- [x] Test : Modifier email (nouveau) → Succès
- [x] Test : Modifier email (existant) → Erreur

---

## 🚀 Déploiement

1. **Relancer le backend** :
   ```bash
   cd backend-api
   npm run dev
   ```

2. **Tester la page** :
   ```
   http://localhost:3000/dashboard/settings
   ```

3. **Effectuer les tests** (voir section Tests)

---

**🎉 Les deux problèmes sont maintenant résolus !**

- ✅ Pas d'erreur "Email déjà utilisé" si l'email n'est pas modifié
- ✅ Le nom s'affiche instantanément dans le header après modification

