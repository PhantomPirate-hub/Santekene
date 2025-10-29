import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UserManagementWidget() {
  return (
    <Card className="bg-blanc-pur shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-texte-principal">Gestion Utilisateurs</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-bleu-clair">Table de comptes, KYC wallet Hedera...</p>
      </CardContent>
    </Card>
  );
}