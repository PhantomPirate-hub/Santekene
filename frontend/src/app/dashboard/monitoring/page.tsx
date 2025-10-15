'use client';

import { motion } from 'framer-motion';
import AdminDashboardOverview from '@/components/monitoring/AdminDashboardOverview';
import SystemAlertsWidget from '@/components/monitoring/SystemAlertsWidget';
import AccessAuditLog from '@/components/monitoring/AccessAuditLog';
import MonitoringCharts from '@/components/monitoring/MonitoringCharts';

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

export default function MonitoringPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-texte-principal">Monitoring & Audit IA</motion.h1>
      
      <motion.div variants={itemVariants}>
        <AdminDashboardOverview />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alertes système */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <SystemAlertsWidget />
        </motion.div>

        {/* Audit des accès */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <AccessAuditLog />
        </motion.div>
      </div>

      {/* Graphiques de monitoring */}
      <motion.div variants={itemVariants}>
        <MonitoringCharts />
      </motion.div>

    </motion.div>
  );
}
