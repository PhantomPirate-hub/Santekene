'use client';

import HealthProfileWidget from "@/components/patient/HealthProfileWidget";
import StatsWidget from "@/components/patient/StatsWidget";
import Shortcut from "@/components/shared/Shortcut";
import { Calendar, Mic, FileText, Award, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function PatientDashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-nuit-confiance mb-8">Bonjour [Prénom], prenez soin de votre santé avec Santé Kènè 🌿</motion.h1>
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <HealthProfileWidget />
        </div>
        <StatsWidget />
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Shortcut
          icon={<Calendar className="w-12 h-12 text-aqua-moderne" />}
          title="Prendre rendez-vous"
          emoji="📅"
        />
        <Shortcut
          icon={<Mic className="w-12 h-12 text-aqua-moderne" />}
          title="Décrire mes symptômes"
          emoji="🎙️"
        />
        <Shortcut
          icon={<FileText className="w-12 h-12 text-aqua-moderne" />}
          title="Voir mes ordonnances"
          emoji="📜"
        />
        <Shortcut
          icon={<Award className="w-12 h-12 text-aqua-moderne" />}
          title="Mes KènèPoints"
          emoji="💰"
        />
        <Shortcut
          icon={<HeartPulse className="w-12 h-12 text-aqua-moderne" />}
          title="Mon Dossier Médical (DSE)"
          emoji="❤️"
        />
      </motion.div>
    </motion.div>
  );
}