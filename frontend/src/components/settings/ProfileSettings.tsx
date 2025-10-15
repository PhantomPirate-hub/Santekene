'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProfileSettings = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-nuit-confiance">Paramètres du Profil</h2>
      <p className="text-nuit-confiance/80">Mettez à jour les informations de votre profil.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" defaultValue="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" defaultValue="Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="john.doe@example.com" disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" defaultValue="+33 6 12 34 56 78" />
        </div>
      </div>
      <Button className="bg-aqua-moderne hover:bg-aqua-moderne/90 text-blanc-pur rounded-full">Enregistrer les modifications</Button>
    </div>
  );
};

export default ProfileSettings;
