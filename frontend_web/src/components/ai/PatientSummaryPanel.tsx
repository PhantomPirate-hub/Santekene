'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import Link from 'next/link';

const PatientSummaryPanel = () => {
  // Données factices pour le résumé patient
  const patient = {
    name: 'Amina Traoré',
    age: 34,
    lastVisit: '01/10/2025',
    weight: '68 kg',
    tension: '120/80 mmHg',
    id: '123',
  };

  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-texte-principal">Résumé Patient</CardTitle>
        <CardDescription className="text-texte-principal/80">Informations récentes du patient.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-semibold text-texte-principal">Nom : <span className="font-normal">{patient.name}</span></p>
          <p className="font-semibold text-texte-principal">Âge : <span className="font-normal">{patient.age} ans</span></p>
          <p className="font-semibold text-texte-principal">Dernière visite : <span className="font-normal">{patient.lastVisit}</span></p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-texte-principal">Poids : <span className="font-normal">{patient.weight}</span></p>
          <p className="font-semibold text-texte-principal">Tension : <span className="font-normal">{patient.tension}</span></p>
        </div>
        <Link href={`/dashboard/dse/${patient.id}`} passHref>
          <Button className="w-full bg-bleu-clair hover:bg-bleu-clair/90 text-texte-principal rounded-full">
            <FolderOpen className="w-5 h-5 mr-2" />
            Voir le DSE complet
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default PatientSummaryPanel;
