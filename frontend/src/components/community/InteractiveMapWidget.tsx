'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

const InteractiveMapWidget = () => {
  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Carte Interactive des Zones</CardTitle>
        <CardDescription className="text-nuit-confiance/80">Couverture communautaire et structures de santé.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-96 bg-fond-doux rounded-lg flex items-center justify-center">
          <div className="text-center text-nuit-confiance/60">
            <Map className="w-16 h-16 mx-auto mb-4 text-aqua-moderne" />
            <p>La carte interactive sera affichée ici.</p>
            <p className="text-sm">(Intégration OpenStreetMap à venir)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveMapWidget;
