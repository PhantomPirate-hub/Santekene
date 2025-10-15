'use client';

import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';

const HeartbeatLoader = () => {
  return (
    <div className="fixed inset-0 bg-fond-doux flex flex-col items-center justify-center z-50">
      <motion.div
        animate={{
          scale: [1, 1.2, 1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <HeartPulse className="w-24 h-24 text-vert-vitalite" />
      </motion.div>
      <p className="text-nuit-confiance font-semibold mt-4">Chargement...</p>
    </div>
  );
};

export default HeartbeatLoader;
