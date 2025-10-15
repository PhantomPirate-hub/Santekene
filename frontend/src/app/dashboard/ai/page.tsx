'use client';

import { motion } from 'framer-motion';
import AIAnalysisForm from '@/components/ai/AIAnalysisForm';
import AISuggestionsDisplay from '@/components/ai/AISuggestionsDisplay';
import PatientSummaryPanel from '@/components/ai/PatientSummaryPanel';

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

export default function AIClinicalDecisionPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-texte-principal">Support à la Décision Clinique (IA)</motion.h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire d'analyse IA et Suggestions médicales */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          <AIAnalysisForm />
          <AISuggestionsDisplay />
        </motion.div>

        {/* Résumé patient */}
        <motion.div variants={itemVariants}>
          <PatientSummaryPanel />
        </motion.div>
      </div>

    </motion.div>
  );
}
