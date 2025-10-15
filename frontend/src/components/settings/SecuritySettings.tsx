'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const SecuritySettings = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-nuit-confiance">Paramètres de Sécurité</h2>
      <p className="text-nuit-confiance/80">Gérez votre mot de passe et l'authentification à deux facteurs.</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mot de passe actuel</Label>
          <Input id="currentPassword" type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <Input id="newPassword" type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
          <Input id="confirmNewPassword" type="password" />
        </div>
        <Button className="bg-aqua-moderne hover:bg-aqua-moderne/90 text-blanc-pur rounded-full">Changer le mot de passe</Button>
      </div>

      <div className="flex items-center justify-between p-4 bg-fond-doux rounded-lg shadow-sm">
        <div>
          <h3 className="font-semibold text-nuit-confiance">Authentification à deux facteurs (2FA)</h3>
          <p className="text-sm text-nuit-confiance/70">Ajoutez une couche de sécurité supplémentaire à votre compte.</p>
        </div>
        <Switch id="2fa-mode" />
      </div>
    </div>
  );
};

export default SecuritySettings;
