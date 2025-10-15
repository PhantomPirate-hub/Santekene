'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, BarChart } from "lucide-react";

const MonitoringCharts = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="bg-blanc-pur shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-texte-principal">Anomalies IA (Taux de Faux Positifs)</CardTitle>
          <CardDescription className="text-texte-principal/80">Évolution sur les 30 derniers jours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-texte-principal/60">
            <LineChart className="w-12 h-12 mr-2" /> Graphique ici
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blanc-pur shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-texte-principal">Statistiques de Santé Publique</CardTitle>
          <CardDescription className="text-texte-principal/80">Incidence des maladies détectées.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-texte-principal/60">
            <BarChart className="w-12 h-12 mr-2" /> Graphique ici
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringCharts;
