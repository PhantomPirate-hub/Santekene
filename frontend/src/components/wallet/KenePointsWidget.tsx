'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, History, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KenePointsWidgetProps {
  userId?: number;
}

export default function KenePointsWidget({ userId }: KenePointsWidgetProps) {
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBalance();
  }, [userId]);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      const res = await fetch(`${backendUrl}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setTotalEarned(data.totalEarned);
      }
    } catch (error) {
      console.error('Erreur chargement balance KNP:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">KenePoints</h3>
        <Coins className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-sm opacity-80">Balance</p>
          <p className="text-4xl font-bold">{balance.toFixed(2)} KNP</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>Total gagné: {totalEarned.toFixed(2)} KNP</span>
        </div>
      </div>

      <button
        onClick={() => router.push('/dashboard/wallet')}
        className="mt-4 w-full bg-white text-primary-600 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition"
      >
        <History className="w-4 h-4" />
        Voir l'historique
      </button>
    </div>
  );
}

