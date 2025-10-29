'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarWidget = () => {
  // Logique factice pour le calendrier
  const today = new Date();
  const monthName = today.toLocaleString('fr-FR', { month: 'long' });
  const year = today.getFullYear();

  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-texte-principal">Calendrier</CardTitle>
        <div className="flex items-center space-x-2">
          <ChevronLeft className="w-5 h-5 cursor-pointer" />
          <span className="font-semibold">{monthName} {year}</span>
          <ChevronRight className="w-5 h-5 cursor-pointer" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Une représentation très simplifiée d'un calendrier */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          <div className="font-bold">Lu</div>
          <div className="font-bold">Ma</div>
          <div className="font-bold">Me</div>
          <div className="font-bold">Je</div>
          <div className="font-bold">Ve</div>
          <div className="font-bold">Sa</div>
          <div className="font-bold">Di</div>
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 2; // Simule un mois
            const isToday = day === today.getDate();
            return (
              <div key={i} className={`p-2 rounded-full ${isToday ? 'bg-vert-menthe text-white' : ''}`}>
                {day > 0 && day < 32 ? day : ''}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarWidget;
