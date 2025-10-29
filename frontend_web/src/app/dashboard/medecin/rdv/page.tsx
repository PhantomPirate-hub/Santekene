'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Video,
  Check,
  X,
  FileText,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CalendarView from '@/components/medecin/CalendarView';

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string;
  bloodGroup: string;
  location: string | null;
}

interface Appointment {
  id: number;
  patient: Patient;
  type: string;
  reason: string | null;
  notes: string | null;
  isVideo: boolean;
  videoLink: string | null;
  videoRoomId: string | null;
  status: string;
  date: string | null;
  createdAt: string;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
}

export default function MedecinRdvPage() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [acceptData, setAcceptData] = useState({ date: '', time: '', notes: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAppointments();
  }, [token, filter]);

  const fetchAppointments = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const filterParam = filter !== 'all' ? `?status=${filter}` : '';
      const response = await fetch(`http://localhost:3001/api/medecin/appointments${filterParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
        setStats(data.stats);
      } else {
        toast.error('Erreur lors du chargement des rendez-vous');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedAppointment || !acceptData.date || !acceptData.time) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      const dateTime = `${acceptData.date}T${acceptData.time}:00`;

      const response = await fetch(
        `http://localhost:3001/api/medecin/appointments/${selectedAppointment.id}/accept`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: dateTime,
            notes: acceptData.notes,
          }),
        }
      );

      if (response.ok) {
        toast.success('Rendez-vous accepté avec succès !');
        setShowAcceptModal(false);
        setAcceptData({ date: '', time: '', notes: '' });
        fetchAppointments();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de l\'acceptation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleReject = async () => {
    if (!selectedAppointment) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/medecin/appointments/${selectedAppointment.id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: rejectReason || 'Aucune raison fournie',
          }),
        }
      );

      if (response.ok) {
        toast.success('Rendez-vous refusé');
        setShowRejectModal(false);
        setRejectReason('');
        fetchAppointments();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors du refus');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleStartVideo = (appointment: Appointment) => {
    if (appointment.videoLink) {
      window.open(appointment.videoLink, '_blank');
    } else {
      toast.error('Lien de visioconférence non disponible');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'En attente', color: 'bg-yellow-500' },
      CONFIRMED: { label: 'Confirmé', color: 'bg-green-500' },
      REJECTED: { label: 'Refusé', color: 'bg-red-500' },
      CANCELLED: { label: 'Annulé', color: 'bg-gray-500' },
      COMPLETED: { label: 'Terminé', color: 'bg-blue-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-500' };

    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

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

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div>
        <h1 className="text-3xl font-bold text-texte-principal mb-2">
          Mes Rendez-vous
        </h1>
        <p className="text-texte-principal/60">
          Gérez vos demandes de rendez-vous et votre planning
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
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-texte-principal/60 mt-1">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              <p className="text-sm text-texte-principal/60 mt-1">Confirmés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
              <p className="text-sm text-texte-principal/60 mt-1">Terminés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="PENDING">En attente</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Confirmés</TabsTrigger>
          <TabsTrigger value="COMPLETED">Terminés</TabsTrigger>
          <TabsTrigger value="REJECTED">Refusés</TabsTrigger>
          <TabsTrigger value="CALENDAR">📅 Calendrier</TabsTrigger>
        </TabsList>

        {/* Vue Calendrier */}
        <TabsContent value="CALENDAR" className="mt-4">
          <CalendarView
            appointments={appointments.filter((apt) => apt.status === 'CONFIRMED' && apt.date)}
            onAppointmentClick={setSelectedAppointment}
          />
        </TabsContent>

        {/* Liste des rendez-vous */}
        {filter !== 'CALENDAR' && (
          <TabsContent value={filter} className="space-y-4 mt-4">
            {filteredAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-texte-principal/60">Aucun rendez-vous dans cette catégorie</p>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-bleu-clair/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-bleu-clair" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-texte-principal">
                            {appointment.patient.name}
                          </h3>
                          {getStatusBadge(appointment.status)}
                          {appointment.isVideo && (
                            <Badge className="bg-purple-500 text-white">
                              <Video className="w-3 h-3 mr-1" />
                              Visio
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-texte-principal/70">
                          {appointment.patient.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{appointment.patient.phone}</span>
                            </div>
                          )}
                          {appointment.patient.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>{appointment.patient.email}</span>
                            </div>
                          )}
                          {appointment.patient.age && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>{appointment.patient.age} ans - {appointment.patient.gender}</span>
                            </div>
                          )}
                          {appointment.patient.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{appointment.patient.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {appointment.date && (
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-sm text-texte-principal">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(appointment.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-texte-principal/60 mt-1">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(appointment.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Détails */}
                  <div className="border-t pt-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-texte-principal/60">Type</p>
                        <p className="font-medium text-texte-principal">{appointment.type}</p>
                      </div>
                      {appointment.patient.bloodGroup && (
                        <div>
                          <p className="text-texte-principal/60">Groupe sanguin</p>
                          <p className="font-medium text-texte-principal">{appointment.patient.bloodGroup}</p>
                        </div>
                      )}
                    </div>

                    {appointment.reason && (
                      <div className="mt-3">
                        <p className="text-texte-principal/60 text-sm mb-1">Motif</p>
                        <p className="text-texte-principal">{appointment.reason}</p>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mt-3">
                        <p className="text-texte-principal/60 text-sm mb-1">Notes</p>
                        <p className="text-texte-principal">{appointment.notes}</p>
                      </div>
                    )}

                    {appointment.rejectedReason && (
                      <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800 text-sm">Raison du refus</p>
                            <p className="text-red-700 text-sm">{appointment.rejectedReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    {appointment.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowAcceptModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accepter
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowRejectModal(true);
                          }}
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Refuser
                        </Button>
                      </>
                    )}
                    {appointment.status === 'CONFIRMED' && appointment.isVideo && appointment.videoLink && (
                      <Button
                        onClick={() => handleStartVideo(appointment)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Lancer la visio
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </TabsContent>
        )}
      </Tabs>

      {/* Modal Accepter */}
      {showAcceptModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Accepter le rendez-vous</span>
              </CardTitle>
              <CardDescription>
                Patient : <strong>{selectedAppointment.patient.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="date">Date du rendez-vous *</Label>
                <Input
                  id="date"
                  type="date"
                  value={acceptData.date}
                  onChange={(e) => setAcceptData({ ...acceptData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="time">Heure du rendez-vous *</Label>
                <Input
                  id="time"
                  type="time"
                  value={acceptData.time}
                  onChange={(e) => setAcceptData({ ...acceptData, time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={acceptData.notes}
                  onChange={(e) => setAcceptData({ ...acceptData, notes: e.target.value })}
                  placeholder="Instructions pour le patient..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              {selectedAppointment.isVideo && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Video className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-purple-900 text-sm">Consultation en visioconférence</p>
                      <p className="text-purple-700 text-sm">
                        Un lien sécurisé sera généré automatiquement pour cette consultation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  onClick={handleAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Confirmer
                </Button>
                <Button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setAcceptData({ date: '', time: '', notes: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Refuser */}
      {showRejectModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-600" />
                <span>Refuser le rendez-vous</span>
              </CardTitle>
              <CardDescription>
                Patient : <strong>{selectedAppointment.patient.name}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reason">Raison du refus (optionnel)</Label>
                <Textarea
                  id="reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous refusez ce rendez-vous..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmer le refus
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

