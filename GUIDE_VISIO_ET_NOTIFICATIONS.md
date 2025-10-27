# 📹 Guide - Visioconférence & Notifications Toast

## ✅ Ce qui a été fait

### 1. ❌ Suppression des alerts JavaScript

Tous les `alert()` classiques ont été remplacés par des **notifications toast modernes** avec `react-hot-toast`.

#### Avant :
```javascript
alert('Rendez-vous créé avec succès !');
alert('Erreur lors de la création');
```

#### Après :
```javascript
toast.success('Rendez-vous créé avec succès !');
toast.error('Erreur lors de la création');
```

---

### 2. 🎨 Notifications Toast

**Librairie installée** : `react-hot-toast`

**Caractéristiques** :
- ✅ Position : En haut à droite
- ✅ Durée : 4 secondes
- ✅ Design moderne avec ombres
- ✅ Icônes colorées (vert pour succès, rouge pour erreur)
- ✅ Animations fluides
- ✅ Empilables (plusieurs notifications en même temps)

**Notifications ajoutées** :
- ✅ Création de RDV réussie
- ❌ Erreur de création de RDV
- ✅ Modification de RDV réussie
- ❌ Erreur de modification de RDV
- ✅ Annulation de RDV réussie
- ❌ Erreur d'annulation de RDV
- ⚠️ Validation des formulaires (champs manquants)
- 🎥 Lien de visio généré

---

### 3. 📹 Interface de Visioconférence

#### A. Badge Visuel

**Où** : Sur chaque carte de rendez-vous

**Affichage** : Si `isVideo = true`, un badge bleu "Visio" avec icône 📹 s'affiche à côté du type de consultation.

```tsx
{appointment.isVideo && (
  <Badge className="bg-blue-500 text-white">
    <Video className="w-3 h-3" />
    Visio
  </Badge>
)}
```

---

#### B. Section Visioconférence Détaillée

**Où** : Dans chaque carte de RDV en visio

**Design** : 
- Fond dégradé bleu-violet
- Bordure bleue
- Icône vidéo
- Informations contextuelles

**États affichés** :

| Statut RDV | Message | Bouton |
|------------|---------|--------|
| `PENDING` | "En attente d'acceptation du médecin" | ❌ Aucun |
| `CONFIRMED` (sans lien) | "En attente de validation du médecin" | ✅ "Test Visio" |
| `CONFIRMED` (avec lien) | "Le lien de visio sera disponible ici" | ✅ "Rejoindre" |
| `CANCELLED` | "Consultation en visio demandée" | ❌ Aucun |

---

#### C. Système de Visioconférence (Jitsi Meet)

**Solution choisie** : **Jitsi Meet** (gratuit, open-source, aucune inscription requise)

