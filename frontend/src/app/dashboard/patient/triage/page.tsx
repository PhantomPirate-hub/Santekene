'use client';

import { motion } from 'framer-motion';
import AITriageForm from '@/components/patient/AITriageForm';
import AITriageResults from '@/components/patient/AITriageResults';
import { useState, useRef, useEffect } from 'react';

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
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3 } },
};

export default function PatientTriagePage() {
  const [triageResults, setTriageResults] = useState<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers les résultats quand ils apparaissent
  useEffect(() => {
    if (triageResults && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
    }
  }, [triageResults]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-5xl mx-auto"
    >
      <motion.div variants={itemVariants} className="text-center mb-2">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">🤖 Analyse IA de vos symptômes</h1>
        <p className="text-base text-gray-600">Décrivez vos symptômes et recevez des recommandations personnalisées</p>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <AITriageForm setTriageResults={setTriageResults} />
      </motion.div>

      {triageResults && (
        <motion.div 
          ref={resultsRef}
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AITriageResults results={triageResults} />
        </motion.div>
      )}

    </motion.div>
  );
}
