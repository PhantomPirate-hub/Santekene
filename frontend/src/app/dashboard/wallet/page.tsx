'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Calendar, Loader2, Award, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { BadgeLevel, BadgeProgress } from '@/components/shared/BadgeLevel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BadgeInfo {
  level: 'BRONZE' | 'ARGENT' | 'OR' | 'PLATINE' | 'VIP';
  name: string;
  minKNP: number;
  maxKNP: number | null;
  color: string;
  icon: string;
  benefits: string[];
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface WalletData {
  wallet: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  badge: {
    current: BadgeInfo;
    next: BadgeInfo | null;
    progressPercentage: number;
    kpToNext: number;
  };
  transactions: Transaction[];
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [badgeLevels, setBadgeLevels] = useState<BadgeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplanations, setShowExplanations] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Fetch wallet info (balance + badge + transactions)
      const walletRes = await fetch(`${backendUrl}/api/wallet/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (walletRes.ok) {
        const data = await walletRes.json();
        setWalletData(data);
      }

      // Fetch badge levels (explications)
      const levelsRes = await fetch(`${backendUrl}/api/wallet/badge-levels`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (levelsRes.ok) {
        const levelsData = await levelsRes.json();
        setBadgeLevels(levelsData.levels);
      }
    } catch (error) {
      console.error('Erreur chargement wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="p-6">
        <p className="text-red-600">Erreur lors du chargement du portefeuille</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header - Balance + Badge */}
      <Card className="bg-gradient-to-br from-vert-kene to-green-600 border-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-black mb-2">Mon Portefeuille</h1>
              <p className="text-5xl font-bold text-black mb-4">
                {walletData.wallet.balance.toFixed(2)} <span className="text-2xl">KNP</span>
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-black/80">Total gagné</p>
                  <p className="text-xl font-semibold text-black">
                    {walletData.wallet.totalEarned.toFixed(2)} KNP
                  </p>
                </div>
               
              </div>
            </div>
            <div className="ml-4">
              <Coins className="w-16 h-16 text-black opacity-80" />
            </div>
          </div>

          {/* Badge Progress */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <BadgeProgress
              current={walletData.badge.current}
              next={walletData.badge.next}
              progressPercentage={walletData.badge.progressPercentage}
              kpToNext={walletData.badge.kpToNext}
            />
          </div>
        </CardContent>
      </Card>

      {/* Explications Badges */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => setShowExplanations(!showExplanations)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-vert-kene" />
              <span>Niveaux de Badges</span>
            </div>
            {showExplanations ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </CardTitle>
        </CardHeader>
        {showExplanations && (
          <CardContent>
            <div className="space-y-4">
              {badgeLevels.map((level) => (
                <div
                  key={level.level}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  style={{ borderColor: level.color + '40' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <BadgeLevel badge={level} size="md" />
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {level.minKNP.toLocaleString()} KNP
                        {level.maxKNP && ` - ${level.maxKNP.toLocaleString()} KNP`}
                        {!level.maxKNP && ' +'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {level.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-vert-kene">✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                Plus vous accumulez de KenePoints, plus vous montez en niveau et débloquez
                d&apos;avantages exclusifs ! Les KenePoints ne se dépensent pas, vous les gagnez
                uniquement.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-vert-kene" />
            <span>Historique des Gains</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletData.transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucune transaction pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {walletData.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {tx.amount >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.reason}</p>
                      <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {tx.amount.toFixed(2)} KNP
                    </p>
                    <p
                      className={`text-xs ${
                        tx.status === 'SUCCESS' ? 'text-green-600' : 'text-orange-600'
                      }`}
                    >
                      {tx.status === 'SUCCESS' ? 'Succès' : 'En attente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
