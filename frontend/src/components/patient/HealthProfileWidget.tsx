import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HealthProfileWidget() {
  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal">Profil Santé</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-bleu-clair">Résumé du DSE...</p>
      </CardContent>
    </Card>
  );
}