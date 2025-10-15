'use client';

import { motion } from 'framer-motion';
import CourseCatalog from '@/components/elearning/CourseCatalog';
import NFTCertifications from '@/components/elearning/NFTCertifications';

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

export default function ELearningPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-texte-principal">E-learning & Certifications NFT</motion.h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Catalogue de cours */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <CourseCatalog />
        </motion.div>

        {/* Suivi et certifications (NFT) */}
        <motion.div variants={itemVariants}>
          <NFTCertifications />
        </motion.div>
      </div>

    </motion.div>
  );
}
