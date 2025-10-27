# 🪙 Guide de Création du Token KenePoint (KNP)

## 📋 Qu'est-ce que KenePoint ?

**KenePoint (KNP)** est le token de récompense de l'application Santé Kènè, permettant de:
- ✅ Récompenser les utilisateurs pour leurs actions bénéfiques
- ✅ Encourager l'engagement avec la plateforme
- ✅ Créer une économie communautaire
- ✅ Tracer les contributions de manière transparente

---

## 🎯 Caractéristiques du Token

| Propriété | Valeur |
|-----------|--------|
| **Nom** | KenePoint |
| **Symbol** | KNP |
| **Type** | Fungible Token (HTS) |
| **Decimals** | 2 (permet 0.01 KNP) |
| **Supply Initial** | 1,000,000 KNP |
| **Supply Max** | 10,000,000 KNP |
| **Freeze** | Activé (pour modération) |
| **KYC** | Non requis (usage interne) |
| **Wipe** | Activé (pour sécurité) |

---

## 🚀 Création du Token (3 Options)

### **Option 1 : Via Script TypeScript (Recommandé)**

#### **Étape 1 : Créer le Script**

Créer `backend-api/src/scripts/create-kenepoint-token.ts` :

```typescript
import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
} from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function createKenePointToken() {
  console.log('🪙 Création du token KenePoint (KNP)...\n');

  // Configuration Hedera
  const operatorId = process.env.HEDERA_OPERATOR_ID!;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY!;
  const network = process.env.HEDERA_NETWORK || 'testnet';

  if (!operatorId || !operatorKey) {
    throw new Error('HEDERA_OPERATOR_ID et HEDERA_OPERATOR_KEY requis dans .env');
  }

  // Initialiser le client
  const client = network === 'testnet'
    ? Client.forTestnet()
    : Client.forMainnet();

  client.setOperator(operatorId, operatorKey);

  try {
    // Créer le token
    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName('KenePoint')
      .setTokenSymbol('KNP')
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2) // 0.01 KNP possible
      .setInitialSupply(1_000_000_00) // 1,000,000 KNP (avec 2 decimals)
      .setMaxSupply(10_000_000_00) // 10,000,000 KNP max
      .setSupplyType(TokenSupplyType.Finite)
      .setTreasuryAccountId(operatorId) // Backend = treasury
      .setAdminKey(client.operatorPublicKey!) // Peut modifier le token
      .setSupplyKey(client.operatorPublicKey!) // Peut mint/burn
      .setFreezeKey(client.operatorPublicKey!) // Peut freeze comptes
      .setWipeKey(client.operatorPublicKey!) // Peut wipe comptes
      .setFreezeDefault(false) // Comptes non freezés par défaut
      .setMaxTransactionFee(new Hbar(50)) // Max 50 HBAR pour la tx
      .execute(client);

    const tokenCreateReceipt = await tokenCreateTx.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId;

    console.log('✅ Token KenePoint créé avec succès !');
    console.log('📝 Token ID:', tokenId?.toString());
    console.log('💰 Supply Initial: 1,000,000 KNP');
    console.log('🔢 Decimals: 2');
    console.log('📊 Max Supply: 10,000,000 KNP');
    console.log('\n⚠️  IMPORTANT: Ajouter dans .env:');
    console.log(`HEDERA_TOKEN_ID=${tokenId?.toString()}`);

    // Récupérer le coût de la transaction
    const txRecord = await tokenCreateTx.getRecord(client);
    const cost = txRecord.transactionFee;

    console.log(`\n💸 Coût de création: ${cost.toString()}`);

  } catch (error: any) {
    console.error('❌ Erreur lors de la création du token:', error);
    console.error('Message:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Exécuter
createKenePointToken()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script échoué:', error);
    process.exit(1);
  });
```

#### **Étape 2 : Exécuter le Script**

```bash
cd backend-api

# S'assurer que .env est configuré avec:
# HEDERA_OPERATOR_ID=0.0.YOUR_ID
# HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
# HEDERA_NETWORK=testnet

npx ts-node src/scripts/create-kenepoint-token.ts
```

**Résultat attendu**:
```
🪙 Création du token KenePoint (KNP)...

✅ Token KenePoint créé avec succès !
📝 Token ID: 0.0.12345678
💰 Supply Initial: 1,000,000 KNP
🔢 Decimals: 2
📊 Max Supply: 10,000,000 KNP

⚠️  IMPORTANT: Ajouter dans .env:
HEDERA_TOKEN_ID=0.0.12345678

💸 Coût de création: 20 ℏ
```

#### **Étape 3 : Ajouter le Token ID dans .env**

```bash
# backend-api/.env
HEDERA_TOKEN_ID=0.0.12345678
```

