'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  User, 
  Phone, 
  Mail,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface Patient {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  birthDate: string | null;
  bloodGroup: string | null;
}

interface AccessRequest {
  id: number;
  status: string;
  reason: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface SearchResult {
  patient: Patient;
  accessRequest: AccessRequest | null;
}

export default function MedecinConsultationsPage() {
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  // Rechercher un patient par téléphone
  const handleSearch = async () => {
    if (!phoneSearch.trim()) {
      toast.error('Veuillez entrer un numéro de téléphone');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/medecin/search-patient?phone=${encodeURIComponent(phoneSearch)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la recherche');
      }

      const data = await response.json();
      setSearchResult(data);
      toast.success('Patient trouvé !');
    } catch (error: any) {
      toast.error(error.message || 'Aucun patient trouvé avec ce numéro');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Demander l'accès au DSE
  const handleRequestAccess = async () => {
    if (!searchResult) return;

    setRequesting(true);
    try {
      const response = await fetch('http://localhost:3001/api/medecin/dse-access/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: searchResult.patient.id,
          reason: 'Consultation médicale',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la demande');
      }

      const data = await response.json();
      toast.success('Demande d\'accès envoyée au patient');
      
      // Rafraîchir la recherche pour voir le nouveau statut
      handleSearch();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la demande d\'accès');
    } finally {
      setRequesting(false);
    }
  };

  // Accéder au DSE du patient
  const handleAccessDse = () => {
    if (!searchResult) return;
    router.push(`/dashboard/medecin/dse/${searchResult.patient.id}`);
  };

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-orange-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Refusé
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge className="bg-gray-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expiré
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="space-y-6 p-6"
    >
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-texte-principal mb-2">Consultations</h1>
        <p className="text-texte-principal/60">
          Recherchez un patient pour démarrer une consultation
        </p>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-bleu-clair" />
            Rechercher un patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="tel"
                placeholder="+223 76 12 34 56"
                value={phoneSearch}
                onChange={(e) => setPhoneSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-lg"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultat de la recherche */}
      {searchResult && (
        <Card className="border-2 border-bleu-clair/30">
          <CardHeader className="bg-bleu-clair/10">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-bleu-clair" />
                Patient trouvé
              </div>
              {searchResult.accessRequest && getStatusBadge(searchResult.accessRequest.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Informations du patient */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-texte-principal/60 mb-1">Nom complet</p>
                <p className="text-lg font-semibold text-texte-principal">{searchResult.patient.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-texte-principal/60 mb-1">Groupe sanguin</p>
                <p className="text-lg font-semibold text-texte-principal">
                  {searchResult.patient.bloodGroup || 'Non spécifié'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-texte-principal/60 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Téléphone
                </p>
                <p className="text-texte-principal">{searchResult.patient.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-texte-principal/60 mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </p>
                <p className="text-texte-principal">{searchResult.patient.email}</p>
              </div>
              {searchResult.patient.birthDate && (
                <div>
                  <p className="text-sm font-medium text-texte-principal/60 mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Date de naissance
                  </p>
                  <p className="text-texte-principal">
                    {new Date(searchResult.patient.birthDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>

            {/* Statut de la demande */}
            {searchResult.accessRequest ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-1">
                      Statut de la demande d'accès
                    </p>
                    {searchResult.accessRequest.status === 'PENDING' && (
                      <p className="text-sm text-blue-700">
                        Votre demande est en attente de validation par le patient.
                      </p>
                    )}
                    {searchResult.accessRequest.status === 'APPROVED' && (
                      <p className="text-sm text-blue-700">
                        Vous avez accès au DSE de ce patient.
                        {searchResult.accessRequest.expiresAt && (
                          <span className="block mt-1">
                            Expire le {new Date(searchResult.accessRequest.expiresAt).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </p>
                    )}
                    {searchResult.accessRequest.status === 'REJECTED' && (
                      <p className="text-sm text-red-700">
                        Le patient a refusé votre demande d'accès.
                      </p>
                    )}
                    {searchResult.accessRequest.status === 'EXPIRED' && (
                      <p className="text-sm text-gray-700">
                        Votre accès a expiré. Vous pouvez faire une nouvelle demande.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-orange-900 mb-1">
                      Accès au DSE requis
                    </p>
                    <p className="text-sm text-orange-700">
                      Vous devez demander l'autorisation au patient pour accéder à son dossier médical.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              {!searchResult.accessRequest || 
               searchResult.accessRequest.status === 'REJECTED' || 
               searchResult.accessRequest.status === 'EXPIRED' ? (
                <Button
                  onClick={handleRequestAccess}
                  disabled={requesting}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
                >
                  {requesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Demander l'accès au DSE
                    </>
                  )}
                </Button>
              ) : searchResult.accessRequest.status === 'APPROVED' ? (
                <Button
                  onClick={handleAccessDse}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Consulter le DSE et créer une consultation
                </Button>
              ) : (
                <Button disabled className="flex-1 opacity-50">
                  <Clock className="w-4 h-4 mr-2" />
                  En attente de validation du patient
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toaster pour les notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </motion.div>
  );
}

