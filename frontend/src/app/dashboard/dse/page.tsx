'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Calendar, 
  Activity, 
  AlertCircle, 
  Award,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  Eye
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface PatientData {
  patient: any;
  stats: {
    totalConsultations: number;
    totalDocuments: number;
    totalAppointments: number;
    totalKenePoints: number;
    upcomingAppointments: number;
  };
}

export default function DSEPage() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchDSE = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients/me/dse', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du DSE');
        }

        const data = await response.json();
        setPatientData(data);
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (token && user?.role === 'PATIENT') {
      fetchDSE();
    }
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bleu-clair mx-auto mb-4"></div>
          <p className="text-texte-principal/60">Chargement de votre dossier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-texte-principal/80">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patientData) {
    return null;
  }

  const { patient, stats } = patientData;

  // Fonction pour formater les dates
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header avec infos patient */}
      <Card className="bg-gradient-to-r from-bleu-clair/10 to-bleu-clair/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full bg-bleu-clair/20 border-4 border-bleu-clair flex items-center justify-center">
                <User className="w-10 h-10 text-bleu-clair" />
              </div>
              <div>
                <CardTitle className="text-2xl text-texte-principal">{patient.user.name}</CardTitle>
                <CardDescription className="text-base space-y-1 mt-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {patient.user.email}
                  </div>
                  {patient.user.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {patient.user.phone}
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {patient.address}
                    </div>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge className="bg-bleu-clair text-blanc-pur">
                Patient actif
              </Badge>
              <p className="text-sm text-texte-principal/60">
                Membre depuis {formatDate(patient.user.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal/60">Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-texte-principal">{stats.totalConsultations}</span>
              <Activity className="w-8 h-8 text-bleu-clair" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal/60">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-texte-principal">{stats.totalDocuments}</span>
              <FileText className="w-8 h-8 text-bleu-clair" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal/60">KènèPoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-kene">{stats.totalKenePoints}</span>
              <Award className="w-8 h-8 text-orange-kene" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Onglets avec détails */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Date de naissance</p>
                  <p className="text-base text-texte-principal">
                    {patient.birthDate ? formatDate(patient.birthDate) : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Groupe sanguin</p>
                  <p className="text-base text-texte-principal">{patient.bloodGroup || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Taille</p>
                  <p className="text-base text-texte-principal">
                    {patient.height ? `${patient.height} cm` : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Localité / Ville</p>
                  <p className="text-base text-texte-principal">{patient.location || 'Non spécifiée'}</p>
                </div>
              </div>

              {patient.medicalHistory && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-texte-principal/60 mb-2">Antécédents médicaux</p>
                  <p className="text-base text-texte-principal bg-gray-50 p-4 rounded-lg">
                    {patient.medicalHistory}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Consultations */}
        <TabsContent value="consultations" className="space-y-4">
          {patient.consultations && patient.consultations.length > 0 ? (
            patient.consultations.map((consultation: any) => (
              <Card key={consultation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {consultation.doctor.user.name}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(consultation.date)} - {consultation.type}
                      </CardDescription>
                    </div>
                    <Badge>{consultation.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-texte-principal/60">Motif</p>
                    <p className="text-base text-texte-principal">{consultation.reason}</p>
                  </div>
                  {consultation.diagnosis && (
                    <div>
                      <p className="text-sm font-medium text-texte-principal/60">Diagnostic</p>
                      <p className="text-base text-texte-principal">{consultation.diagnosis}</p>
                    </div>
                  )}
                  {consultation.notes && (
                    <div>
                      <p className="text-sm font-medium text-texte-principal/60">Notes</p>
                      <p className="text-base text-texte-principal">{consultation.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-texte-principal/60">Aucune consultation enregistrée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Documents */}
        <TabsContent value="documents" className="space-y-4">
          {/* Message informatif */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  📄 Documents d'analyses médicales
                </h4>
                <p className="text-sm text-blue-700">
                  Ces documents (analyses, examens, radiographies) sont uploadés par votre médecin lors des consultations. Cliquez sur un document pour le visualiser.
                </p>
              </div>
            </div>
      </div>

          {patient.documents && patient.documents.length > 0 ? (
            patient.documents.map((document: any) => (
              <Card 
                key={document.id} 
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <FileText className="w-8 h-8 text-bleu-clair" />
                      <div className="flex-1">
                        <p className="font-medium text-texte-principal">{document.title || document.name || document.type}</p>
                        <p className="text-sm text-texte-principal/60">
                          {document.type} - {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-texte-principal/60">Aucun document disponible</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Allergies */}
        <TabsContent value="allergies" className="space-y-4">
          {patient.consultations && patient.consultations.some((c: any) => c.allergies) ? (
            patient.consultations
              .filter((consultation: any) => consultation.allergies)
              .map((consultation: any) => (
                <Card key={consultation.id} className="border-l-4 border-l-red-500">
                  <CardContent className="py-4">
                    <div className="flex items-start space-x-4">
                      <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-red-500 text-white">
                            ⚠️ Allergie détectée
                          </Badge>
                          <span className="text-xs text-texte-principal/60">
                            {new Date(consultation.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-base text-texte-principal font-medium whitespace-pre-wrap">
                          {consultation.allergies}
                        </p>
                        <p className="text-sm text-texte-principal/60 mt-2">
                          Détecté par {consultation.doctor.user.name}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-texte-principal/60">Aucune allergie détectée lors des consultations</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
