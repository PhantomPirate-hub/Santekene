'use client';

import { motion } from 'framer-motion';
import SettingsLayout from '@/components/settings/SettingsLayout';
import NotificationSettings from '@/components/settings/NotificationSettings';

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

export default function NotificationSettingsPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-nuit-confiance">Paramètres de Notifications</motion.h1>
      
      <SettingsLayout>
        <NotificationSettings />
      </SettingsLayout>

    </motion.div>
  );
}
