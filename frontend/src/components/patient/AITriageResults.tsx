'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Stethoscope, CheckCircle } from 'lucide-react';
import { motion } from "framer-motion";

interface AITriageResultsProps {
  results: {
    summary: string;
    specialties: string[];
    full_response?: string;
  };
}

const resultItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AITriageResults({ results }: AITriageResultsProps) {
  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Résultats du Triage IA</CardTitle>
        <CardDescription className="text-nuit-confiance/80">Analyse de vos symptômes par l'intelligence artificielle.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <motion.div variants={resultItemVariants}>
          <h3 className="text-lg font-semibold text-nuit-confiance flex items-center"><Brain className="w-5 h-5 mr-2 text-aqua-moderne" /> Résumé des symptômes :</h3>
          <p className="text-nuit-confiance/90 mt-2 p-3 bg-fond-doux rounded-lg">{results.summary}</p>
        </motion.div>

        <motion.div variants={resultItemVariants}>
          <h3 className="text-lg font-semibold text-nuit-confiance flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-vert-vitalite" /> Spécialité(s) suggérée(s) :</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {results.specialties.map((specialty, index) => (
              <span key={index} className="px-3 py-1 bg-aqua-moderne text-blanc-pur rounded-full text-sm font-medium">
                {specialty}
              </span>
            ))}
          </div>
        </motion.div>

        {results.full_response && (
          <motion.div variants={resultItemVariants}>
            <h3 className="text-lg font-semibold text-nuit-confiance flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-nuit-confiance" /> Réponse complète de l'IA :</h3>
            <pre className="text-nuit-confiance/70 mt-2 p-3 bg-fond-doux rounded-lg overflow-x-auto text-sm">{
              results.full_response
            }</pre>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
