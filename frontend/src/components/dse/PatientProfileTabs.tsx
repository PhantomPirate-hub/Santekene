'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  { id: 'history', label: 'Historique Médical' },
  { id: 'exams', label: 'Examens & Bilans' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'audit', label: 'Journal d\'Accès' },
];

const tabContentVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const PatientProfileTabs = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div>
      <div className="relative flex border-b-2 border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 py-4 px-2 text-center text-lg font-medium transition-colors duration-300 ${activeTab === tab.id ? 'text-bleu-clair' : 'text-texte-principal/60 hover:text-texte-principal'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-[-2px] left-0 right-0 h-1 bg-bleu-clair"
                layoutId="underline"
              />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="enter"
            exit="exit"
        >
            <Card className="mt-6 rounded-2xl shadow-md border-none">
                <CardContent className="p-6">
                    {activeTab === 'history' && <p>Contenu de l'historique médical du patient...</p>}
                    {activeTab === 'exams' && <p>Tableau des résultats d'examens et bilans...</p>}
                    {activeTab === 'prescriptions' && <p>Liste des prescriptions médicamenteuses...</p>}
                    {activeTab === 'audit' && <p>Journal des accès au dossier du patient...</p>}
                </CardContent>
            </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PatientProfileTabs;
