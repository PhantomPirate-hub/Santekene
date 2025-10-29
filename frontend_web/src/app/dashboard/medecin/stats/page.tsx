'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DoctorStats {
  totalPatients: number;
  totalConsultations: number;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  rejectedAppointments: number;
  consultationsThisMonth: number;
  consultationsLastMonth: number;
  avgConsultationsPerDay: number;
  topDiagnoses: Array<{ diagnosis: string; count: number }>;
  monthlyStats: Array<{ month: string; consultations: number; patients: number }>;
  appointmentsByType: Array<{ type: string; count: number }>;
  recentActivity: Array<{
    id: number;
    type: 'consultation' | 'appointment';
    patientName: string;
    date: string;
    details: string;
  }>;
}

export default function MedecinStatsPage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      console.log('🔍 Chargement des statistiques...');
      console.log('📡 BACKEND_URL from env:', process.env.NEXT_PUBLIC_BACKEND_URL);
      console.log('📡 URL finale:', `${backendUrl}/api/medecin/stats`);
      console.log('🔑 Token:', token ? 'Présent' : 'Absent');

      const response = await fetch(`${backendUrl}/api/medecin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📥 Réponse status:', response.status);
      console.log('📥 Réponse OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur réponse:', errorData);
        throw new Error(errorData.error || 'Erreur lors du chargement des statistiques');
      }

      const data = await response.json();
      console.log('✅ Données reçues:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ Erreur stats complète:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fond p-8 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-bleu-principal" />
          <p className="text-texte-principal/60">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-fond p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <p className="font-medium">{error || 'Impossible de charger les statistiques'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const growthRate =
    stats.consultationsLastMonth > 0
      ? ((stats.consultationsThisMonth - stats.consultationsLastMonth) / stats.consultationsLastMonth) * 100
      : 0;

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-bleu-principal" />
            Statistiques & Activité
          </h1>
          <p className="text-texte-principal/60 mt-2">
            Analyse de votre activité médicale et de vos performances
          </p>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Patients */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Patients suivis</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalPatients}</p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Total Consultations */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Consultations totales</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalConsultations}</p>
                </div>
                <FileText className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* RDV en attente */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">RDV en attente</p>
                  <p className="text-4xl font-bold mt-2">{stats.pendingAppointments}</p>
                </div>
                <Clock className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          {/* Moyenne quotidienne */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Moy. par jour</p>
                  <p className="text-4xl font-bold mt-2">{stats.avgConsultationsPerDay.toFixed(1)}</p>
                </div>
                <Activity className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Évolution et RDV */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution mensuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-bleu-principal" />
                Évolution Mensuelle
              </CardTitle>
              <CardDescription>Comparaison avec le mois précédent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-bleu-clair/10 rounded-lg">
                  <div>
                    <p className="text-sm text-texte-principal/60">Ce mois-ci</p>
                    <p className="text-2xl font-bold text-texte-principal">{stats.consultationsThisMonth}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-bleu-principal" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm text-texte-principal/60">Mois dernier</p>
                    <p className="text-2xl font-bold text-texte-principal">{stats.consultationsLastMonth}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex items-center justify-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <TrendingUp
                    className={`w-5 h-5 mr-2 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  />
                  <p className="text-lg font-semibold">
                    {growthRate >= 0 ? '+' : ''}
                    {growthRate.toFixed(1)}% de croissance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Répartition des RDV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-bleu-principal" />
                Rendez-vous
              </CardTitle>
              <CardDescription>Statut des demandes de RDV</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-texte-principal">En attente</p>
                      <p className="text-sm text-texte-principal/60">À traiter</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    {stats.pendingAppointments}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-texte-principal">Confirmés</p>
                      <p className="text-sm text-texte-principal/60">RDV planifiés</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {stats.confirmedAppointments}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-texte-principal">Refusés</p>
                      <p className="text-sm text-texte-principal/60">Non acceptés</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {stats.rejectedAppointments}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnostics les plus fréquents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-bleu-principal" />
              Diagnostics les plus fréquents
            </CardTitle>
            <CardDescription>Top 10 des diagnostics posés</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topDiagnoses.length > 0 ? (
              <div className="space-y-3">
                {stats.topDiagnoses.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? 'bg-yellow-500'
                            : index === 1
                            ? 'bg-gray-400'
                            : index === 2
                            ? 'bg-orange-400'
                            : 'bg-blue-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <p className="font-medium text-texte-principal">{item.diagnosis || 'Non spécifié'}</p>
                    </div>
                    <Badge variant="secondary">{item.count} fois</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-texte-principal/60 py-8">Aucune donnée disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-bleu-principal" />
              Activité Récente
            </CardTitle>
            <CardDescription>Dernières consultations et rendez-vous</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'consultation'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {activity.type === 'consultation' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-texte-principal">{activity.patientName}</p>
                      <p className="text-sm text-texte-principal/70">{activity.details}</p>
                      <p className="text-xs text-texte-principal/50 mt-1">
                        {new Date(activity.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-texte-principal/60 py-8">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

