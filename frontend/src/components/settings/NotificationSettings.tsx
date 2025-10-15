'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const NotificationSettings = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-nuit-confiance">Paramètres de Notifications</h2>
      <p className="text-nuit-confiance/80">Gérez comment et quand vous recevez des notifications.</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-fond-doux rounded-lg shadow-sm">
          <div>
            <h3 className="font-semibold text-nuit-confiance">Notifications par Email</h3>
            <p className="text-sm text-nuit-confiance/70">Recevez des mises à jour importantes par email.</p>
          </div>
          <Switch id="email-notifications" defaultChecked />
        </div>

        <div className="flex items-center justify-between p-4 bg-fond-doux rounded-lg shadow-sm">
          <div>
            <h3 className="font-semibold text-nuit-confiance">Notifications Push</h3>
            <p className="text-sm text-nuit-confiance/70">Recevez des alertes directement sur votre appareil.</p>
          </div>
          <Switch id="push-notifications" />
        </div>

        <div className="flex items-center justify-between p-4 bg-fond-doux rounded-lg shadow-sm">
          <div>
            <h3 className="font-semibold text-nuit-confiance">Notifications SMS</h3>
            <p className="text-sm text-nuit-confiance/70">Recevez des rappels de rendez-vous par SMS.</p>
          </div>
          <Switch id="sms-notifications" />
        </div>
      </div>
      <Button className="bg-aqua-moderne hover:bg-aqua-moderne/90 text-blanc-pur rounded-full">Enregistrer les préférences</Button>
    </div>
  );
};

export default NotificationSettings;
