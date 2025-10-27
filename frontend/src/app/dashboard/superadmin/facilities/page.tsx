'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Check,
  X,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FacilityRequest {
  id: number;
  facilityName: string;
  facilityType: string;
  facilityAddress: string;
  facilityCity: string;
  facilityPhone: string;
  facilityEmail: string;
  responsibleName: string;
  responsiblePosition: string;
  responsiblePhone: string;
  responsibleEmail: string;
  documentUrl: string | null;
  documentType: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  approvedBySuperAdmin: any;
}

export default function FacilitiesPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<FacilityRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<FacilityRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [token]);

  // Fonction pour télécharger le document
  const downloadDocument = (documentUrl: string, facilityName: string, documentType?: string | null) => {
    if (!documentUrl) {
      toast.error('Aucun document disponible');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = documentUrl.startsWith('data:') ? documentUrl : `data:application/pdf;base64,${documentUrl}`;
      link.download = `${facilityName}_${documentType || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Téléchargement lancé');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/superadmin/facility-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    console.log('🎯 BOUTON CLIQUÉ - handleApprove appelé');
    
    if (!selectedRequest) {
      console.error('❌ Aucune requête sélectionnée');
      return;
    }

    try {
      setProcessing(true);
      console.log('🔄 État processing mis à true');
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      console.log('🔄 Approbation structure:', {
        requestId: selectedRequest.id,
        facilityName: selectedRequest.facilityName,
        url: `${backendUrl}/api/superadmin/facility-requests/${selectedRequest.id}/approve`,
        hasToken: !!token
      });
      
      const response = await fetch(
        `${backendUrl}/api/superadmin/facility-requests/${selectedRequest.id}/approve`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📥 Réponse serveur:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Structure approuvée:', data);
        toast.success(data.message || 'Demande approuvée avec succès');
        setShowApproveModal(false);
        setSelectedRequest(null);
        await fetchRequests(); // Attendre le rechargement
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur approbation:', errorData);
        throw new Error(errorData.error || 'Erreur lors de l\'approbation');
      }
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      toast.error(error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Le motif de refus est obligatoire');
      return;
    }

    try {
      setProcessing(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(
        `${backendUrl}/api/superadmin/facility-requests/${selectedRequest.id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (response.ok) {
        toast.success('Demande refusée');
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        fetchRequests();
      } else {
        throw new Error('Erreur lors du refus');
      }
    } catch (error) {
      toast.error('Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-orange-500"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approuvée</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Refusée</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fond p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-bleu-principal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-purple-600" />
            Demandes de Structures de Santé
          </h1>
          <p className="text-texte-principal/60 mt-2">
            Gérer les demandes d'inscription des hôpitaux, cliniques et centres de santé
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-texte-principal">{stats.total}</p>
                <p className="text-sm text-texte-principal/60 mt-1">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-sm text-texte-principal/60 mt-1">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-texte-principal/60 mt-1">Approuvées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-texte-principal/60 mt-1">Refusées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="PENDING">En attente</TabsTrigger>
            <TabsTrigger value="APPROVED">Approuvées</TabsTrigger>
            <TabsTrigger value="REJECTED">Refusées</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6 space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                  <p className="text-texte-principal/60">Aucune demande dans cette catégorie</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-texte-principal">
                            {request.facilityName}
                          </h3>
                          {getStatusBadge(request.status)}
                          <Badge variant="outline">{request.facilityType}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2 text-texte-principal/70">
                            <MapPin className="w-4 h-4" />
                            <span>{request.facilityAddress}, {request.facilityCity}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-texte-principal/70">
                            <Phone className="w-4 h-4" />
                            <span>{request.facilityPhone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-texte-principal/70">
                            <Mail className="w-4 h-4" />
                            <span>{request.facilityEmail}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-texte-principal/70">
                            <User className="w-4 h-4" />
                            <span>{request.responsibleName} ({request.responsiblePosition})</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-texte-principal/50">
                          Demande créée le {new Date(request.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApproveModal(false);
                            setShowRejectModal(false);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>

                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveModal(true);
                              }}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Refuser
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {request.documentUrl && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-texte-principal">
                            Document: {request.documentType || 'Document de validation'}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadDocument(request.documentUrl!, request.facilityName, request.documentType)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    )}

                    {request.status === 'REJECTED' && request.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-semibold text-red-600">Motif de refus :</p>
                        <p className="text-sm text-texte-principal mt-1">{request.rejectionReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Modal d'approbation */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader className="bg-green-600 text-white">
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  Approuver la demande
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-texte-principal mb-4">
                  Voulez-vous vraiment approuver la demande de <strong>{selectedRequest.facilityName}</strong> ?
                </p>
                <p className="text-sm text-texte-principal/60 mb-6">
                  Un email de confirmation sera envoyé à {selectedRequest.responsibleEmail}.
                </p>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedRequest(null);
                    }}
                    disabled={processing}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirmer l'approbation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de refus */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader className="bg-red-600 text-white">
                <CardTitle className="flex items-center">
                  <XCircle className="w-6 h-6 mr-2" />
                  Refuser la demande
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-texte-principal mb-4">
                  Refuser la demande de <strong>{selectedRequest.facilityName}</strong>
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-texte-principal mb-2">
                    Motif du refus (obligatoire) *
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Expliquez la raison du refus (sera envoyé par email)"
                    rows={4}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedRequest(null);
                      setRejectionReason('');
                    }}
                    disabled={processing}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Confirmer le refus
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

