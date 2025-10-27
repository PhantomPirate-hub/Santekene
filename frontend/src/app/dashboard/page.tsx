'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import PatientDashboardContent from '@/components/dashboard/PatientDashboardContent';
import MedecinDashboardContent from '@/components/dashboard/MedecinDashboardContent';
import AdminDashboardContent from '@/components/dashboard/AdminDashboardContent';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function DashboardHomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Rediriger les super admins vers leur dashboard dédié
    if (isAuthenticated && user?.role === 'SUPERADMIN') {
      router.push('/dashboard/superadmin');
    }
    // Rediriger les admins vers leur dashboard dédié
    if (isAuthenticated && user?.role === 'ADMIN') {
      router.push('/dashboard/admin');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-center h-full text-texte-principal"
      >
        <p>Veuillez vous connecter pour accéder au tableau de bord.</p>
      </motion.div>
    );
  }

  switch (user?.role) {
    case 'PATIENT':
      return <PatientDashboardContent />;
    case 'MEDECIN':
      return <MedecinDashboardContent />;
    case 'ADMIN':
      // Redirection gérée par useEffect vers /dashboard/admin
      return null;
    case 'SUPERADMIN':
      // Redirection gérée par useEffect vers /dashboard/superadmin
      return null;
    default:
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center h-full text-texte-principal"
        >
          <p>Rôle utilisateur non reconnu ou contenu non disponible.</p>
        </motion.div>
      );
  }
}
