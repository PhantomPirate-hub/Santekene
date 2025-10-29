'use client';

import { motion } from 'framer-motion';
import PatientProfileHeader from '@/components/dse/PatientProfileHeader';
import PatientProfileTabs from '@/components/dse/PatientProfileTabs';
import { useEffect, useState } from 'react';
import HeartbeatLoader from '@/components/shared/HeartbeatLoader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface PatientData {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  avatar: string;
  allergies: string[];
  chronic: string[];
  lastVisit: string;
  weight: string;
  tension: string;
  role: string;
}

export default function PatientProfilePage({ params }: { params: { patientId: string } }) {
  const { patientId } = params;
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/patients/${patientId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de la récupération des données patient.');
        }
        setPatientData(data);
      } catch (err: any) {
        setError(err.message || 'Impossible de charger le profil patient.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  if (loading) {
    return <HeartbeatLoader />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">Erreur: {error}</div>;
  }

  if (!patientData) {
    return <div className="text-nuit-confiance text-center p-8">Patient non trouvé.</div>;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <PatientProfileHeader patient={patientData} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PatientProfileTabs />
      </motion.div>

    </motion.div>
  );
}
