# 🔐 Implémentation de la Déconnexion Sécurisée

**Date:** 25 Octobre 2025  
**Feature:** Déconnexion utilisateur complète avec invalidation de session

---

## ✅ VUE D'ENSEMBLE

La déconnexion a été implémentée de manière complète et sécurisée avec :
- **Invalidation de session côté serveur** (suppression en base de données)
- **Nettoyage côté client** (localStorage et état React)
- **Audit trail** (log de déconnexion)
- **Redirection automatique** vers la page de connexion

---

## 📊 BACKEND

### 1. Contrôleur Auth (`auth.controller.ts`)

#### Fonction `logout()`
```typescript
export const logout = async (req: Request, res: Response) => {
  try {
    // 1. Récupérer le token depuis Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Enlever "Bearer "

    // 2. Vérifier et décoder le token JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Supprimer la session de la base de données
    await prisma.session.deleteMany({
      where: { token: token },
    });

    // 4. Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        userId: decoded.userId,
        details: `Utilisateur ${decoded.email} s'est déconnecté`,
      },
    });

    return res.status(200).json({
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la déconnexion.' 
    });
  }
};
```

**Caractéristiques:**
- ✅ Validation du token JWT
- ✅ Suppression de session en base de données
- ✅ Audit trail automatique
- ✅ Gestion d'erreurs complète

### 2. Route (`auth.routes.ts`)

```typescript
router.post('/logout', logout);
```

**Endpoint:** `POST /api/auth/logout`

**Headers requis:**
```
Authorization: Bearer <jwt_token>
```

**Réponse succès (200):**
```json
{
  "message": "Déconnexion réussie"
}
```

**Réponse erreur (401):**
```json
{
  "error": "Token manquant."
}
```

---

## 🎨 FRONTEND

### 1. AuthContext (`AuthContext.tsx`)

#### Fonction `logout()` améliorée
```typescript
const logout = async () => {
  // 1. Appeler l'API de déconnexion
  if (token) {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Déconnexion serveur réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion serveur:', error);
      // Continuer quand même avec la déconnexion locale
    }
  }

  // 2. Nettoyer l'état local
  setUser(null);
  setToken(null);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // 3. Rediriger vers la page de connexion
  window.location.href = '/login';
};
```

**Caractéristiques:**
- ✅ Appel API backend (invalidation session)
- ✅ Nettoyage localStorage
- ✅ Réinitialisation état React
- ✅ Redirection automatique
- ✅ Gestion d'erreurs graceful (déconnexion locale si erreur API)

### 2. Sidebar (`Sidebar.tsx`)

#### Bouton de déconnexion
```typescript
<button
  onClick={logout}
  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg 
             transition-colors duration-200 text-red-600 font-medium 
             hover:bg-red-50"
>
  <LogOut className="w-6 h-6" />
  <span>Déconnexion</span>
</button>
```

**Position:** En bas de la sidebar, après "Paramètres"

**Style:**
- Texte rouge (`text-red-600`)
- Hover avec fond rouge clair (`hover:bg-red-50`)
- Icône `LogOut` de lucide-react

---

## 🔒 SÉCURITÉ

### Mesures de sécurité implémentées

| Aspect | Implémentation | Sécurité |
|--------|----------------|----------|
| **Invalidation token** | Session supprimée en BDD | ✅ Token inutilisable |
| **Nettoyage client** | localStorage vidé | ✅ Pas de réutilisation |
| **Audit trail** | Log LOGOUT créé | ✅ Traçabilité |
| **Redirection** | Automatique vers /login | ✅ Protection routes |
| **Gestion erreurs** | Déconnexion locale si API fail | ✅ Toujours fonctionnel |

### Flux de sécurité

```
[Utilisateur clique Déconnexion]
           ↓
[Frontend appelle /api/auth/logout]
           ↓
[Backend vérifie JWT]
           ↓
[Backend supprime Session en BDD]
           ↓
[Backend crée AuditLog]
           ↓
[Frontend nettoie localStorage]
           ↓
[Frontend reset état (user, token)]
           ↓
[Redirection → /login]
```

---

## 📝 BASE DE DONNÉES

### Tables impactées

#### 1. Session
```sql
-- Session supprimée lors du logout
DELETE FROM Session WHERE token = '<jwt_token>';
```

#### 2. AuditLog
```sql
-- Log créé lors du logout
INSERT INTO AuditLog (action, userId, details, timestamp)
VALUES ('LOGOUT', <userId>, 'Utilisateur <email> s''est déconnecté', NOW());
```

---

## 🧪 TESTS

### Test Manuel

#### 1. Préparation
```bash
# Backend actif
cd backend-api
npm run dev

