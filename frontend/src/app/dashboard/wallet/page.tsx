'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, Calendar, Loader2, Award } from 'lucide-react';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface RewardRule {
  action: string;
  amount: number;
  description: string;
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      // Fetch balance
      const balanceRes = await fetch(`${backendUrl}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance);
        setTotalEarned(balanceData.totalEarned);
        setTotalSpent(balanceData.totalSpent);
      }

      // Fetch transactions
      const txRes = await fetch(`${backendUrl}/api/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      }

      // Fetch rules
      const rulesRes = await fetch(`${backendUrl}/api/wallet/rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData);
      }
    } catch (error) {
      console.error('Erreur chargement wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Balance */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Mon Portefeuille KenePoints</h1>
          <Coins className="w-10 h-10" />
        </div>
        <p className="text-5xl font-bold mb-4">{balance.toFixed(2)} KNP</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="opacity-80">Total gagné</p>
            <p className="text-xl font-semibold">{totalEarned.toFixed(2)} KNP</p>
          </div>
          <div>
            <p className="opacity-80">Total dépensé</p>
            <p className="text-xl font-semibold">{totalSpent.toFixed(2)} KNP</p>
          </div>
        </div>
      </div>

      {/* Historique des Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Historique des Transactions
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Coins className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucune transaction pour le moment</p>
            <p className="text-sm text-gray-400 mt-2">
              Vos récompenses apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  {tx.amount > 0 ? (
                    <div className="p-2 bg-green-100 rounded-full">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-full">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{tx.reason}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <p
                  className={`text-lg font-bold ${
                    tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount.toFixed(2)} KNP
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Règles de Récompenses */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Comment gagner des KenePoints ?
        </h2>
        <ul className="space-y-3">
          {rules.map((rule, index) => (
            <li key={index} className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-primary-600 font-bold">✓</span>
                <span className="text-gray-700">{rule.description}</span>
              </div>
              <span className="font-bold text-primary-600">{rule.amount} KNP</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Astuce:</strong> Les KenePoints sont attribués automatiquement lors de vos actions sur la plateforme.
            Continuez à utiliser l'application pour en gagner plus !
          </p>
        </div>
      </div>
    </div>
  );
}

