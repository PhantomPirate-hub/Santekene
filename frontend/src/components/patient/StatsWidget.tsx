import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatsWidget() {
  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal">Statistiques</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-bleu-clair">Classement KènèPoints, prochain rendez-vous...</p>
      </CardContent>
    </Card>
  );
}