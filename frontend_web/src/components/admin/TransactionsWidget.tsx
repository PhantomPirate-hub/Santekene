import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TransactionsWidget() {
  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal">Transactions & Blockchain</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-bleu-clair">Historique HCS, rapport RGPD...</p>
      </CardContent>
    </Card>
  );
}