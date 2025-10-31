'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SystemAlertsWidget = () => {
  const alerts = [
    { id: 1, type: 'critical', message: 'Panne serveur critique sur le module IA.', time: 'Il y a 5 min' },
    { id: 2, type: 'warning', message: 'Tentative de connexion non autorisée (IP: 192.168.1.100).', time: 'Il y a 30 min' },
    { id: 3, type: 'info', message: 'Mise à jour du schéma de base de données effectuée.', time: 'Il y a 2h' },
  ];

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500 text-blanc-pur';
      case 'warning': return 'bg-vert-vitalite text-blanc-pur';
      case 'info': return 'bg-aqua-moderne text-blanc-pur';
      default: return 'bg-fond-doux text-nuit-confiance';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Alertes Système</CardTitle>
        <CardDescription className="text-nuit-confiance/80">Notifications critiques et informations.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${getAlertStyle(alert.type)}`}>
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-nuit-confiance">{alert.message}</p>
              <p className="text-sm text-nuit-confiance/70">{alert.time}</p>
            </div>
            <Badge className={getAlertStyle(alert.type)}>Détails</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SystemAlertsWidget;
