'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Brain, Send } from "lucide-react";

const AIAnalysisForm = () => {
  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-texte-principal">Formulaire d'Analyse IA</CardTitle>
        <CardDescription className="text-texte-principal/80">Entrez les symptômes et données du patient pour obtenir des suggestions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="symptoms">Description des symptômes / Situation</Label>
          <Textarea id="symptoms" placeholder="Fièvre, toux sèche, fatigue..." rows={5} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Poids (kg)</Label>
            <Input id="weight" type="number" placeholder="Ex: 70" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tension">Tension Artérielle (mmHg)</Label>
            <Input id="tension" placeholder="Ex: 120/80" />
          </div>
        </div>
        <Button className="w-full bg-vert-menthe hover:bg-vert-menthe/90 text-texte-principal rounded-full">
          <Brain className="w-5 h-5 mr-2" />
          Analyser avec l'IA
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIAnalysisForm;
