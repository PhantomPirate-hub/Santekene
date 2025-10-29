'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserPlus } from "lucide-react";

const QuickActionsWidget = () => {
  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardContent className="p-6 flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-lg font-bold text-texte-principal mb-4">Actions Rapides</h2>
        <Button className="w-full bg-bleu-clair hover:bg-bleu-clair/90 text-texte-principal rounded-full">
          <PlusCircle className="w-5 h-5 mr-2" />
          Nouvelle Consultation
        </Button>
        <Button variant="outline" className="w-full rounded-full">
          <UserPlus className="w-5 h-5 mr-2" />
          Ajouter Patient
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActionsWidget;
