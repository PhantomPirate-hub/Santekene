'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Activity, FileText, Calendar, AlertCircle, Award, User } from "lucide-react";

interface DSESummary {
  patient: any;
  stats: {
    totalConsultations: number;
    totalDocuments: number;
    totalAppointments: number;
    totalKenePoints: number;
    upcomingAppointments: number;
  };
}

export default function HealthProfileWidget() {
  const [dseData, setDseData] = useState<DSESummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchDSESummary = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients/me/dse', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDseData(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du DSE:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDSESummary();
    }
  }, [token]);

  if (loading) {
    return (
      <Card className="bg-blanc-pur shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-texte-principal">Résumé de votre Dossier Santé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bleu-clair"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dseData) {
    return null;
  }

  const { patient, stats } = dseData;

  // Prochaine consultation
  const nextAppointment = patient.appointments && patient.appointments.length > 0 
    ? patient.appointments.find((apt: any) => new Date(apt.date) > new Date())
    : null;

  // Dernière consultation
  const lastConsultation = patient.consultations && patient.consultations.length > 0
    ? patient.consultations[0]
    : null;

  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal flex items-center">
          <Activity className="w-5 h-5 mr-2 text-bleu-clair" />
          Résumé de votre Dossier Santé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations générales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-bleu-clair/10 to-bleu-clair/5 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-texte-principal/60">Consultations</p>
              <Activity className="w-5 h-5 text-bleu-clair" />
            </div>
            <p className="text-2xl font-bold text-texte-principal">{stats.totalConsultations}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-kene/10 to-orange-kene/5 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-texte-principal/60">Documents</p>
              <FileText className="w-5 h-5 text-orange-kene" />
            </div>
            <p className="text-2xl font-bold text-texte-principal">{stats.totalDocuments}</p>
          </div>
        </div>

        {/* Prochain rendez-vous */}
        {nextAppointment ? (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Prochain rendez-vous</p>
                <p className="text-sm text-green-700 mt-1">
                  Dr. {nextAppointment.doctor.user.name}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {new Date(nextAppointment.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-600">Aucun rendez-vous programmé</p>
                <p className="text-xs text-gray-500 mt-1">Prenez rendez-vous avec votre médecin</p>
              </div>
            </div>
          </div>
        )}

        {/* Dernière consultation */}
        {lastConsultation && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-texte-principal/60 mb-2">Dernière consultation</p>
            <div className="bg-bleu-clair/5 p-3 rounded-lg">
              <p className="text-sm font-medium text-texte-principal">
                Dr. {lastConsultation.doctor.user.name}
              </p>
              <p className="text-xs text-texte-principal/60 mt-1">
                {new Date(lastConsultation.date).toLocaleDateString('fr-FR')} - {lastConsultation.type}
              </p>
              {lastConsultation.diagnosis && (
                <p className="text-sm text-texte-principal/80 mt-2">{lastConsultation.diagnosis}</p>
              )}
            </div>
          </div>
        )}

        {/* Allergies (depuis les consultations) */}
        {patient.consultations && patient.consultations.filter((c: any) => c.allergies).length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm font-medium text-red-600">Allergies détectées</p>
            </div>
            <div className="space-y-2">
              {patient.consultations
                .filter((c: any) => c.allergies)
                .slice(0, 2)
                .map((consultation: any, index: number) => (
                  <div key={index} className="bg-red-50 border-l-4 border-red-500 p-2 rounded">
                    <p className="text-sm font-medium text-red-800">{consultation.allergies}</p>
                    <p className="text-xs text-red-600">
                      Détecté le {new Date(consultation.date).toLocaleDateString('fr-FR')} par Dr. {consultation.doctor.user.name}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* KènèPoints */}
        <div className="bg-gradient-to-r from-orange-kene/20 to-orange-kene/10 p-4 rounded-lg border border-orange-kene/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-texte-principal/60">Vos KènèPoints</p>
              <p className="text-3xl font-bold text-orange-kene mt-1">{stats.totalKenePoints}</p>
            </div>
            <Award className="w-10 h-10 text-orange-kene" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}