'use client';

import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import Link from 'next/link';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export default function DSEPage() {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 flex flex-col items-center justify-center h-full"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-texte-principal mb-2">Dossier de Santé Électronique</h1>
        <p className="text-texte-principal/80">Recherchez un patient pour consulter ou mettre à jour son dossier.</p>
      </div>
      
      <div className="w-full max-w-lg flex space-x-2">
        <Input placeholder="Entrez le nom ou l'ID du patient..." className="flex-1" />
        <Link href="/dashboard/dse/123" passHref>
            <Button className="bg-bleu-clair hover:bg-bleu-clair/90 text-texte-principal">
                <Search className="w-5 h-5 mr-2" />
                Rechercher
            </Button>
        </Link>
      </div>

    </motion.div>
  );
}
