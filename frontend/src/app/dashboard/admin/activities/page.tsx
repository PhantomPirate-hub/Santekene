'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  FileText, 
  UserPlus,
  Loader2,
  Calendar,
  User,
  Stethoscope
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Consultation {
  id: number;
  motif: string;
  diagnostic: string;
  createdAt: string;
  patient: {
    id: number;
    user: {
      name: string;
    };
  };
  doctor: {
    id: number;
    user: {
      name: string;
    };
  };
}

interface RecentDoctor {
  id: number;
  speciality: string;
  user: {
    name: string;
    email: string;
    isVerified: boolean;
    createdAt: string;
  };
}

interface ActivitiesData {
  recentConsultations: Consultation[];
  recentDoctors: RecentDoctor[];
}

export default function ActivitiesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<ActivitiesData | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/admin/facility/activities`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (error) {
        console.error('Erreur chargement activités:', error);
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-bleu-primaire" />
      </div>
    );
  }

  if (!activities) {
    return (
      <div className="p-8">
        <p className="text-red-500">Erreur de chargement des activités</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-texte-principal">Activités de la structure</h1>
        <p className="text-texte-principal/70">
          Suivez en temps réel les activités de votre structure de santé
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consultations récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-bleu-primaire" />
              Consultations récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.recentConsultations.length === 0 ? (
              <p className="text-texte-principal/60 text-center py-8">
                Aucune consultation récente
              </p>
            ) : (
              <div className="space-y-4">
                {activities.recentConsultations.map((consultation) => (
                  <div
                    key={consultation.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Stethoscope className="w-4 h-4 text-bleu-primaire" />
                          <span className="font-semibold text-texte-principal">
                            {consultation.doctor.user.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-texte-principal/70">
                            Patient: {consultation.patient.user.name}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(consultation.date), 'dd MMM', { locale: fr })}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-texte-principal">
                        <span className="font-medium">Notes:</span> {consultation.notes || 'Aucune note'}
                      </p>
                      {consultation.diagnosis && (
                        <p className="text-texte-principal">
                          <span className="font-medium">Diagnostic:</span> {consultation.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Médecins récemment inscrits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-green-500" />
              Médecins récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.recentDoctors.length === 0 ? (
              <p className="text-texte-principal/60 text-center py-8">
                Aucun médecin récent
              </p>
            ) : (
              <div className="space-y-4">
                {activities.recentDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-texte-principal">
                          {doctor.user.name}
                        </h4>
                          <Badge variant={doctor.user.isVerified ? 'default' : 'secondary'}>
                            {doctor.user.isVerified ? 'Validé' : 'En attente'}
                          </Badge>
                        </div>
                        <p className="text-sm text-texte-principal/70 mb-2">
                          {doctor.speciality}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-texte-principal/60">
                          <Calendar className="w-3 h-3" />
                          <span>
                            Inscrit le {format(new Date(doctor.user.createdAt), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

