'use client';

import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function PatientPrescriptionsPage() {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold text-nuit-confiance">Mes Ordonnances</h1>
      <p className="text-nuit-confiance/80">Contenu de la page de visualisation des ordonnances.</p>
    </motion.div>
  );
}
