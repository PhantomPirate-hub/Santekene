'use client';

import AgendaWidget from "@/components/medecin/AgendaWidget";
import AlertsWidget from "@/components/medecin/AlertsWidget";
import Shortcut from "@/components/shared/Shortcut";
import { FilePlus, BarChart2, FolderOpen } from 'lucide-react';
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

export default function MedecinDashboardContent() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-texte-principal">Tableau de Bord Médecin</motion.h1>
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <AgendaWidget />
        </div>
        <AlertsWidget />
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Shortcut
          icon={<FilePlus className="w-12 h-12 text-bleu-clair" />}
          title="Créer ordonnance"
          emoji="🧾"
        />
        <Shortcut
          icon={<BarChart2 className="w-12 h-12 text-bleu-clair" />}
          title="Statistiques"
          emoji="📈"
        />
        <Shortcut
          icon={<FolderOpen className="w-12 h-12 text-bleu-clair" />}
          title="DSE patient"
          emoji="📂"
        />
      </motion.div>
    </motion.div>
  );
}
