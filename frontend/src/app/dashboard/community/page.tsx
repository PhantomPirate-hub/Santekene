'use client';

import { motion } from 'framer-motion';
import InteractiveMapWidget from '@/components/community/InteractiveMapWidget';
import PatientTableWidget from '@/components/community/PatientTableWidget';

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

export default function CommunityHealthPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <InteractiveMapWidget />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <PatientTableWidget />
      </motion.div>

    </motion.div>
  );
}
