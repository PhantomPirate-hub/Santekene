# 💊 ORDONNANCES MÉDICALES - BASE DE DONNÉES

## ✅ **STATUT**

**18 ordonnances** créées dans la base de données par des médecins réels.

---

## 📊 **RÉPARTITION PAR PATIENT**

### **Patient 1** - Aminata Diallo (`patient1@example.com`)

**6 ordonnances** au total

#### Ordonnance type :
- **Médicament** : Artemether-Lumefantrine + Paracétamol
- **Dosage** : 2 comprimés 2x/jour + 1g si fièvre
- **Durée** : 3 jours
- **Diagnostic** : Paludisme simple
- **Médecin** : Dr. Diallo (Médecine Générale)
- **Date** : 25-26 octobre 2025

---

### **Patient 2** - Mamadou Sow (`patient2@example.com`)

**6 ordonnances** au total

#### Ordonnance type :
- **Médicament** : Loratadine (antihistaminique)
- **Dosage** : 10mg 1x/jour
- **Durée** : 5 jours
- **Diagnostic** : Réaction allergique alimentaire / Allergie saisonnière
- **Médecin** : Dr. Diallo (Médecine Générale)
- **Date** : 25-26 octobre 2025

---

### **Patient 3** - Fatou Kane (`patient3@example.com`)

**6 ordonnances** au total

#### Ordonnance type :
- **Médicament** : Sirop antitussif Carbocistéine
- **Dosage** : 10ml 3x/jour
- **Durée** : 7 jours
- **Diagnostic** : Toux persistante - Bronchite légère
- **Médecin** : Dr. Traoré (Pédiatrie)
- **Date** : 25-26 octobre 2025

---

## 👨‍⚕️ **MÉDECINS PRESCRIPTEURS**

### Dr. Abdoulaye Diallo
- **Spécialité** : Médecine Générale
- **Email** : doctor1@example.com
- **Ordonnances** : 12 (Patients 1 et 2)

### Dr. Fatoumata Traoré
- **Spécialité** : Pédiatrie
- **Email** : doctor2@example.com
- **Ordonnances** : 6 (Patient 3)

---

## 🔗 **STRUCTURE DES DONNÉES**

### Relations dans la base de données :

```
Patient → Consultation → Prescription
   ↓           ↓              ↓
  User      Doctor      Médicaments
```

Chaque ordonnance est :
- ✅ Liée à une **consultation** réelle
- ✅ Prescrite par un **médecin** spécifique
- ✅ Associée à un **patient** spécifique
- ✅ Contient un **diagnostic** médical
- ✅ Inclut des **notes** de consultation

---

## 📋 **EXEMPLE D'ORDONNANCE COMPLÈTE**

### Ordonnance #1 - Patient Aminata Diallo

```json
{
  "id": "1",
  "date": "2025-10-25",
  "patient": {
    "name": "Patient One",
    "email": "patient1@example.com"
  },
  "doctor": {
    "name": "Dr. Diallo",
    "specialty": "Médecine Générale"
  },
  "diagnosis": "Paludisme simple",
  "medications": [
    {
      "name": "Artemether-Lumefantrine + Paracétamol",
      "dosage": "2 comprimés 2x/jour + 1g si fièvre",
      "frequency": "2 fois par jour",
      "duration": "3 jours",
      "instructions": "Suivre les instructions du médecin"
    }
  ],
  "notes": "Ordonnance émise le 25/10/2025",
  "status": "ACTIVE",
  "nftTokenId": "HTS-NFT-...",
  "hashOnChain": "HASH-0x..."
}
```

---

## 🔐 **SÉCURITÉ BLOCKCHAIN**

Chaque ordonnance contient :
- **NFT Token ID** : Identifiant unique Hedera HTS
- **Hash on Chain** : Empreinte cryptographique pour vérification
- **Blockchain Tx ID** : ID de transaction HCS pour audit

---

## 🧪 **COMMENT VOIR VOS ORDONNANCES**

### Étape 1 : Se connecter

```
Email: patient1@example.com
Mot de passe: password123
```

### Étape 2 : Accéder au menu

- Cliquez sur **"Mes Ordonnances"** 💊 dans le menu latéral

### Étape 3 : Consulter les détails

- **Liste** : Voir toutes vos ordonnances
- **Recherche** : Rechercher par médecin, diagnostic ou médicament
- **Détails** : Cliquer sur "Voir" pour voir les détails complets
- **Actions** : Imprimer ou télécharger en PDF

---

## 🔧 **SCRIPT DE CRÉATION**

Le script `backend-api/prisma/create-prescriptions.ts` permet de :
- Créer des consultations réalistes
- Générer des ordonnances liées à ces consultations
- Associer des médecins et patients existants
- Vérifier l'existence avant création (pas de doublons)

**Commande** :
```bash
cd backend-api
npx tsx prisma/create-prescriptions.ts
```

---

## 🐛 **RÉSOLUTION DE PROBLÈMES**

### Problème : "Aucune ordonnance"

**Causes possibles** :
1. Token JWT expiré → **Solution** : Déconnexion + Reconnexion
2. Mauvais compte patient → **Solution** : Vérifier l'email de connexion
3. Ordonnances non créées → **Solution** : Exécuter le script de création

### Problème : "Non authentifié"

**Cause** : Token JWT expiré

**Solution** :
1. Cliquez sur votre nom en haut à droite
2. Cliquez sur "Déconnexion"
3. Reconnectez-vous avec les mêmes identifiants
4. Un nouveau token sera généré

### Problème : "Erreur serveur"

**Cause** : Backend API non démarré ou problème de connexion

**Solution** :
1. Vérifier que le backend API tourne sur le port 3001
2. Redémarrer le backend : `cd backend-api && npm run dev`

---

## 📊 **STATISTIQUES**

| Métrique | Valeur |
|----------|--------|
| **Total ordonnances** | 18 |
| **Patients avec ordonnances** | 3 |
| **Médecins prescripteurs** | 2 |
| **Ordonnances par patient** | 6 |
| **Période** | 25-26 octobre 2025 |

---

## 🔜 **FONCTIONNALITÉS À VENIR**

### Court terme
- [ ] Téléchargement PDF réel des ordonnances
- [ ] QR Code pour vérification pharmacie
- [ ] Rappels de prise de médicaments

### Moyen terme
- [ ] Renouvellement d'ordonnance en ligne
- [ ] Historique des médicaments pris
- [ ] Interactions médicamenteuses

### Long terme
- [ ] Intégration pharmacies partenaires
- [ ] Livraison de médicaments à domicile
- [ ] Suivi d'observance thérapeutique

---

## 📞 **SUPPORT**

### Problème technique
- Vérifiez les logs backend (terminal où tourne l'API)
- Vérifiez les logs frontend (F12 → Console)
- Relancez le script de création si nécessaire

### Besoin d'aide
- Documentation : `ROUTES_API_REFERENCE.md`
- Correction d'erreurs : `CORRECTION_URL_API.md`
- Scripts disponibles : `backend-api/prisma/`

---

**📅 Dernière mise à jour** : 26 octobre 2025
**💊 Statut** : Opérationnel - 18 ordonnances disponibles

