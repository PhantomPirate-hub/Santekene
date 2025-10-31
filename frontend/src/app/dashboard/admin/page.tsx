'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  UserCheck, 
  UserX, 
  FileText, 
  Activity,
  Calendar,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface FacilityStats {
  facility: {
    id: number;
    name: string;
    type: string;
    city: string;
    status: string;
  };
  stats: {
    doctors: {
      total: number;
      active: number;
      pending: number;
    };
    consultations: {
      total: number;
      thisMonth: number;
    };
    patients: {
      unique: number;
    };
    prescriptions: {
      total: number;
    };
  };
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FacilityStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/admin/facility/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          console.error('❌ Erreur stats:', errorData);
          alert(errorData.error || 'Erreur lors du chargement des statistiques');
        }
      } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
        alert('Impossible de charger les statistiques. Vérifiez que le serveur backend est démarré.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-bleu-primaire" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-red-500">Erreur de chargement des statistiques</p>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Demandes en attente',
      description: 'Valider les médecins',
      icon: UserCheck,
      count: stats.stats.doctors.pending,
      href: '/dashboard/admin/doctors/pending',
      color: 'bg-orange-500',
    },
    {
      title: 'Médecins',
      description: 'Gérer les médecins',
      icon: Users,
      count: stats.stats.doctors.active,
      href: '/dashboard/admin/doctors',
      color: 'bg-blue-500',
    },
    {
      title: 'Activités',
      description: 'Voir les activités',
      icon: Activity,
      href: '/dashboard/admin/activities',
      color: 'bg-green-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-6"
    >
      {/* En-tête avec infos structure */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 shadow-lg border border-blue-200">
        <div className="flex items-center space-x-4">
          <Building2 className="w-12 h-12 text-bleu-primaire" />
          <div>
            <h1 className="text-3xl font-bold text-texte-principal">{stats.facility.name}</h1>
            <p className="text-texte-principal/80">{stats.facility.type} • {stats.facility.city}</p>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                stats.facility.status === 'APPROVED' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {stats.facility.status === 'APPROVED' ? 'Approuvée' : 'En attente'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal">
              Total Médecins
            </CardTitle>
            <Users className="w-5 h-5 text-bleu-primaire" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-texte-principal">
              {stats.stats.doctors.total}
            </div>
            <p className="text-xs text-texte-principal/60 mt-1">
              {stats.stats.doctors.active} actifs • {stats.stats.doctors.pending} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal">
              Consultations
            </CardTitle>
            <FileText className="w-5 h-5 text-vert-principal" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-texte-principal">
              {stats.stats.consultations.total}
            </div>
            <p className="text-xs text-texte-principal/60 mt-1">
              {stats.stats.consultations.thisMonth} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal">
              Patients Uniques
            </CardTitle>
            <Users className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-texte-principal">
              {stats.stats.patients.unique}
            </div>
            <p className="text-xs text-texte-principal/60 mt-1">
              Patients traités
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal">
              Prescriptions
            </CardTitle>
            <Calendar className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-texte-principal">
              {stats.stats.prescriptions.total}
            </div>
            <p className="text-xs text-texte-principal/60 mt-1">
              Émises au total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div>
        <h2 className="text-2xl font-bold text-texte-principal mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`${action.color} p-4 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-texte-principal group-hover:text-bleu-primaire transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-texte-principal/60">{action.description}</p>
                      {action.count !== undefined && (
                        <p className="text-2xl font-bold text-texte-principal mt-2">{action.count}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Alertes si demandes en attente */}
      {stats.stats.doctors.pending > 0 && (
        <Card className="border-orange-500 border-2 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <UserCheck className="w-8 h-8 text-orange-500" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-texte-principal">
                  {stats.stats.doctors.pending} demande{stats.stats.doctors.pending > 1 ? 's' : ''} en attente
                </h3>
                <p className="text-sm text-texte-principal/70">
                  Des médecins attendent votre validation pour rejoindre votre structure
                </p>
              </div>
              <Link href="/dashboard/admin/doctors/pending">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Voir les demandes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