---

### **Option 2 : Via Hedera Portal (Interface Web)**

1. Se connecter sur [Hedera Portal](https://portal.hedera.com/)
2. Aller dans "Token Service" > "Tokens"
3. Cliquer "Create Token"
4. Remplir les champs:
   - **Token Name**: KenePoint
   - **Token Symbol**: KNP
   - **Token Type**: Fungible
   - **Decimals**: 2
   - **Initial Supply**: 1000000 (1,000,000.00 avec decimals)
   - **Max Supply**: 10000000 (10,000,000.00)
   - **Supply Type**: Finite
   - **Treasury Account**: Votre Account ID
   - **Admin Key**: Votre Public Key
   - **Supply Key**: Votre Public Key
   - **Freeze Key**: Votre Public Key
   - **Wipe Key**: Votre Public Key
   - **Freeze Default**: false
5. Cliquer "Create"
6. Copier le Token ID
7. Ajouter dans `.env`:
   ```
   HEDERA_TOKEN_ID=0.0.XXXXXXXX
   ```

---

### **Option 3 : Via HashScan (Explorateur)**

1. Aller sur [HashScan Testnet](https://hashscan.io/testnet)
2. Se connecter avec HashPack wallet
3. Aller dans "Tokens" > "Create Token"
4. Suivre les étapes de l'interface
5. Confirmer la transaction dans HashPack
6. Copier le Token ID depuis la transaction

---

## 🔧 Configuration Post-Création

### **1. Ajouter les Variables d'Environnement**

Dans `backend-api/.env` :

```bash
# ==================== Hedera Token Service ====================
# Token ID du KenePoint (après création)
HEDERA_TOKEN_ID=0.0.12345678

# Compte treasury (détient tous les tokens)
HEDERA_TREASURY_ID=0.0.YOUR_OPERATOR_ID
HEDERA_TREASURY_KEY=YOUR_OPERATOR_PRIVATE_KEY

# Règles d'attribution (optionnel, valeurs par défaut)
KNP_REWARD_CONSULTATION=20
KNP_REWARD_DOCUMENT_UPLOAD=5
KNP_REWARD_DSE_SHARE=10
KNP_REWARD_APPOINTMENT_COMPLETED=15
KNP_REWARD_PRESCRIPTION_FOLLOWED=10
```

### **2. Créer le Modèle `UserWallet` dans Prisma**

Ajouter dans `backend-api/prisma/schema.prisma` :

```prisma
// Portefeuille de KenePoints
model UserWallet {
  id              Int      @id @default(autoincrement())
  userId          Int      @unique
  user            User     @relation(fields: [userId], references: [id])
  balance         Float    @default(0) // Balance actuelle en KNP
  totalEarned     Float    @default(0) // Total gagné depuis le début
  totalSpent      Float    @default(0) // Total dépensé
  lastUpdate      DateTime @default(now()) @updatedAt
  transactions    WalletTransaction[]
}

// Transactions de KenePoints
model WalletTransaction {
  id              Int      @id @default(autoincrement())
  walletId        Int
  wallet          UserWallet @relation(fields: [walletId], references: [id])
  amount          Float    // Montant (positif = gain, négatif = dépense)
  type            String   // Type: REWARD, TRANSFER, SPEND, REFUND
  reason          String   @db.Text // Raison de la transaction
  relatedEntityId Int?     // ID de l'entité liée (consultation, document, etc.)
  hederaTxId      String?  // Transaction ID Hedera HTS
  status          String   @default("PENDING") // PENDING, SUCCESS, FAILED
  createdAt       DateTime @default(now())
  metadata        String?  @db.Text // JSON metadata
}
```

Exécuter la migration :

```bash
cd backend-api
npx prisma generate
npx prisma db push
```

### **3. Vérifier le Token sur HashScan**

1. Aller sur [HashScan Testnet](https://hashscan.io/testnet/token/0.0.YOUR_TOKEN_ID)
2. Vérifier:
   - ✅ Token Name: KenePoint
   - ✅ Symbol: KNP
   - ✅ Decimals: 2
   - ✅ Total Supply: 1,000,000.00
   - ✅ Max Supply: 10,000,000.00
   - ✅ Treasury: Votre Account ID

---

## 🧪 Tests de Vérification

### **Test 1 : Récupérer les Infos du Token**

Créer `backend-api/src/scripts/test-kenepoint-token.ts` :

```typescript
import { Client, TokenInfoQuery } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

async function testToken() {
  const tokenId = process.env.HEDERA_TOKEN_ID!;
  const client = Client.forTestnet();
  client.setOperator(
    process.env.HEDERA_OPERATOR_ID!,
    process.env.HEDERA_OPERATOR_KEY!
  );

  const tokenInfo = await new TokenInfoQuery()
    .setTokenId(tokenId)
    .execute(client);

  console.log('📋 Informations du Token KenePoint:');
  console.log('Token ID:', tokenInfo.tokenId.toString());
  console.log('Name:', tokenInfo.name);
  console.log('Symbol:', tokenInfo.symbol);
  console.log('Decimals:', tokenInfo.decimals);
  console.log('Total Supply:', tokenInfo.totalSupply.toString());
  console.log('Max Supply:', tokenInfo.maxSupply?.toString());
  console.log('Treasury:', tokenInfo.treasuryAccountId?.toString());

  await client.close();
}

testToken();
```

Exécuter:
```bash
npx ts-node src/scripts/test-kenepoint-token.ts
```

---

## 💰 Règles d'Attribution par Défaut

| Action | Récompense | Fréquence |
|--------|------------|-----------|
| **Consultation complétée** | 20 KNP | Par consultation |
| **Document uploadé** | 5 KNP | Par document |
| **Partage DSE** | 10 KNP | Par partage |
| **RDV honoré** | 15 KNP | Par RDV |
| **Prescription suivie** | 10 KNP | Par prescription |
| **Première connexion** | 50 KNP | Une fois |
| **Profil complété** | 30 KNP | Une fois |

**Total Initial Possible**: 50 + 30 = 80 KNP pour un nouveau patient

---

## 🔐 Sécurité

### **Clés du Token**

| Clé | Détenteur | Rôle |
|-----|-----------|------|
| **Admin Key** | Backend (Operator) | Modifier le token |
| **Supply Key** | Backend (Operator) | Mint/Burn KNP |
| **Freeze Key** | Backend (Operator) | Freeze comptes |
| **Wipe Key** | Backend (Operator) | Retirer tokens |

### **Bonnes Pratiques**

1. ✅ **Ne jamais exposer les clés** dans le code ou logs
2. ✅ **Utiliser des variables d'environnement** pour les secrets
3. ✅ **Limiter le mint** au strict nécessaire (éviter inflation)
4. ✅ **Logger toutes les transactions HTS** dans `HederaTransaction`
5. ✅ **Implémenter un rate limiting** sur les récompenses
6. ✅ **Vérifier les fraudes** (double récompense, manipulation)

---

## 📊 Monitoring

### **Métriques à Surveiller**

1. **Supply Total**: Ne doit pas dépasser 10,000,000 KNP
2. **Distribution**: Répartition équitable entre utilisateurs
3. **Inflation**: Taux de mint quotidien/mensuel
4. **Balance Treasury**: Tokens disponibles pour distribution

### **Dashboard Super Admin**

Afficher:
- 📊 Supply Total vs Max Supply
- 💰 Balance Treasury
- 📈 KNP distribués par jour/semaine/mois
- 👥 Top 10 utilisateurs (balance KNP)
- 🎁 Récompenses par type d'action

---

## 🚀 Migration en Production (Mainnet)

### **Étapes**

1. **Créer le token sur Mainnet**:
   ```bash
   # Modifier .env
   HEDERA_NETWORK=mainnet
   HEDERA_OPERATOR_ID=0.0.MAINNET_ID
   HEDERA_OPERATOR_KEY=MAINNET_PRIVATE_KEY
   
   # Exécuter le script
   npx ts-node src/scripts/create-kenepoint-token.ts
   ```

2. **Vérifier le Token ID**:
   - HashScan Mainnet: https://hashscan.io/mainnet/token/0.0.XXXXXX

3. **Mettre à jour .env Production**:
   ```bash
   HEDERA_TOKEN_ID=0.0.MAINNET_TOKEN_ID
   ```

4. **Annoncer le Token** sur la plateforme

### **Coût Mainnet**

| Opération | Coût Estimé |
|-----------|-------------|
| Création Token | ~$10-20 USD |
| Mint (par batch) | ~$0.01 USD |
| Transfer | ~$0.001 USD |

---

## ✅ Checklist de Création

- [ ] Compte Hedera avec balance HBAR suffisante (50+ HBAR)
- [ ] Variables `.env` configurées (OPERATOR_ID, OPERATOR_KEY)
- [ ] Script de création exécuté
- [ ] Token ID récupéré et ajouté dans `.env`
- [ ] Modèles Prisma `UserWallet` et `WalletTransaction` créés
- [ ] Migration DB exécutée (`npx prisma db push`)
- [ ] Token vérifié sur HashScan
- [ ] Test de récupération d'infos réussi

---

**Token KenePoint prêt pour l'intégration ! 🪙**

**Prochaine étape**: Créer le service `HederaHtsService` pour gérer les transactions.

