'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Stethoscope, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const suggestionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const AISuggestionsDisplay = () => {
  // Données factices pour les suggestions
  const diagnostics = [
    { id: 1, name: 'Grippe saisonnière', confidence: 0.85 },
    { id: 2, name: 'Rhume', confidence: 0.60 },
  ];

  const recommendations = [
    { id: 1, text: 'Prescrire du paracétamol pour la fièvre.' },
    { id: 2, text: 'Reposer le patient et l\'hydrater.' },
    { id: 3, text: 'Effectuer un test PCR si les symptômes persistent.' },
  ];

  const criticalAlert = true; // Simule une alerte critique

  return (
    <div className="space-y-6">
      {criticalAlert && (
        <motion.div 
          variants={suggestionVariants}
          initial="hidden"
          animate="visible"
          className="bg-red-500 text-white p-4 rounded-lg flex items-center space-x-3 shadow-md"
        >
          <AlertTriangle className="w-6 h-6" />
          <p className="font-bold">Alerte : Triage prioritaire nécessaire !</p>
          <Button variant="secondary" className="ml-auto bg-white text-red-500 hover:bg-gray-100">Appeler urgentiste</Button>
        </motion.div>
      )}

      <motion.div variants={suggestionVariants}>
        <Card className="bg-blanc-pur shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-texte-principal">Diagnostics Possibles</CardTitle>
            <CardDescription className="text-texte-principal/80">Basé sur les symptômes et données fournis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnostics.map(diag => (
              <div key={diag.id} className="flex items-center space-x-3">
                <Brain className="w-5 h-5 text-bleu-clair" />
                <p className="flex-1 text-texte-principal">{diag.name}</p>
                <Badge className="bg-bleu-clair text-texte-principal">{(diag.confidence * 100).toFixed(0)}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={suggestionVariants}>
        <Card className="bg-blanc-pur shadow-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-texte-principal">Recommandations</CardTitle>
            <CardDescription className="text-texte-principal/80">Actions suggérées par l'IA.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map(rec => (
              <div key={rec.id} className="flex items-start space-x-3">
                <Stethoscope className="w-5 h-5 text-vert-menthe mt-1" />
                <p className="text-texte-principal">{rec.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AISuggestionsDisplay;
