'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const auditLogs = [
  { id: 1, user: 'Pr. Dupont', action: 'Consultation DSE', module: 'DSE', date: '2025-10-12 10:30:00' },
  { id: 2, user: 'Admin', action: 'Modification rôle utilisateur', module: 'Gestion Utilisateurs', date: '2025-10-12 09:15:00' },
  { id: 3, user: 'Patient Amina', action: 'Accès DSE', module: 'DSE', date: '2025-10-12 08:00:00' },
  { id: 4, user: 'Dr. Dupont', action: 'Analyse IA', module: 'IA Clinique', date: '2025-10-11 16:45:00' },
];

const AccessAuditLog = () => {
  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-texte-principal">Journal d'Audit des Accès</CardTitle>
        <div className="flex justify-between items-center pt-2">
          <CardDescription className="text-texte-principal/80">Historique des actions sur les modules sensibles.</CardDescription>
          <div className="w-1/3 relative">
            <Input placeholder="Filtrer par utilisateur..." className="pl-10" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-texte-principal/60" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Date/Heure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-texte-principal">{log.user}</TableCell>
                <TableCell className="text-texte-principal/90">{log.action}</TableCell>
                <TableCell className="text-texte-principal/90">{log.module}</TableCell>
                <TableCell className="text-texte-principal/70">{log.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AccessAuditLog;
