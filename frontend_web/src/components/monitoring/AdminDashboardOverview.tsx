'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Server, Database } from "lucide-react";

const AdminDashboardOverview = () => {
  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Vue d'ensemble du Système</CardTitle>
        <CardDescription className="text-nuit-confiance/80">Indicateurs clés en temps réel.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center space-x-3 p-3 bg-fond-doux rounded-lg shadow-sm">
          <Users className="w-6 h-6 text-aqua-moderne" />
          <div>
            <p className="text-sm text-nuit-confiance/70">Utilisateurs Connectés</p>
            <p className="text-xl font-bold text-nuit-confiance">124</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-fond-doux rounded-lg shadow-sm">
          <Activity className="w-6 h-6 text-vert-vitalite" />
          <div>
            <p className="text-sm text-nuit-confiance/70">Consultations Actives</p>
            <p className="text-xl font-bold text-nuit-confiance">12</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-fond-doux rounded-lg shadow-sm">
          <Server className="w-6 h-6 text-nuit-confiance" />
          <div>
            <p className="text-sm text-nuit-confiance/70">Charge CPU Serveur</p>
            <p className="text-xl font-bold text-nuit-confiance">35%</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-fond-doux rounded-lg shadow-sm">
          <Database className="w-6 h-6 text-aqua-moderne" />
          <div>
            <p className="text-sm text-nuit-confiance/70">Base de Données</p>
            <p className="text-xl font-bold text-nuit-confiance">En ligne</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDashboardOverview;
