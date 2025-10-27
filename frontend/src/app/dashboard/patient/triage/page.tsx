'use client';

import { motion } from 'framer-motion';
import AITriageForm from '@/components/patient/AITriageForm';
import AITriageResults from '@/components/patient/AITriageResults';
import { useState } from 'react';

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

export default function PatientTriagePage() {
  const [triageResults, setTriageResults] = useState<any>(null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center mb-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 Analyse IA de vos symptômes</h1>
        <p className="text-lg text-gray-600">Décrivez vos symptômes et recevez des recommandations personnalisées</p>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <AITriageForm setTriageResults={setTriageResults} />
      </motion.div>

      {triageResults && (
        <motion.div variants={itemVariants}>
          <AITriageResults results={triageResults} />
        </motion.div>
      )}

    </motion.div>
  );
}
