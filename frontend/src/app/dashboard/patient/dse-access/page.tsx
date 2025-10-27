'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  User, 
  Building2,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface AccessRequest {
  id: number;
  status: string;
  reason: string | null;
  createdAt: string;
  expiresAt: string | null;
  doctor: {
    speciality: string;
    structure: string | null;
    location: string | null;
    user: {
      name: string;
      email: string;
    };
  };
}

export default function DseAccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [expiryDays, setExpiryDays] = useState<{ [key: number]: string }>({});
  const { token } = useAuth();

  // Charger les demandes d'accès
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients/me/dse-access-requests', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRequests(data.requests);
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des demandes');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchRequests();
    }
  }, [token]);

  // Répondre à une demande
  const handleRespond = async (requestId: number, action: 'approve' | 'reject') => {
    setProcessing(requestId);
    try {
      const body: any = { action };
      
      // Si approuvé, ajouter la durée d'expiration
      if (action === 'approve') {
        const days = expiryDays[requestId] || '30';
        body.expiresInDays = parseInt(days);
      }

      const response = await fetch(
        `http://localhost:3001/api/patients/dse-access-requests/${requestId}/respond`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du traitement de la demande');
      }

      const data = await response.json();
      toast.success(data.message);

      // Recharger les demandes
      const refreshResponse = await fetch('http://localhost:3001/api/patients/me/dse-access-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setRequests(refreshData.requests);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du traitement');
    } finally {
      setProcessing(null);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bleu-clair mx-auto mb-4"></div>
          <p className="text-texte-principal/60">Chargement...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const processedRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="space-y-6 p-6"
    >
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-texte-principal mb-2 flex items-center gap-2">
          <Shield className="w-8 h-8 text-bleu-clair" />
          Demandes d'accès à mon DSE
        </h1>
        <p className="text-texte-principal/60">
          Gérez les demandes d'accès à votre dossier médical
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{pendingRequests.length}</p>
              <p className="text-sm text-texte-principal/60 mt-1">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {requests.filter(r => r.status === 'APPROVED').length}
              </p>
              <p className="text-sm text-texte-principal/60 mt-1">Approuvées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-bleu-clair">{requests.length}</p>
              <p className="text-sm text-texte-principal/60 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demandes en attente */}
      {pendingRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-texte-principal mb-4">
            Demandes en attente ({pendingRequests.length})
          </h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-2 border-orange-300">
                <CardHeader className="bg-orange-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-600" />
                      Dr. {request.doctor.user.name}
                    </CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <CardDescription>
                    {request.doctor.speciality}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Informations du médecin */}
                  <div className="grid grid-cols-2 gap-4">
                    {request.doctor.structure && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-texte-principal/60 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-texte-principal/60">Structure</p>
                          <p className="text-sm text-texte-principal">{request.doctor.structure}</p>
                        </div>
                      </div>
                    )}
                    {request.doctor.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-texte-principal/60 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-texte-principal/60">Localité</p>
                          <p className="text-sm text-texte-principal">{request.doctor.location}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-texte-principal/60 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-texte-principal/60">Demande faite le</p>
                        <p className="text-sm text-texte-principal">
                          {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Raison */}
                  {request.reason && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-900 mb-1">Raison de la demande</p>
                      <p className="text-sm text-blue-700">{request.reason}</p>
                    </div>
                  )}

                  {/* Durée d'accès */}
                  <div>
                    <label className="text-sm font-medium text-texte-principal mb-2 block">
                      Durée d'accès (si vous approuvez)
                    </label>
                    <Select
                      value={expiryDays[request.id] || '30'}
                      onValueChange={(value) => setExpiryDays({ ...expiryDays, [request.id]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 jours</SelectItem>
                        <SelectItem value="30">30 jours (recommandé)</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                        <SelectItem value="180">180 jours</SelectItem>
                        <SelectItem value="365">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleRespond(request.id, 'reject')}
                      disabled={processing === request.id}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {processing === request.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600 mr-2"></div>
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Refuser
                    </Button>
                    <Button
                      onClick={() => handleRespond(request.id, 'approve')}
                      disabled={processing === request.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing === request.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approuver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Demandes traitées */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-texte-principal mb-4">
            Historique ({processedRequests.length})
          </h2>
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <Card key={request.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Dr. {request.doctor.user.name}
                    </CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <CardDescription>
                    {request.doctor.speciality}
                    {request.doctor.structure && ` • ${request.doctor.structure}`}
                  </CardDescription>
                </CardHeader>
                {request.status === 'APPROVED' && request.expiresAt && (
                  <CardContent>
                    <p className="text-sm text-texte-principal/60">
                      Expire le {new Date(request.expiresAt).toLocaleDateString('fr-FR')}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Aucune demande */}
      {requests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 text-texte-principal/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-texte-principal mb-2">
              Aucune demande d'accès
            </h3>
            <p className="text-texte-principal/60">
              Vous n'avez reçu aucune demande d'accès à votre dossier médical.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Toaster */}
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

