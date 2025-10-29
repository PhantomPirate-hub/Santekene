'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Search, Calendar, User, Pill, AlertCircle, Eye } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: string;
  date: string;
  doctor: {
    name: string;
    specialty: string;
  };
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

const PatientPrescriptionsPage = () => {
  const { token } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [token]);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 Appel API ordonnances...');
      console.log('🔑 Token:', token ? 'Présent' : 'Absent');
      
      const response = await fetch('http://localhost:3001/api/patients/prescriptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 Statut réponse:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la récupération des ordonnances');
      }

      const data = await response.json();
      console.log('✅ Données reçues:', data);
      console.log('📋 Nombre d\'ordonnances:', data.prescriptions?.length || 0);
      
      setPrescriptions(data.prescriptions || []);
    } catch (err: any) {
      console.error('❌ Erreur fetch:', err);
      setError(err.message || 'Impossible de charger vos ordonnances.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medications.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-300' },
      COMPLETED: { label: 'Terminée', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE;
    return (
      <Badge className={`${config.color} border`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              Mes Ordonnances
            </h1>
            <p className="text-gray-600 mt-1">
              Consultez l'historique de vos prescriptions médicales
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-green-600">{prescriptions.length}</p>
          </div>
        </div>

        {/* Barre de recherche */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Rechercher par médecin, diagnostic ou médicament..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border-2 border-gray-200 rounded-xl focus:border-green-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Erreur */}
        {error && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Erreur</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des ordonnances */}
        {filteredPrescriptions.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm ? 'Aucune ordonnance trouvée' : 'Aucune ordonnance'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Essayez avec d\'autres mots-clés' 
                  : 'Vos ordonnances médicales apparaîtront ici'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          Ordonnance du {new Date(prescription.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </CardTitle>
                        {getStatusBadge(prescription.status)}
                      </div>
                      <CardDescription className="flex items-center gap-4 text-base">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {prescription.doctor.name} - {prescription.doctor.specialty}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPrescription(
                          selectedPrescription?.id === prescription.id ? null : prescription
                        )}
                        className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {selectedPrescription?.id === prescription.id ? 'Masquer' : 'Voir'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Diagnostic */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Diagnostic</h4>
                    <p className="text-blue-800">{prescription.diagnosis}</p>
                  </div>

                  {/* Détails complets si sélectionné */}
                  {selectedPrescription?.id === prescription.id && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      {/* Médicaments */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Pill className="w-5 h-5 text-green-600" />
                          Médicaments prescrits ({prescription.medications.length})
                        </h4>
                        <div className="space-y-3">
                          {prescription.medications.map((med, idx) => (
                            <div key={idx} className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-bold text-gray-900 text-lg">{med.name}</h5>
                                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Dosage:</span>
                                      <p className="font-semibold text-gray-900">{med.dosage}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Fréquence:</span>
                                      <p className="font-semibold text-gray-900">{med.frequency}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Durée:</span>
                                      <p className="font-semibold text-gray-900">{med.duration}</p>
                                    </div>
                                  </div>
                                  {med.instructions && (
                                    <p className="mt-2 text-sm text-gray-600 italic">
                                      ℹ️ {med.instructions}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes du médecin */}
                      {prescription.notes && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-yellow-900 text-sm mb-2">
                            📝 Notes du médecin
                          </h4>
                          <p className="text-yellow-800 text-sm">{prescription.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aperçu médicaments si non sélectionné */}
                  {selectedPrescription?.id !== prescription.id && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Pill className="w-4 h-4" />
                      <span>{prescription.medications.length} médicament(s) prescrit(s)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info box */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">💊 Conseils importants</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Respectez toujours la posologie prescrite par votre médecin</li>
                  <li>Ne partagez jamais vos médicaments avec d'autres personnes</li>
                  <li>En cas de doute, contactez votre médecin ou pharmacien</li>
                  <li>Conservez vos ordonnances dans un endroit sûr</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientPrescriptionsPage;
