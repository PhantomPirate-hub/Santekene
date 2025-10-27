'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Coins,
  TrendingUp,
  Trophy,
  Gift,
  Calendar,
  ArrowUp,
  ArrowDown,
  Medal,
  Star,
  Target,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import HeartbeatLoader from '@/components/shared/HeartbeatLoader';

interface KenePointsTransaction {
  id: number;
  points: number;
  reason: string;
  date: string;
}

interface KenePointsData {
  totalPoints: number;
  statistics: {
    earned: number;
    spent: number;
    transactionCount: number;
  };
  transactions: KenePointsTransaction[];
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  totalPoints: number;
  transactionCount: number;
}

interface MyRank {
  rank: number;
  totalPatients: number;
  myPoints: number;
  nextRankPoints: number | null;
  pointsToNextRank: number | null;
}

interface Reward {
  id: number;
  title: string;
  description: string;
  points: number;
  category: string;
  icon: string;
  available: boolean;
}

export default function KenePointsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kenePointsData, setKenePointsData] = useState<KenePointsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Récupérer mes KènèPoints
      const kenePointsRes = await fetch('http://localhost:5000/api/kenepoints/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (kenePointsRes.ok) {
        const data = await kenePointsRes.json();
        setKenePointsData(data);
      }

      // Récupérer mon rang
      const rankRes = await fetch('http://localhost:5000/api/kenepoints/me/rank', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (rankRes.ok) {
        const data = await rankRes.json();
        setMyRank(data);
      }

      // Récupérer le classement
      const leaderboardRes = await fetch('http://localhost:5000/api/kenepoints/leaderboard?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.leaderboard);
      }

      // Récupérer les récompenses
      const rewardsRes = await fetch('http://localhost:5000/api/kenepoints/rewards', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!kenePointsData || kenePointsData.totalPoints < reward.points) {
      alert('Solde insuffisant !');
      return;
    }

    if (!confirm(`Voulez-vous échanger ${reward.points} KènèPoints contre "${reward.title}" ?`)) {
      return;
    }

    setRedeeming(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/kenepoints/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rewardId: reward.id,
          rewardTitle: reward.title,
          pointsCost: reward.points,
        }),
      });

      if (response.ok) {
        alert('Récompense échangée avec succès ! Vous serez contacté bientôt.');
        fetchData(); // Rafraîchir les données
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'échange');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'échange');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <HeartbeatLoader />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-8 h-8 text-gray-400" />;
    if (rank === 3) return <Medal className="w-8 h-8 text-amber-600" />;
    return <Star className="w-8 h-8 text-bleu-clair" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center gap-3">
            <Coins className="w-8 h-8 text-vert-kene" />
            Mes KènèPoints
          </h1>
          <p className="text-texte-principal/60 mt-1">
            Gagnez des points et échangez-les contre des récompenses !
          </p>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-vert-kene to-green-600 text-blanc-pur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Solde Total</p>
                  <p className="text-4xl font-bold mt-2">{kenePointsData?.totalPoints || 0}</p>
                  <p className="text-xs opacity-75 mt-1">KènèPoints</p>
                </div>
                <Sparkles className="w-12 h-12 opacity-90" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-texte-principal/60">Points gagnés</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    +{kenePointsData?.statistics.earned || 0}
                  </p>
                </div>
                <ArrowUp className="w-10 h-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-texte-principal/60">Points utilisés</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    -{kenePointsData?.statistics.spent || 0}
                  </p>
                </div>
                <ArrowDown className="w-10 h-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-texte-principal/60">Mon classement</p>
                  <p className="text-3xl font-bold text-bleu-clair mt-2">
                    #{myRank?.rank || '-'}
                  </p>
                </div>
                <Trophy className="w-10 h-10 text-bleu-clair" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Progression vers le prochain rang */}
      {myRank && myRank.pointsToNextRank !== null && (
        <Card className="bg-gradient-to-r from-bleu-clair/10 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Target className="w-8 h-8 text-bleu-clair" />
                <div>
                  <p className="font-semibold text-texte-principal">Prochain objectif</p>
                  <p className="text-sm text-texte-principal/60">
                    Encore {myRank.pointsToNextRank} points pour atteindre le rang #{myRank.rank - 1}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-bleu-clair">{myRank.myPoints}</p>
                <p className="text-xs text-texte-principal/60">/ {myRank.nextRankPoints}</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-bleu-clair h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(myRank.myPoints / (myRank.nextRankPoints || 1)) * 100}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="leaderboard">Classement</TabsTrigger>
        </TabsList>

        {/* Récompenses */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-vert-kene" />
                Récompenses disponibles
              </CardTitle>
              <CardDescription>
                Échangez vos KènèPoints contre des récompenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map(reward => {
                  const canAfford = (kenePointsData?.totalPoints || 0) >= reward.points;
                  return (
                    <Card key={reward.id} className={!canAfford ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <Badge variant="outline">{reward.category}</Badge>
                          <Badge
                            className={canAfford ? 'bg-vert-kene text-blanc-pur' : 'bg-gray-400 text-white'}
                          >
                            {reward.points} pts
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{reward.title}</h3>
                        <p className="text-sm text-texte-principal/60 mb-4">{reward.description}</p>
                        <Button
                          onClick={() => handleRedeemReward(reward)}
                          disabled={!canAfford || redeeming}
                          className="w-full"
                          variant={canAfford ? 'default' : 'outline'}
                        >
                          {canAfford ? 'Échanger' : 'Solde insuffisant'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-bleu-clair" />
                Historique des transactions
              </CardTitle>
              <CardDescription>
                Toutes vos transactions KènèPoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kenePointsData && kenePointsData.transactions.length > 0 ? (
                <div className="space-y-3">
                  {kenePointsData.transactions.map(transaction => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {transaction.points > 0 ? (
                          <ArrowUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <ArrowDown className="w-5 h-5 text-orange-600" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.reason}</p>
                          <p className="text-sm text-texte-principal/60">
                            {new Date(transaction.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-lg font-bold ${
                          transaction.points > 0 ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        {transaction.points > 0 ? '+' : ''}
                        {transaction.points}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-texte-principal/60">
                  <Coins className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>Aucune transaction pour le moment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classement */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-vert-kene" />
                Classement des patients
              </CardTitle>
              <CardDescription>
                Top 10 des patients avec le plus de KènèPoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map(entry => (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {getRankIcon(entry.rank)}
                        <div>
                          <p className="font-semibold">{entry.name}</p>
                          <p className="text-sm text-texte-principal/60">
                            {entry.transactionCount} transaction(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-vert-kene">{entry.totalPoints}</p>
                        <p className="text-xs text-texte-principal/60">KènèPoints</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-texte-principal/60">
                  <Trophy className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>Aucun classement disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
