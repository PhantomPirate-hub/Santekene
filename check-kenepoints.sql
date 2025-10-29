-- Vérifier les portefeuilles des utilisateurs
SELECT 
    u.id AS userId,
    u.name,
    u.email,
    u.role,
    uw.balance,
    uw.totalEarned,
    uw.totalSpent
FROM UserWallet uw
JOIN User u ON uw.userId = u.id
ORDER BY uw.totalEarned DESC;

-- Vérifier les transactions de wallet
SELECT 
    wt.id,
    u.name AS userName,
    wt.amount,
    wt.type,
    wt.reason,
    wt.status,
    wt.relatedEntityType,
    wt.relatedEntityId,
    wt.createdAt
FROM WalletTransaction wt
JOIN UserWallet uw ON wt.walletId = uw.id
JOIN User u ON uw.userId = u.id
ORDER BY wt.createdAt DESC
LIMIT 10;

