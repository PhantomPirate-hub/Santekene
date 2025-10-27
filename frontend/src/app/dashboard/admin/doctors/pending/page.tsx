'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DoctorRequest {
  id: number;
  userId: number;
  speciality: string;
  location: string;
  phone: string;
  user: {
    id: number;
    email: string;
    name: string;
    phone: string;
    createdAt: string;
  };
}

export default function PendingDoctorsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [doctors, setDoctors] = useState<DoctorRequest[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPendingDoctors = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/doctors/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDoctors();
  }, [token]);

  const handleApprove = async (doctorId: number) => {
    try {
      setProcessing(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/doctors/${doctorId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        fetchPendingDoctors();
      } else {
        throw new Error('Erreur lors de l\'approbation');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDoctor || !rejectionReason.trim()) {
      toast.error('Le motif de refus est obligatoire');
      return;
    }

    try {
      setProcessing(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      console.log('🚫 Refus médecin:', {
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.user.name,
        reason: rejectionReason,
        url: `${backendUrl}/api/admin/doctors/${selectedDoctor.id}/reject`
      });
      
      const response = await fetch(
        `${backendUrl}/api/admin/doctors/${selectedDoctor.id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      console.log('📥 Réponse refus:', {
        status: response.status,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Refus réussi:', data);
        toast.success(data.message);
        setShowRejectModal(false);
        setSelectedDoctor(null);
        setRejectionReason('');
        fetchPendingDoctors();
      } else {
        const errorData = await response.json();
        console.error('❌ Erreur refus:', errorData);
        throw new Error(errorData.error || 'Erreur lors du refus');
      }
    } catch (error: any) {
      console.error('❌ Erreur complète refus:', error);
      toast.error(error.message || 'Erreur lors du refus');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-bleu-primaire" />
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
        <h1 className="text-3xl font-bold text-texte-principal">Demandes de médecins</h1>
        <p className="text-texte-principal/70">
          Validez ou refusez les médecins qui souhaitent rejoindre votre structure
        </p>
      </div>

      {doctors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="w-16 h-16 mx-auto text-texte-principal/30 mb-4" />
            <h3 className="text-xl font-semibold text-texte-principal mb-2">
              Aucune demande en attente
            </h3>
            <p className="text-texte-principal/60">
              Il n'y a actuellement aucun médecin en attente de validation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-xl font-semibold text-texte-principal">
                        {doctor.user.name}
                      </h3>
                      <p className="text-texte-principal/70">{doctor.speciality}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-bleu-primaire" />
                        <span className="text-texte-principal">{doctor.user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-bleu-primaire" />
                        <span className="text-texte-principal">{doctor.user.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-bleu-primaire" />
                        <span className="text-texte-principal">
                          Inscrit le {format(new Date(doctor.user.createdAt), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      {doctor.location && (
                        <div className="flex items-center space-x-2">
                          <span className="text-texte-principal">📍 {doctor.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => handleApprove(doctor.id)}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Valider
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setShowRejectModal(true);
                      }}
                      disabled={processing}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de refus */}
      {showRejectModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="bg-red-600 text-white">
              <CardTitle className="flex items-center">
                <XCircle className="w-6 h-6 mr-2" />
                Refuser la demande
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-texte-principal">
                Voulez-vous vraiment refuser la demande de <strong>{selectedDoctor.user.name}</strong> ?
              </p>
              <div>
                <label className="block text-sm font-medium text-texte-principal mb-2">
                  Motif du refus (obligatoire)
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous refusez cette demande..."
                  rows={4}
                  className="w-full"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedDoctor(null);
                    setRejectionReason('');
                  }}
                  disabled={processing}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  variant="destructive"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Confirmer le refus
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
}

