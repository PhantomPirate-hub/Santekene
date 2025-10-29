'use client';

import { useState, useEffect } from 'react';
import { BadgeLevel } from './BadgeLevel';
import { Coins, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BadgeInfo {
  level: 'BRONZE' | 'ARGENT' | 'OR' | 'PLATINE' | 'VIP';
  name: string;
  minKNP: number;
  maxKNP: number | null;
  color: string;
  icon: string;
  benefits: string[];
}

interface WalletData {
  wallet: {
    balance: number;
  };
  badge: {
    current: BadgeInfo;
  };
}

export default function WalletBadge() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${backendUrl}/api/wallet/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Erreur chargement badge:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm border">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!walletData) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push('/dashboard/wallet')}
      title="Cliquez pour voir votre portefeuille"
    >
      <BadgeLevel badge={walletData.badge.current} size="sm" showName={false} />
      <div>
        <p className="text-xs text-gray-500">KenePoints</p>
        <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
          {walletData.wallet.balance.toFixed(0)}
          <Coins className="w-4 h-4 text-vert-kene" />
        </p>
      </div>
    </div>
  );
}

