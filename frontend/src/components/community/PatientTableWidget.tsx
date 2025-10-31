'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const fakePatients = [
  { name: 'Amina Traoré', age: 34, lastVisit: '12/09/2025', status: 'Chronique', statusColor: 'bg-jaune-ocre' },
  { name: 'Moussa Diarra', age: 7, lastVisit: '03/10/2025', status: 'À vacciner', statusColor: 'bg-aqua-moderne' },
  { name: 'Fatoumata Kéita', age: 62, lastVisit: '28/09/2025', status: 'Urgent', statusColor: 'bg-red-500' },
  { name: 'Idrissa Camara', age: 28, lastVisit: '15/08/2025', status: 'Stable', statusColor: 'bg-vert-vitalite' },
];

const PatientTableWidget = () => {
  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Suivi des Patients Locaux</CardTitle>
        <div className="flex justify-between items-center pt-2">
          <CardDescription className="text-nuit-confiance/80">Liste des patients de la zone sélectionnée.</CardDescription>
          <div className="w-1/3">
            <Input placeholder="Filtrer par nom..." />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-nuit-confiance">Nom</TableHead>
              <TableHead className="text-nuit-confiance">Âge</TableHead>
              <TableHead className="text-nuit-confiance">Dernière Visite</TableHead>
              <TableHead className="text-nuit-confiance">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fakePatients.map((patient, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-nuit-confiance">{patient.name}</TableCell>
                <TableCell className="text-nuit-confiance/90">{patient.age}</TableCell>
                <TableCell className="text-nuit-confiance/90">{patient.lastVisit}</TableCell>
                <TableCell>
                  <Badge className={`${patient.statusColor} text-blanc-pur`}>{patient.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PatientTableWidget;