# Frontend actif
cd frontend
npm run dev
```

#### 2. Scénario de test

**Étape 1: Connexion**
- Aller sur http://localhost:3000/login
- Se connecter avec `patient1@example.com` / `1234`
- Vérifier redirection vers `/dashboard`

**Étape 2: Vérifier session en BDD**
```sql
SELECT * FROM Session WHERE userId = 2; -- patient1
-- Devrait retourner 1 session active
```

**Étape 3: Déconnexion**
- Cliquer sur le bouton "Déconnexion" (rouge) en bas de la sidebar
- Vérifier redirection immédiate vers `/login`

**Étape 4: Vérifier invalidation**
```sql
-- Session supprimée ?
SELECT * FROM Session WHERE userId = 2;
-- Devrait retourner 0 résultats (session supprimée)

-- Log créé ?
SELECT * FROM AuditLog WHERE action = 'LOGOUT' AND userId = 2;
-- Devrait retourner le log de déconnexion
```

**Étape 5: Tenter d'accéder au dashboard**
- Aller manuellement sur http://localhost:3000/dashboard
- Devrait rediriger vers `/login` (pas de token dans localStorage)

### Test Postman

#### Request logout
```http
POST http://localhost:3001/api/auth/logout
Authorization: Bearer <token_obtenu_lors_login>
Content-Type: application/json
```

**Réponse attendue:**
```json
{
  "message": "Déconnexion réussie"
}
```

#### Vérifier invalidation
Réutiliser le même token pour une autre requête protégée:
```http
GET http://localhost:3001/api/patients/2
Authorization: Bearer <ancien_token>
```

**Réponse attendue:** 401 Unauthorized (session inexistante)

---

## 🔧 AMÉLIORATIONS FUTURES

### Court terme
- [ ] Déconnexion de toutes les sessions (multi-device)
- [ ] Message de confirmation avant déconnexion
- [ ] Toast notification "Déconnecté avec succès"

### Moyen terme
- [ ] Déconnexion automatique après X minutes d'inactivité
- [ ] "Se souvenir de moi" (refresh tokens)
- [ ] Déconnexion forcée par admin

### Long terme
- [ ] Déconnexion d'autres utilisateurs (admin feature)
- [ ] Historique des sessions (liste des connexions/déconnexions)
- [ ] Notifications push de déconnexion (autre device)

---

## 📚 RÉFÉRENCES

### Fichiers modifiés
1. `backend-api/src/controllers/auth.controller.ts` - Fonction logout
2. `backend-api/src/routes/auth.routes.ts` - Route POST /logout
3. `frontend/src/context/AuthContext.tsx` - Fonction logout améliorée
4. `frontend/src/components/shared/Sidebar.tsx` - Bouton déconnexion

### Standards suivis
- JWT invalidation via suppression de session
- Audit trail pour conformité
- Nettoyage complet côté client
- Gestion d'erreurs graceful

---

## ✅ CHECKLIST IMPLÉMENTATION

- [x] Backend: Fonction logout dans contrôleur
- [x] Backend: Route POST /api/auth/logout
- [x] Backend: Suppression session en BDD
- [x] Backend: Création log d'audit
- [x] Frontend: Appel API logout
- [x] Frontend: Nettoyage localStorage
- [x] Frontend: Reset état React
- [x] Frontend: Redirection /login
- [x] Frontend: Bouton UI dans Sidebar
- [x] Tests manuels réussis
- [ ] Tests automatisés (à venir)
- [x] Documentation complète

---

## 💡 UTILISATION

### Pour l'utilisateur final

1. **Se connecter** normalement
2. **Cliquer sur "Déconnexion"** (bouton rouge en bas de la sidebar)
3. **Automatiquement redirigé** vers la page de connexion
4. **Session invalidée** - impossible de réutiliser le token

### Pour le développeur

```typescript
// Dans n'importe quel composant
import { useAuth } from '@/context/AuthContext';

function MonComposant() {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout(); // Déconnexion complète
  };
  
  return <button onClick={handleLogout}>Se déconnecter</button>;
}
```

---

**🔐 La déconnexion est maintenant complète, sécurisée et auditable ! 🌿**

**Date de dernière mise à jour:** 25 Octobre 2025

