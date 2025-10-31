'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  XCircle,
  CalendarPlus,
  X,
  Video
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast, { Toaster } from 'react-hot-toast';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface Appointment {
  id: number;
  date: string | null; // Date proposée par le médecin (peut être null)
  type: string;
  status: string;
  reason?: string;
  notes?: string;
  isVideo?: boolean;
  videoLink?: string;
  location?: string;
  doctor: {
    user: {
      name: string;
      email: string;
      phone?: string;
    };
    speciality: string;
    structure?: string;
    location?: string;
    phone?: string;
  };
}

interface Doctor {
  id: number;
  speciality: string;
  licenseNumber: string;
  structure?: string;
  location?: string;
  phone?: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const { token } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null); // Nouveau : pour garder les infos du médecin

  // États du formulaire (sans date/heure - le médecin les choisira)
  const [formData, setFormData] = useState({
    doctorId: '',
    type: 'Consultation générale',
    reason: '',
    notes: '',
    isVideo: false,
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients/me/appointments', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des rendez-vous');
        }

        const data = await response.json();
        setAppointments(data);
      } catch (err: any) {
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAppointments();
    }
  }, [token]);

  // Récupérer la liste des médecins
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/patients/doctors', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDoctors(data);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des médecins:', err);
      }
    };

    if (token && isModalOpen) {
      fetchDoctors();
    }
  }, [token, isModalOpen]);

  // États pour la modification
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  // Le patient peut seulement modifier le motif, les notes et l'option visio
  const [editFormData, setEditFormData] = useState({
    reason: '',
    notes: '',
    isVideo: false,
  });

  // Fonctions du formulaire de création
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si on change de médecin, mettre à jour le médecin sélectionné
    if (field === 'doctorId' && typeof value === 'string') {
      const selected = doctors.find(d => d.id.toString() === value);
      setSelectedDoctor(selected || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validation
      if (!formData.doctorId || !formData.type || !formData.reason) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        setFormLoading(false);
        return;
      }

      const requestBody = {
        doctorId: parseInt(formData.doctorId),
        type: formData.type,
        reason: formData.reason,
        notes: formData.notes,
        isVideo: formData.isVideo,
      };

      console.log('🔍 Demande de RDV envoyée:', requestBody);

      const response = await fetch('http://localhost:3001/api/patients/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur backend:', errorData);
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}` 
          : errorData.error || 'Erreur lors de la création du rendez-vous';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('RDV créé avec succès:', data);

      // Rafraîchir la liste des rendez-vous
      const refreshResponse = await fetch('http://localhost:3001/api/patients/me/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setAppointments(refreshedData);
      }

      // Réinitialiser le formulaire et fermer le modal
      setFormData({
        doctorId: '',
        type: 'Consultation générale',
        reason: '',
        notes: '',
        isVideo: false,
      });
      setSelectedDoctor(null);
      setIsModalOpen(false);
      toast.success(data.message || 'Demande de rendez-vous envoyée avec succès !');
    } catch (err: any) {
      console.error('Erreur complète:', err);
      toast.error(err.message || 'Erreur lors de la création du rendez-vous');
    } finally {
      setFormLoading(false);
    }
  };

  // Annuler un rendez-vous
  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/patients/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'annulation');
      }

      // Rafraîchir la liste
      const refreshResponse = await fetch('http://localhost:3001/api/patients/me/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setAppointments(refreshedData);
      }

      toast.success('Rendez-vous annulé avec succès !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'annulation du rendez-vous');
    }
  };

  // Ouvrir le modal de modification
  const handleOpenEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    
    // Le patient peut seulement modifier le motif, les notes et l'option visio
    setEditFormData({
      reason: appointment.reason || '',
      notes: appointment.notes || '',
      isVideo: appointment.isVideo || false,
    });
    setIsEditModalOpen(true);
  };

  // Soumettre la modification
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    setFormLoading(true);

    try {
      // Validation simplifiée (juste le motif est requis)
      if (!editFormData.reason) {
        toast.error('Le motif de consultation est requis');
        setFormLoading(false);
        return;
      }

      console.log('Modification du RDV (patient):', {
        id: editingAppointment.id,
        reason: editFormData.reason,
        notes: editFormData.notes,
        isVideo: editFormData.isVideo,
      });

      const response = await fetch(`http://localhost:3001/api/patients/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Le patient peut seulement modifier ces 3 champs
          reason: editFormData.reason,
          notes: editFormData.notes,
          isVideo: editFormData.isVideo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur backend:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la modification');
      }

      const result = await response.json();
      console.log('RDV modifié avec succès:', result);

      // Rafraîchir la liste
      const refreshResponse = await fetch('http://localhost:3001/api/patients/me/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setAppointments(refreshedData);
      }

      setIsEditModalOpen(false);
      setEditingAppointment(null);
      toast.success('Rendez-vous modifié avec succès !');
    } catch (err: any) {
      console.error('Erreur complète:', err);
      toast.error(err.message || 'Erreur lors de la modification du rendez-vous');
    } finally {
      setFormLoading(false);
    }
  };

  // Séparer les RDV à venir et passés
  const today = new Date();
  const upcomingAppointments = appointments.filter(apt => 
    // Inclure les RDV sans date (demandes en attente) et ceux à venir
    (!apt.date || new Date(apt.date) >= today) && (apt.status === 'PENDING' || apt.status === 'CONFIRMED')
  );
  const pastAppointments = appointments.filter(apt => 
    (apt.date && new Date(apt.date) < today) || apt.status === 'COMPLETED' || apt.status === 'CANCELLED'
  );

  // Fonction pour formater la date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date à confirmer par le médecin';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Fonction pour formater l'heure
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Heure à définir';
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      PENDING: { 
        label: 'En attente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock
      },
      CONFIRMED: { 
        label: 'Confirmé', 
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle
      },
      COMPLETED: { 
        label: 'Terminé', 
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle
      },
      CANCELLED: { 
        label: 'Annulé', 
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} border flex items-center space-x-1`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  // Composant carte de rendez-vous
  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const isPast = (appointment.date && new Date(appointment.date) < today) || 
                   appointment.status === 'COMPLETED' || 
                   appointment.status === 'CANCELLED';

    return (
      <Card className={`${isPast ? 'opacity-75' : ''} hover:shadow-lg transition-shadow`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="w-5 h-5 text-bleu-clair" />
                <span>{appointment.doctor.user.name}</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {appointment.doctor.speciality}
              </CardDescription>
            </div>
            {getStatusBadge(appointment.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date et heure */}
          <div className="flex items-start space-x-3 bg-bleu-clair/5 p-3 rounded-lg">
            <Calendar className="w-5 h-5 text-bleu-clair mt-0.5" />
            <div>
              <p className="font-medium text-texte-principal capitalize">
                {formatDate(appointment.date)}
              </p>
              <p className="text-sm text-texte-principal/60 flex items-center mt-1">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(appointment.date)}
              </p>
            </div>
          </div>

          {/* Type de consultation */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Badge variant="outline" className="bg-orange-kene/10 text-orange-kene border-orange-kene/30">
              {appointment.type}
            </Badge>
            {appointment.isVideo && (
              <Badge className="bg-blue-500 text-white border-blue-600 flex items-center gap-1">
                <Video className="w-3 h-3" />
                Visio
              </Badge>
            )}
          </div>

          {/* Raison */}
          {appointment.reason && (
            <div className="border-l-4 border-bleu-clair pl-3">
              <p className="text-sm font-medium text-texte-principal/60">Motif</p>
              <p className="text-sm text-texte-principal mt-1">{appointment.reason}</p>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-texte-principal/60 mb-1">Notes</p>
              <p className="text-sm text-texte-principal">{appointment.notes}</p>
            </div>
          )}

          {/* Informations du médecin */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-900 mb-2">📋 Informations du médecin</p>
            
            {/* Structure de santé */}
            {appointment.doctor.structure && (
              <div className="flex items-start space-x-2 text-sm">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-900">{appointment.doctor.structure}</p>
                  {appointment.doctor.location && (
                    <p className="text-blue-700">{appointment.doctor.location}</p>
                  )}
                </div>
              </div>
            )}

            {/* Contact */}
            {appointment.doctor.phone && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-blue-600" />
                <a href={`tel:${appointment.doctor.phone}`} className="text-blue-700 hover:text-blue-900 hover:underline">
                  {appointment.doctor.phone}
                </a>
              </div>
            )}

            {/* Email */}
            {appointment.doctor.user.email && (
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <a href={`mailto:${appointment.doctor.user.email}`} className="text-blue-700 hover:text-blue-900 hover:underline">
                  {appointment.doctor.user.email}
                </a>
              </div>
            )}
          </div>

          {/* Lieu (si différent de la structure) */}
          {appointment.location && (
            <div className="flex items-start space-x-2 text-sm text-texte-principal/60">
              <MapPin className="w-4 h-4 mt-0.5" />
              <span>{appointment.location}</span>
            </div>
          )}

          {/* Visioconférence */}
          {appointment.isVideo && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Video className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-blue-900">Consultation en visioconférence</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {appointment.status === 'CONFIRMED' 
                        ? appointment.videoLink 
                          ? "Le lien de visio sera disponible ici"
                          : "En attente de validation du médecin"
                        : appointment.status === 'PENDING'
                          ? "En attente d'acceptation du médecin"
                          : "Consultation en visio demandée"
                      }
                    </p>
                  </div>
                </div>
                {appointment.status === 'CONFIRMED' && appointment.videoLink && (
                  <Button
                    onClick={() => window.open(appointment.videoLink, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Rejoindre
                  </Button>
                )}
                {appointment.status === 'CONFIRMED' && !appointment.videoLink && (
                  <Button
                    onClick={() => {
                      const roomName = `santekene-rdv-${appointment.id}`;
                      const jitsiUrl = `https://meet.jit.si/${roomName}`;
                      window.open(jitsiUrl, '_blank');
                      toast.success('Lien de visio généré ! Partagez-le avec votre médecin.');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    Test Visio
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Contact médecin */}
          <div className="pt-3 border-t space-y-2">
            <p className="text-xs font-medium text-texte-principal/60">Contact du médecin</p>
            <div className="flex flex-wrap gap-3">
              {appointment.doctor.user.email && (
                <a 
                  href={`mailto:${appointment.doctor.user.email}`}
                  className="flex items-center space-x-1 text-sm text-bleu-clair hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  <span>{appointment.doctor.user.email}</span>
                </a>
              )}
              {appointment.doctor.user.phone && (
                <a 
                  href={`tel:${appointment.doctor.user.phone}`}
                  className="flex items-center space-x-1 text-sm text-bleu-clair hover:underline"
                >
                  <Phone className="w-4 h-4" />
                  <span>{appointment.doctor.user.phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isPast && appointment.status === 'PENDING' && (
            <div className="pt-3 border-t flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleCancelAppointment(appointment.id)}
              >
                Annuler
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-bleu-clair border-bleu-clair hover:bg-bleu-clair/10"
                onClick={() => handleOpenEditModal(appointment)}
              >
                Modifier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bleu-clair mx-auto mb-4"></div>
          <p className="text-texte-principal/60">Chargement de vos rendez-vous...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
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

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blanc-pur border-green-200">
        <CardContent className="py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-texte-principal flex items-center">
                <Calendar className="w-8 h-8 mr-3 text-green-600" />
                Mes Rendez-vous
              </h1>
              <p className="text-texte-principal/60 mt-2">
                Gérez vos rendez-vous médicaux et consultez votre historique
              </p>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-blanc-pur shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6 text-base"
              onClick={() => setIsModalOpen(true)}
              size="lg"
            >
              <CalendarPlus className="w-5 h-5 mr-2" />
              Nouveau Rendez-vous
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-texte-principal/60">À venir</p>
                <p className="text-3xl font-bold text-bleu-clair">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-bleu-clair/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-texte-principal/60">Terminés</p>
                <p className="text-3xl font-bold text-green-600">
                  {pastAppointments.filter(a => a.status === 'COMPLETED').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-texte-principal/60">Total</p>
                <p className="text-3xl font-bold text-texte-principal">{appointments.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-texte-principal/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            À venir ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Historique ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        {/* Rendez-vous à venir */}
        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingAppointments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-lg font-medium text-texte-principal/60">
                  Aucun rendez-vous à venir
                </p>
                <p className="text-sm text-texte-principal/40 mt-2">
                  Prenez rendez-vous avec un médecin pour commencer
                </p>
                <Button className="mt-4 bg-bleu-clair hover:bg-bleu-clair/90 text-blanc-pur">
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Prendre un rendez-vous
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Historique */}
        <TabsContent value="past" className="space-y-4 mt-6">
          {pastAppointments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pastAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-lg font-medium text-texte-principal/60">
                  Aucun rendez-vous passé
                </p>
                <p className="text-sm text-texte-principal/40 mt-2">
                  Votre historique de rendez-vous apparaîtra ici
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de prise de rendez-vous */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blanc-pur rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header du modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-texte-principal flex items-center">
                    <CalendarPlus className="w-6 h-6 mr-3 text-bleu-clair" />
                    Prendre un rendez-vous
                  </h2>
                  <p className="text-texte-principal/60 mt-1">
                    Remplissez le formulaire pour demander un rendez-vous
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-texte-principal/60 hover:text-texte-principal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sélection du médecin */}
                <div>
                  <Label htmlFor="doctor">Médecin *</Label>
                  {doctors.length === 0 ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Aucun médecin disponible. Veuillez exécuter le seed de la base de données.
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={formData.doctorId}
                      onValueChange={(value) => handleInputChange('doctorId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un médecin" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">Aucun médecin disponible</div>
                        ) : (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                              <div className="flex flex-col">
                                <span className="font-medium">{doctor.user.name}</span>
                                <span className="text-xs text-gray-600">
                                  {doctor.speciality}
                                  {doctor.structure && ` • ${doctor.structure}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Afficher les détails du médecin sélectionné */}
                  {selectedDoctor && (
                    <Card className="mt-3 border-blue-200 bg-blue-50">
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-texte-principal">
                              {selectedDoctor.user.name}
                            </p>
                            <p className="text-sm text-texte-principal/70">
                              {selectedDoctor.speciality}
                            </p>
                            {selectedDoctor.structure && (
                              <div className="flex items-center space-x-1 mt-1 text-xs text-texte-principal/60">
                                <MapPin className="w-3 h-3" />
                                <span>{selectedDoctor.structure}</span>
                                {selectedDoctor.location && <span> - {selectedDoctor.location}</span>}
                              </div>
                            )}
                            {selectedDoctor.phone && (
                              <div className="flex items-center space-x-1 mt-0.5 text-xs text-green-600">
                                <Phone className="w-3 h-3" />
                                <span>{selectedDoctor.phone}</span>
                              </div>
                            )}
                            {selectedDoctor.user.email && (
                              <div className="flex items-center space-x-1 mt-0.5 text-xs text-texte-principal/60">
                                <Mail className="w-3 h-3" />
                                <span>{selectedDoctor.user.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <p className="text-xs text-texte-principal/60 mt-1">
                    {doctors.length} médecin(s) disponible(s)
                  </p>
                </div>

                {/* Information importante */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        📅 Date et heure à confirmer
                      </h4>
                      <p className="text-sm text-blue-700">
                        Vous faites une demande de rendez-vous. Le médecin vous proposera une date et une heure disponibles qui vous conviendront.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Type de consultation */}
                <div>
                  <Label htmlFor="type">Type de consultation *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation générale">Consultation générale</SelectItem>
                      <SelectItem value="Consultation de suivi">Consultation de suivi</SelectItem>
                      <SelectItem value="Urgence">Urgence</SelectItem>
                      <SelectItem value="Téléconsultation">Téléconsultation</SelectItem>
                      <SelectItem value="Vaccination">Vaccination</SelectItem>
                      <SelectItem value="Examen médical">Examen médical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Motif */}
                <div>
                  <Label htmlFor="reason">Motif de la consultation *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Décrivez brièvement le motif de votre consultation..."
                    rows={3}
                    required
                  />
                </div>

                {/* Option Visioconférence */}
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <input
                    type="checkbox"
                    id="isVideo"
                    checked={formData.isVideo}
                    onChange={(e) => handleInputChange('isVideo', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <Label htmlFor="isVideo" className="cursor-pointer text-blue-900 font-medium flex items-center gap-2">
                    <span className="text-2xl">📹</span>
                    Consultation en visioconférence
                    <span className="text-sm font-normal text-blue-700">(sous réserve d'acceptation du médecin)</span>
                  </Label>
                </div>

                {/* Notes additionnelles */}
                <div>
                  <Label htmlFor="notes">Notes additionnelles (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Informations complémentaires..."
                    rows={2}
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsModalOpen(false)}
                    disabled={formLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-blanc-pur"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blanc-pur mr-2"></div>
                        Envoi en cours...
                      </div>
                    ) : (
                      <>
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Confirmer le rendez-vous
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de modification */}
      {isEditModalOpen && editingAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blanc-pur rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header du modal */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-texte-principal flex items-center">
                    <Calendar className="w-6 h-6 mr-3 text-bleu-clair" />
                    Modifier le rendez-vous
                  </h2>
                  <p className="text-texte-principal/60 mt-1">
                    Avec {editingAppointment.doctor.user.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-texte-principal/60 hover:text-texte-principal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Information sur ce qui est modifiable */}
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-orange-900 mb-1">
                        ℹ️ Informations modifiables
                      </h4>
                      <p className="text-sm text-orange-700">
                        Vous pouvez modifier le motif, les notes et l'option visio. La date, l'heure et le type sont fixés par le médecin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informations non modifiables */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Médecin</p>
                    <p className="font-medium text-gray-900">{editingAppointment.doctor.user.name}</p>
                    <p className="text-sm text-gray-600">{editingAppointment.doctor.speciality}</p>
                  </div>
                  {editingAppointment.date && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Date et heure</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(editingAppointment.date)} à {formatTime(editingAppointment.date)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Type de consultation</p>
                    <p className="font-medium text-gray-900">{editingAppointment.type}</p>
                  </div>
                </div>

                {/* Motif */}
                <div>
                  <Label htmlFor="edit-reason">Motif de la consultation *</Label>
                  <Textarea
                    id="edit-reason"
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Décrivez brièvement le motif de votre consultation..."
                    rows={3}
                    required
                  />
                </div>

                {/* Option Visioconférence */}
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <input
                    type="checkbox"
                    id="edit-isVideo"
                    checked={editFormData.isVideo}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, isVideo: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <Label htmlFor="edit-isVideo" className="cursor-pointer text-blue-900 font-medium flex items-center gap-2">
                    <span className="text-2xl">📹</span>
                    Consultation en visioconférence
                    <span className="text-sm font-normal text-blue-700">(sous réserve d'acceptation du médecin)</span>
                  </Label>
                </div>

                {/* Notes additionnelles */}
                <div>
                  <Label htmlFor="edit-notes">Notes additionnelles (optionnel)</Label>
                  <Textarea
                    id="edit-notes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Informations complémentaires..."
                    rows={2}
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={formLoading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-blanc-pur"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blanc-pur mr-2"></div>
                        Modification en cours...
                      </div>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notifications Toast */}
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
