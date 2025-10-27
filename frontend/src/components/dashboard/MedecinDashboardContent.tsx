'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  BarChart2, 
  Users, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface DoctorProfile {
  name: string;
  specialty: string;
  structure: string;
  location: string;
  phone: string;
  email: string;
  patientsCount?: number;
  consultationsCount?: number;
}

export default function MedecinDashboardContent() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!token) return;
      
      setLoading(true);
      
      try {
        const response = await fetch('http://localhost:3001/api/medecin/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setDoctorProfile(data);
        }
      } catch (error) {
        console.error('Erreur chargement profil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, [token, user]); // Recharger quand le contexte utilisateur change

  const quickActions = [
    {
      title: 'Statistiques',
      description: 'Voir mes statistiques',
      icon: BarChart2,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/dashboard/medecin/stats',
    },
    {
      title: 'Consultations',
      description: 'Gérer les consultations',
      icon: Stethoscope,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      path: '/dashboard/medecin/consultations',
    },
    {
      title: 'Mes RDV',
      description: 'Gérer mes rendez-vous',
      icon: Calendar,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      path: '/dashboard/medecin/rdv',
    },
  ];

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header avec profil médecin */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-bleu-clair/30 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-bleu-clair/20 flex items-center justify-center border-4 border-bleu-clair">
                  <Stethoscope className="w-12 h-12 text-bleu-clair" />
                </div>
                
                {/* Informations */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-texte-principal">
                      {doctorProfile?.name || user?.name || 'Médecin'}
                    </h1>
                    <Badge className="bg-bleu-clair text-white border-bleu-clair">
                      <Award className="w-3 h-3 mr-1" />
                      Médecin
                    </Badge>
                  </div>
                  
                  <p className="text-xl text-texte-principal/80 mb-4 font-medium">
                    {doctorProfile?.specialty || 'Médecine Générale'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {doctorProfile?.structure && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-bleu-clair" />
                        <span className="text-texte-principal font-semibold">{doctorProfile.structure}</span>
                      </div>
                    )}
                    {doctorProfile?.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-bleu-clair" />
                        <span className="text-texte-principal font-semibold">{doctorProfile.location}</span>
                      </div>
                    )}
                    {doctorProfile?.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-bleu-clair" />
                        <span className="text-texte-principal font-semibold">{doctorProfile.phone}</span>
                      </div>
                    )}
                    {doctorProfile?.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-bleu-clair" />
                        <span className="text-texte-principal font-semibold">{doctorProfile.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="flex space-x-6">
                <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg px-6 py-4 border-2 border-bleu-clair/30">
                  <Users className="w-6 h-6 text-bleu-clair mx-auto mb-2" />
                  <p className="text-3xl font-bold text-texte-principal">{doctorProfile?.patientsCount || 0}</p>
                  <p className="text-sm text-texte-principal/60 font-medium">Patients</p>
                </div>
                <div className="text-center bg-white/80 backdrop-blur-sm rounded-lg px-6 py-4 border-2 border-bleu-clair/30">
                  <Stethoscope className="w-6 h-6 text-bleu-clair mx-auto mb-2" />
                  <p className="text-3xl font-bold text-texte-principal">{doctorProfile?.consultationsCount || 0}</p>
                  <p className="text-sm text-texte-principal/60 font-medium">Consultations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions rapides */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold text-texte-principal mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-bleu-clair group"
                onClick={() => router.push(action.path)}
              >
                <CardContent className="p-6">
                  <div className={`w-16 h-16 rounded-full ${action.color} ${action.hoverColor} flex items-center justify-center mb-4 transition-all group-hover:scale-110`}>
                    <action.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-texte-principal mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-texte-principal/60">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Message de bienvenue */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-vert-energie/10 to-aqua-moderne/10 border-vert-energie/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-vert-energie/20 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-6 h-6 text-vert-energie" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-texte-principal mb-2">
                  Bienvenue dans votre espace médecin
                </h3>
                <p className="text-texte-principal/70">
                  Gérez vos consultations, accédez aux dossiers médicaux de vos patients, 
                  utilisez l'IA clinique pour vous assister, et consultez vos statistiques. 
                  Toutes vos actions sont sécurisées et traçables sur la blockchain Hedera.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
