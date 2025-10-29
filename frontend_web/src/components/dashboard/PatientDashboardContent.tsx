'use client';

import HealthProfileWidget from "@/components/patient/HealthProfileWidget";
import StatsWidget from "@/components/patient/StatsWidget";
import Shortcut from "@/components/shared/Shortcut";
import { Calendar, Mic, FileText, Award, HeartPulse, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import WalletConnectButton from '@/components/hedera/WalletConnectButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import WalletBadge from '@/components/shared/WalletBadge';

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

export default function PatientDashboardContent() {
  const router = useRouter();
  const { token, user } = useAuth();

  const handleAuditAction = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/hedera/hcs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'PATIENT_DASHBOARD_VIEW',
          payload: { page: '/dashboard' },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'audit');
      }

      alert(`Action auditée avec succès ! Transaction ID: ${data.transactionId}`);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex justify-between items-start">
        <div>
          <motion.h1 variants={itemVariants} className="text-3xl font-bold text-texte-principal">
            Bonjour {user?.name || 'Utilisateur'}, prenez soin de votre santé avec Santé Kènè 🌿
          </motion.h1>
          <motion.div variants={itemVariants} className="mt-3">
            <WalletBadge />
          </motion.div>
        </div>
        <motion.div variants={itemVariants}>
          <WalletConnectButton />
        </motion.div>
      </div>
      
      <motion.div variants={itemVariants} className="mb-8">
        <HealthProfileWidget />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Button onClick={handleAuditAction} variant="outline">
          <ShieldCheck className="w-4 h-4 mr-2" />
          Déclencher une action auditable (Test HCS)
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Shortcut
          icon={<Calendar className="w-12 h-12 text-bleu-clair" />}
          title="Voir mes rendez-vous"
          emoji="📅"
          onClick={() => router.push('/dashboard/patient/appointments')}
        />
        <Shortcut
          icon={<Mic className="w-12 h-12 text-bleu-clair" />}
          title="Décrire mes symptômes"
          emoji="🎙️"
          onClick={() => router.push('/dashboard/patient/triage')}
        />
        <Shortcut
          icon={<FileText className="w-12 h-12 text-bleu-clair" />}
          title="Voir mes ordonnances"
          emoji="📜"
          onClick={() => router.push('/dashboard/patient/prescriptions')}
        />
        <Shortcut
          icon={<Award className="w-12 h-12 text-bleu-clair" />}
          title="Mes KènèPoints"
          emoji="💰"
          onClick={() => router.push('/dashboard/patient/kenepoints')}
        />
        <Shortcut
          icon={<HeartPulse className="w-12 h-12 text-bleu-clair" />}
          title="Mon Dossier Médical (DSE)"
          emoji="❤️"
          onClick={() => router.push('/dashboard/dse')}
        />
      </motion.div>
    </motion.div>
  );
}
