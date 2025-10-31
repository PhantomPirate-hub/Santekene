import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsWidget() {
  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal">Alertes IA</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-bleu-clair">3 cas critiques détectés ce matin</p>
      </CardContent>
    </Card>
  );
}