**Pourquoi Jitsi ?**
- ✅ 100% gratuit
- ✅ Aucun compte requis
- ✅ Fonctionne dans le navigateur (pas d'installation)
- ✅ Chiffrement de bout en bout
- ✅ Partage d'écran
- ✅ Chat intégré
- ✅ Enregistrement possible

**Comment ça marche** :

1. **Génération du lien** :
   - Format : `https://meet.jit.si/santekene-rdv-{appointmentId}`
   - Exemple : `https://meet.jit.si/santekene-rdv-5`
   - Unique pour chaque RDV

2. **Bouton "Test Visio"** :
   - Disponible quand le RDV est confirmé
   - Génère et ouvre le lien Jitsi
   - Affiche une notification : "Lien de visio généré !"
   - Le patient peut partager ce lien au médecin

3. **Bouton "Rejoindre"** :
   - Si le médecin a fourni un `videoLink` personnalisé
   - Ouvre directement le lien en nouvel onglet

---

## 🧪 Comment tester la Visioconférence

### Étape 1 : Créer un RDV en visio

1. Aller sur `/dashboard/patient/appointments`
2. Cliquer sur **"Nouveau Rendez-vous"**
3. Remplir tous les champs
4. ✅ **Cocher "Consultation en visioconférence"**
5. Cliquer sur "Enregistrer"
6. ✅ Une notification toast s'affiche : "Rendez-vous créé avec succès !"

---

### Étape 2 : Identifier les RDV en visio

**Sur la carte de RDV**, vous verrez :
- Un badge bleu **"Visio"** 📹
- Une section dédiée avec fond dégradé bleu-violet

---

### Étape 3 : Tester la visio

#### Option A : Test depuis le frontend (patient)

**Si le RDV est confirmé** :

1. **Localiser le RDV en visio**
   - Cherchez la carte avec le badge "Visio"

2. **Cliquer sur "Test Visio"**
   - Ouvre Jitsi Meet dans un nouvel onglet
   - Lien : `https://meet.jit.si/santekene-rdv-{id}`

3. **Premier accès Jitsi** :
   - Autoriser caméra + micro (popup navigateur)
   - Entrer votre nom (ex: "Patient - Jean Dupont")
   - Cliquer sur "Rejoindre la réunion"

4. **Interface Jitsi** :
   - Vidéo en temps réel
   - Contrôles : Caméra, Micro, Partage d'écran
   - Chat texte
   - Bouton "Raccrocher"

5. **Test avec 2 personnes** :
   - Ouvrez le même lien dans un autre navigateur/appareil
   - Simulez le médecin
   - Vous devriez vous voir tous les deux

---

#### Option B : Modifier le statut du RDV (backend)

**Pour tester avec un RDV confirmé** :

1. **Ouvrir Prisma Studio** :
```bash
cd backend-api
npx prisma studio
```

2. **Naviguer vers la table `Appointment`**

3. **Trouver le RDV en visio** :
   - Filtrer par `isVideo = true`

4. **Modifier le statut** :
   - Changer `status` de `PENDING` à `CONFIRMED`
   - Sauvegarder

5. **Rafraîchir la page frontend** :
   - Le bouton "Test Visio" devrait apparaître

---

#### Option C : Ajouter un lien Jitsi manuellement

1. **Ouvrir Prisma Studio** :
```bash
cd backend-api
npx prisma studio
```

2. **Aller dans la table `Appointment`**

3. **Sélectionner un RDV en visio** :
   - `isVideo = true`
   - `status = CONFIRMED`

4. **Remplir le champ `videoLink`** :
   - Exemple : `https://meet.jit.si/santekene-test-123`
   - Sauvegarder

5. **Rafraîchir la page frontend** :
   - Le bouton devient **"Rejoindre"**
   - Cliquer dessus ouvre le lien personnalisé

---

## 🎥 Test Complet de Visioconférence

### Scénario : Consultation patient-médecin

#### 1. Créer le RDV (Patient)

```
1. Patient crée un RDV en visio ✅
2. RDV = PENDING
3. Badge "Visio" visible
4. Message : "En attente d'acceptation du médecin"
```

#### 2. Accepter le RDV (Médecin - futur)

```
1. Médecin voit la demande
2. Médecin accepte
3. RDV = CONFIRMED
4. (Optionnel) Médecin génère un lien Jitsi
```

#### 3. Tester la visio (Patient)

```
1. Patient rafraîchit la page
2. Bouton "Test Visio" apparaît
3. Patient clique → Ouvre Jitsi
4. Patient rejoint la salle
```

#### 4. Rejoindre la visio (Médecin)

```
1. Médecin a le lien : https://meet.jit.si/santekene-rdv-5
2. Médecin ouvre le lien
3. Médecin rejoint la salle
4. Patient et médecin se voient 🎉
```

---

## 🛠️ Alternatives à Jitsi Meet

Si vous voulez changer de système de visio plus tard :

### Option 1 : Zoom API

**Avantages** :
- Plus stable
- Enregistrements cloud
- Fonctionnalités avancées

**Inconvénients** :
- Payant (après 40 min gratuit)
- Requiert API Zoom

**Implémentation** :
- Intégrer Zoom SDK
- Générer des liens de réunion via API
- Stocker dans `videoLink`

---

### Option 2 : Google Meet

**Avantages** :
- Intégré à Google Workspace
- Stable et familier

**Inconvénients** :
- Requiert compte Google
- Configuration OAuth complexe

**Implémentation** :
- Google Calendar API
- Générer des événements avec Meet
- Récupérer le lien

---

### Option 3 : WebRTC Custom

**Avantages** :
- 100% personnalisé
- Contrôle total
- Hébergement propre

**Inconvénients** :
- Très complexe à développer
- Requiert serveur de signalisation
- Maintenance lourde

**Implémentation** :
- Utiliser PeerJS ou Socket.io
- Créer un serveur TURN/STUN
- Développer l'interface complète

---

## 📊 Résumé des fichiers modifiés

### Frontend

**`frontend/src/app/dashboard/patient/appointments/page.tsx`** :
- ✅ Import de `react-hot-toast`
- ✅ Import de l'icône `Video` de lucide-react
- ✅ Ajout de l'interface `isVideo` et `videoLink`
- ✅ Remplacement de 8 `alert()` par `toast.success()` et `toast.error()`
- ✅ Ajout du badge "Visio" sur les cartes de RDV
- ✅ Ajout de la section détaillée visioconférence
- ✅ Boutons "Test Visio" et "Rejoindre"
- ✅ Composant `<Toaster />` configuré
- ✅ Logique de génération de liens Jitsi

---

## 🎯 Prochaines étapes (Côté Médecin)

Pour compléter le système de visio, il faudra :

1. **Dashboard Médecin** :
   - Voir les demandes de RDV en visio
   - Accepter/Refuser les RDV
   - Générer des liens de visio (optionnel)

2. **Notifications** :
   - Alerter le médecin d'une nouvelle demande
   - Notifier le patient quand le médecin accepte

3. **Calendrier médecin** :
   - Afficher les RDV en visio différemment
   - Bouton "Démarrer la visio" au bon moment

4. **Gestion des liens** :
   - Auto-générer des liens Jitsi côté backend
   - Stocker dans `videoLink`
   - Envoyer par email/notification

---

## 🔧 Commandes de test

### Lancer l'application

```bash
# Terminal 1 - Backend API
cd backend-api
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Backend IA (si nécessaire)
cd backend-ai
python main.py
```

### Vérifier la DB

```bash
cd backend-api
npx prisma studio
```

### Créer un RDV de test en visio

1. Se connecter comme patient (`patient1@example.com` / `password123`)
2. Aller sur "Mes Rendez-vous"
3. Créer un RDV et cocher "Visio"
4. Dans Prisma Studio, changer `status` en `CONFIRMED`
5. Rafraîchir la page → Cliquer sur "Test Visio"

---

## 📞 Test de Visio - Checklist

### Avant de tester

- [ ] Backend démarré (`npm run dev`)
- [ ] Frontend démarré (`npm run dev`)
- [ ] Navigateur autorise caméra/micro
- [ ] Au moins 1 RDV en visio créé
- [ ] RDV confirmé (status = CONFIRMED)

### Pendant le test

- [ ] Badge "Visio" visible sur le RDV
- [ ] Section visio affichée (fond bleu-violet)
- [ ] Bouton "Test Visio" cliquable
- [ ] Clic ouvre nouvel onglet Jitsi
- [ ] Caméra et micro fonctionnent
- [ ] Notification toast affichée

### Test à 2 personnes

- [ ] Ouvrir le même lien dans 2 navigateurs
- [ ] Les deux participants se voient
- [ ] Audio fonctionne des deux côtés
- [ ] Partage d'écran possible
- [ ] Chat texte fonctionne

---

## 🎨 Aperçu du Design

### Toast de succès
```
┌─────────────────────────────────┐
│ ✅ Rendez-vous créé avec succès ! │
└─────────────────────────────────┘
```

### Toast d'erreur
```
┌──────────────────────────────────────┐
│ ❌ Erreur lors de la création du RDV  │
└──────────────────────────────────────┘
```

### Badge Visio
```
┌──────────────────────┐
│ Consultation générale │ 📹 Visio │
└──────────────────────┘
```

### Section Visioconférence
```
┌─────────────────────────────────────────────────────┐
│ 📹 Consultation en visioconférence                   │
│                                                      │
│ En attente de validation du médecin                 │
│                                          [Test Visio]│
└─────────────────────────────────────────────────────┘
```

---

## 💡 Conseils

### Pour tester seul
- Utilisez le mode "Incognito" dans un 2e onglet
- Simulez le patient dans un navigateur, le médecin dans l'autre

### Pour tester la qualité
- Testez avec une vraie connexion internet (pas localhost seulement)
- Essayez le partage d'écran
- Testez le chat texte
- Désactivez/réactivez caméra/micro

### Pour déboguer
- Ouvrir la console navigateur (F12)
- Vérifier les logs Jitsi
- Vérifier les autorisations navigateur (caméra/micro)

---

## 🚀 Prêt pour la production

Pour déployer en production :

1. **Remplacer les liens Jitsi de test** :
   - Utiliser votre propre serveur Jitsi (optionnel)
   - Ou continuer avec `meet.jit.si` (gratuit)

2. **Sécuriser les salles** :
   - Ajouter des mots de passe aux salles
   - Générer des tokens JWT pour Jitsi
   - Limiter l'accès aux participants autorisés

3. **Conformité RGPD** :
   - Informer les utilisateurs de l'utilisation de Jitsi
   - Ajouter une politique de confidentialité
   - Enregistrements uniquement avec consentement

---

**🎉 Tout est prêt pour tester la visioconférence ! 🎥**

