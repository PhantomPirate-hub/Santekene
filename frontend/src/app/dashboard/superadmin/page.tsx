'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface PlatformStats {
  users: {
    total: number;
    byRole: {
      patients: number;
      doctors: number;
      admins: number;
      superAdmins: number;
    };
    newLast30Days: number;
  };
  consultations: {
    total: number;
    thisMonth: number;
    last30Days: number;
  };
  appointments: {
    total: number;
    byStatus: {
      pending: number;
      confirmed: number;
      completed: number;
    };
  };
  facilities: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  growth: {
    users: Array<{ date: string; count: number }>;
  };
}

export default function SuperAdminDashboard() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    if (!token || user?.role !== 'SUPERADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchStats();
  }, [token, user, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/superadmin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fond p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-bleu-principal" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-fond p-8">
        <p>Erreur de chargement des statistiques</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center">
            <Shield className="w-8 h-8 mr-3 text-purple-600" />
            Super Administration
          </h1>
          <p className="text-texte-principal/60 mt-2">
            Vue d'ensemble de la plateforme Santé Kènè
          </p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Utilisateurs */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Utilisateurs</p>
                  <p className="text-4xl font-bold mt-2">{stats.users.total}</p>
                  <p className="text-xs text-blue-100 mt-2">
                    +{stats.users.newLast30Days} ce mois
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          {/* Consultations */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Consultations</p>
                  <p className="text-4xl font-bold mt-2">{stats.consultations.total}</p>
                  <p className="text-xs text-green-100 mt-2">
                    {stats.consultations.thisMonth} ce mois
                  </p>
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
                  <p className="text-4xl font-bold mt-2">{stats.appointments.byStatus.pending}</p>
                  <p className="text-xs text-orange-100 mt-2">
                    {stats.appointments.total} total
                  </p>
                </div>
                <Activity className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          {/* Structures en attente */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Structures en attente</p>
                  <p className="text-4xl font-bold mt-2">{stats.facilities.pending}</p>
                  <p className="text-xs text-purple-100 mt-2">
                    {stats.facilities.total} demandes
                  </p>
                </div>
                <Building2 className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails par rôle */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-bleu-principal" />
                Répartition des Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-texte-principal">Patients</p>
                    <p className="text-sm text-texte-principal/60">Utilisateurs finaux</p>
                  </div>
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    {stats.users.byRole.patients}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-texte-principal">Médecins</p>
                    <p className="text-sm text-texte-principal/60">Professionnels de santé</p>
                  </div>
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    {stats.users.byRole.doctors}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-texte-principal">Admins</p>
                    <p className="text-sm text-texte-principal/60">Administrateurs</p>
                  </div>
                  <Badge className="bg-orange-600 text-white px-4 py-1">
                    {stats.users.byRole.admins}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-texte-principal">Super Admins</p>
                    <p className="text-sm text-texte-principal/60">Super administrateurs</p>
                  </div>
                  <Badge className="bg-purple-600 text-white px-4 py-1">
                    {stats.users.byRole.superAdmins}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demandes de structures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-bleu-principal" />
                Demandes de Structures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-texte-principal">En attente</p>
                      <p className="text-sm text-texte-principal/60">À valider</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600 px-4 py-1">
                    {stats.facilities.pending}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-texte-principal">Approuvées</p>
                      <p className="text-sm text-texte-principal/60">Validées</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-1">
                    {stats.facilities.approved}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-texte-principal">Refusées</p>
                      <p className="text-sm text-texte-principal/60">Non validées</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-600 border-red-600 px-4 py-1">
                    {stats.facilities.rejected}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique de croissance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-bleu-principal" />
              Croissance des Utilisateurs (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2 h-64">
              {stats.growth?.users && stats.growth.users.length > 0 ? (
                stats.growth.users.map((day, index) => {
                  const maxCount = Math.max(...stats.growth.users.map((d) => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center justify-end flex-1">
                        <div
                          className="w-full bg-gradient-to-t from-bleu-principal to-blue-400 rounded-t-lg transition-all hover:opacity-80"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? '20px' : '0' }}
                        ></div>
                      </div>
                      <p className="text-xs text-texte-principal/60 mt-2 text-center">
                        {day.date}
                      </p>
                      <p className="text-sm font-semibold text-texte-principal">{day.count}</p>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center h-full text-texte-principal/60">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-500"
            onClick={() => router.push('/dashboard/superadmin/facilities')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-texte-principal">Gérer les Structures</p>
                  <p className="text-sm text-texte-principal/60">Valider les demandes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-500"
            onClick={() => router.push('/dashboard/superadmin/users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-texte-principal">Gérer les Utilisateurs</p>
                  <p className="text-sm text-texte-principal/60">Voir tous les comptes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-xl transition-all border-2 border-transparent hover:border-green-500"
            onClick={() => router.push('/dashboard/superadmin/create-admin')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-texte-principal">Créer un Admin</p>
                  <p className="text-sm text-texte-principal/60">Nouveau super admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

