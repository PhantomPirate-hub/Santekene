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
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-nuit-confiance">Triage Intelligent par IA</motion.h1>
      
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
