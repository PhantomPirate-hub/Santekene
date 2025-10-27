'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Shield,
  Lightbulb,
  User,
  Phone,
  Calendar,
  Building2,
  Navigation,
  Stethoscope
} from 'lucide-react';
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  email: string;
  phone: string | null;
}

interface HealthCenter {
  id: number;
  name: string;
  city: string;
  phone: string | null;
  emergencyServices: boolean;
  distance?: number;
}

interface AITriageResultsProps {
  results: {
    summary: string;
    urgency: string;
    urgency_label: string;
    urgency_color: string;
    specialties: string[];
    precautions: string[];
    recommendations: string[];
    consultation_type: string;
    consultation_type_label: string;
    explanation: string;
  };
}

export default function AITriageResults({ results }: AITriageResultsProps) {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);

  // Récupérer la position de l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Géolocalisation refusée');
        }
      );
    }
  }, []);

  // Charger les recommandations
  useEffect(() => {
    fetchRecommendations();
  }, [results.specialties, userLocation]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Récupérer les médecins recommandés
      const doctorsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/recommended-doctors?specialties=${results.specialties.join(',')}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        setDoctors(doctorsData.doctors || []);
      }

      // Récupérer les hôpitaux recommandés
      let healthCentersUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/ai/recommended-healthcenters?limit=3`;
      if (userLocation) {
        healthCentersUrl += `&latitude=${userLocation.lat}&longitude=${userLocation.lon}`;
      }

      const healthCentersRes = await fetch(healthCentersUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (healthCentersRes.ok) {
        const healthCentersData = await healthCentersRes.json();
        setHealthCenters(healthCentersData.healthCenters || []);
      }
    } catch (error) {
      console.error('Erreur chargement recommandations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyIcon = () => {
    switch (results.urgency) {
      case 'urgent':
        return <AlertTriangle className="w-8 h-8" />;
      case 'modéré':
        return <AlertCircle className="w-8 h-8" />;
      default:
        return <CheckCircle className="w-8 h-8" />;
    }
  };

  const getUrgencyColors = () => {
    switch (results.urgency) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'modéré':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-800 border-orange-300'
        };
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800 border-green-300'
        };
    }
  };

  const colors = getUrgencyColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Niveau d'urgence */}
      <Card className={`${colors.bg} ${colors.border} border-2`}>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className={colors.icon}>
              {getUrgencyIcon()}
            </div>
            <div>
              <CardTitle className={`text-2xl ${colors.text}`}>
                {results.urgency_label}
              </CardTitle>
              <CardDescription className={colors.text}>
                {results.consultation_type_label}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`${colors.text} text-lg`}>{results.summary}</p>
        </CardContent>
      </Card>

      {/* Spécialités recommandées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            Spécialités médicales recommandées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {results.specialties.map((specialty, index) => (
              <Badge key={index} className="px-4 py-2 text-sm bg-blue-100 text-blue-800">
                {specialty}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Précautions à prendre */}
      {results.precautions && results.precautions.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              Précautions importantes
            </CardTitle>
            <CardDescription>
              À faire avant votre consultation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.precautions.map((precaution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{precaution}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommandations */}
      {results.recommendations && results.recommendations.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              Nos recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Médecins disponibles */}
      {!loading && doctors.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Médecins disponibles ({doctors.length})
            </CardTitle>
            <CardDescription>
              Ces médecins peuvent vous aider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{doctor.name}</h4>
                      <p className="text-sm text-gray-600">{doctor.specialty}</p>
                      {doctor.phone && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          {doctor.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => router.push(`/dashboard/patient/appointments?doctor=${doctor.id}`)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Prendre RDV
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hôpitaux proches */}
      {!loading && healthCenters.length > 0 && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Établissements de santé à proximité
            </CardTitle>
            <CardDescription>
              {userLocation ? 'Triés par distance' : 'Établissements disponibles'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthCenters.map((center) => (
                <div
                  key={center.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{center.name}</h4>
                      <p className="text-sm text-gray-600">{center.city}</p>
                      {center.distance && (
                        <p className="text-sm text-gray-500 mt-1">
                          📍 À {center.distance} km
                        </p>
                      )}
                      {center.emergencyServices && (
                        <Badge className="mt-2 bg-red-100 text-red-800">
                          🚨 Urgences 24/7
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push(`/dashboard/map?center=${center.id}`)}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Itinéraire
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Chargement des recommandations...</p>
          </CardContent>
        </Card>
      )}

      {/* Bouton d'action principal */}
      {results.urgency === 'urgent' && (
        <Card className="bg-red-50 border-2 border-red-200">
          <CardContent className="pt-6">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
              size="lg"
              onClick={() => router.push('/dashboard/map')}
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Trouver une urgence maintenant
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
