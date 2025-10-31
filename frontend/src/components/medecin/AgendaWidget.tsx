import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgendaWidget() {
  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal">Agenda Intelligent</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-bleu-clair">Indicateurs de gravité, etc...</p>
      </CardContent>
    </Card>
  );
}