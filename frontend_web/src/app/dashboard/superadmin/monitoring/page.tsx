'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  UserCheck,
  Building2,
} from 'lucide-react';

interface MonitoringStats {
  realTime: {
    activeUsers: number;
    ongoingConsultations: number;
    pendingAppointments: number;
    todayRegistrations: number;
  };
  activity: {
    last24h: {
      logins: number;
      consultations: number;
      appointments: number;
      prescriptions: number;
    };
    last7days: {
      logins: number;
      consultations: number;
      appointments: number;
      prescriptions: number;
    };
    last30days: {
      logins: number;
      consultations: number;
      appointments: number;
      prescriptions: number;
    };
  };
  performance: {
    avgResponseTime: number;
    successRate: number;
    totalRequests: number;
  };
  recentActivities: Array<{
    id: number;
    type: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
}

export default function MonitoringPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    if (token) {
      console.log('🚀 useEffect triggered, fetching monitoring...');
      fetchMonitoringData();
      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(fetchMonitoringData, 30000);
      return () => clearInterval(interval);
    } else {
      console.log('⏳ Waiting for token...');
    }
  }, [token]);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      console.log('🔍 Fetching monitoring from:', `${backendUrl}/api/superadmin/monitoring`);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${backendUrl}/api/superadmin/monitoring`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Monitoring data received:', data);
        setStats(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
      }
    } catch (error) {
      console.error('❌ Erreur complète:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-fond p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-bleu-principal" />
      </div>
    );
  }

  const getActivityData = () => {
    switch (timeRange) {
      case '24h':
        return stats.activity.last24h;
      case '7d':
        return stats.activity.last7days;
      case '30d':
        return stats.activity.last30days;
      default:
        return stats.activity.last24h;
    }
  };

  const activityData = getActivityData();

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-texte-principal flex items-center">
              <Activity className="w-8 h-8 mr-3 text-purple-600" />
              Monitoring & Activités
            </h1>
            <p className="text-texte-principal/60 mt-2">
              Suivi en temps réel des activités de la plateforme
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-green-600 animate-pulse" />
            <span className="text-sm text-texte-principal/60">
              Mis à jour : {new Date().toLocaleTimeString('fr-FR')}
            </span>
          </div>
        </div>

        {/* Statistiques en temps réel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Utilisateurs actifs</p>
                  <p className="text-4xl font-bold mt-2">{stats.realTime.activeUsers}</p>
                  <p className="text-xs text-green-100 mt-2 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    En ligne maintenant
                  </p>
                </div>
                <Users className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Consultations en cours</p>
                  <p className="text-4xl font-bold mt-2">{stats.realTime.ongoingConsultations}</p>
                  <p className="text-xs text-blue-100 mt-2 flex items-center">
                    <Activity className="w-3 h-3 mr-1 animate-pulse" />
                    Actives
                  </p>
                </div>
                <FileText className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">RDV en attente</p>
                  <p className="text-4xl font-bold mt-2">{stats.realTime.pendingAppointments}</p>
                  <p className="text-xs text-orange-100 mt-2 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    À traiter
                  </p>
                </div>
                <Calendar className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Inscriptions aujourd'hui</p>
                  <p className="text-4xl font-bold mt-2">{stats.realTime.todayRegistrations}</p>
                  <p className="text-xs text-purple-100 mt-2 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Nouveaux
                  </p>
                </div>
                <UserCheck className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activités par période */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-bleu-principal" />
                Activités par Période
              </CardTitle>
              <Tabs value={timeRange} onValueChange={setTimeRange}>
                <TabsList>
                  <TabsTrigger value="24h">24h</TabsTrigger>
                  <TabsTrigger value="7d">7 jours</TabsTrigger>
                  <TabsTrigger value="30d">30 jours</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <Badge className="bg-blue-600">{activityData.logins}</Badge>
                </div>
                <p className="text-sm font-semibold text-texte-principal">Connexions</p>
                <p className="text-xs text-texte-principal/60 mt-1">Utilisateurs connectés</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <Badge className="bg-green-600">{activityData.consultations}</Badge>
                </div>
                <p className="text-sm font-semibold text-texte-principal">Consultations</p>
                <p className="text-xs text-texte-principal/60 mt-1">Total effectuées</p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <Badge className="bg-orange-600">{activityData.appointments}</Badge>
                </div>
                <p className="text-sm font-semibold text-texte-principal">Rendez-vous</p>
                <p className="text-xs text-texte-principal/60 mt-1">RDV créés</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <Badge className="bg-purple-600">{activityData.prescriptions}</Badge>
                </div>
                <p className="text-sm font-semibold text-texte-principal">Ordonnances</p>
                <p className="text-xs text-texte-principal/60 mt-1">Prescriptions émises</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance système */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-bleu-principal" />
                Performance Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-texte-principal">Taux de succès</p>
                    <p className="text-sm text-texte-principal/60">Requêtes réussies</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{stats.performance.successRate}%</p>
                    <p className="text-xs text-texte-principal/60">{stats.performance.totalRequests} requêtes</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-texte-principal">Temps de réponse moyen</p>
                    <p className="text-sm text-texte-principal/60">Performance API</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{stats.performance.avgResponseTime} ms</p>
                    <p className="text-xs text-texte-principal/60">
                      {stats.performance.avgResponseTime < 200 ? 'Excellent' : stats.performance.avgResponseTime < 500 ? 'Bon' : 'À améliorer'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activités récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-bleu-principal" />
                Activités Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-bleu-principal/10 flex items-center justify-center flex-shrink-0">
                        {activity.type === 'LOGIN' && <Users className="w-4 h-4 text-bleu-principal" />}
                        {activity.type === 'CONSULTATION' && <FileText className="w-4 h-4 text-green-600" />}
                        {activity.type === 'APPOINTMENT' && <Calendar className="w-4 h-4 text-orange-600" />}
                        {activity.type === 'REGISTRATION' && <UserCheck className="w-4 h-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-texte-principal truncate">{activity.user}</p>
                        <p className="text-xs text-texte-principal/60">{activity.action}</p>
                        <p className="text-xs text-texte-principal/40 mt-1">
                          {new Date(activity.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-texte-principal/60 py-8">Aucune activité récente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

