import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GlobalStatsWidget() {
  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal">Statistiques Globales</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-bleu-clair">Utilisateurs, transactions Hedera, consultations...</p>
      </CardContent>
    </Card>
  );
}