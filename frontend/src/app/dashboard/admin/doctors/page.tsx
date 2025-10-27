'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  Search,
  UserCheck,
  UserX,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Doctor {
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
    isVerified: boolean;
    createdAt: string;
  };
  _count: {
    consultations: number;
  };
}

export default function AllDoctorsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDoctors = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/admin/doctors`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDoctors = filteredDoctors.filter((d) => d.user.isVerified);
  const pendingDoctors = filteredDoctors.filter((d) => !d.user.isVerified);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-texte-principal">Médecins de la structure</h1>
          <p className="text-texte-principal/70">
            {doctors.length} médecin{doctors.length > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal">
              Total
            </CardTitle>
            <Users className="w-5 h-5 text-bleu-primaire" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-texte-principal">{doctors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal">
              Actifs
            </CardTitle>
            <UserCheck className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-texte-principal">
              {activeDoctors.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-texte-principal">
              En attente
            </CardTitle>
            <UserX className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-texte-principal">
              {pendingDoctors.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-texte-principal/40" />
        <Input
          type="text"
          placeholder="Rechercher par nom, spécialité ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des médecins */}
      {filteredDoctors.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-texte-principal/30 mb-4" />
            <h3 className="text-xl font-semibold text-texte-principal mb-2">
              Aucun médecin trouvé
            </h3>
            <p className="text-texte-principal/60">
              {searchTerm ? 'Aucun résultat pour votre recherche' : 'Aucun médecin dans votre structure'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="text-lg font-semibold text-texte-principal">
                          {doctor.user.name}
                        </h3>
                        <p className="text-texte-principal/70">{doctor.speciality}</p>
                      </div>
                      <Badge variant={doctor.user.isVerified ? 'default' : 'secondary'}>
                        {doctor.user.isVerified ? 'Actif' : 'En attente'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
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
                          {format(new Date(doctor.user.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-bleu-primaire" />
                        <span className="text-texte-principal">
                          {doctor._count.consultations} consultation{doctor._count.consultations > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {doctor.location && (
                      <div className="text-sm text-texte-principal/70">
                        📍 {doctor.location}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

