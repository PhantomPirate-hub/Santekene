'use client';

import GlobalStatsWidget from "@/components/admin/GlobalStatsWidget";
import UserManagementWidget from "@/components/admin/UserManagementWidget";
import TransactionsWidget from "@/components/admin/TransactionsWidget";
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

export default function AdminDashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-nuit-confiance mb-8">Tableau de Bord Administrateur</motion.h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants}><GlobalStatsWidget /></motion.div>
        <motion.div variants={itemVariants}><UserManagementWidget /></motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <TransactionsWidget />
        </motion.div>
      </div>
    </motion.div>
  );
}