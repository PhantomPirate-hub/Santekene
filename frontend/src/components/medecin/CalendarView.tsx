'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Video } from 'lucide-react';

interface Appointment {
  id: number;
  date: string;
  type: string;
  reason: string | null;
  isVideo: boolean;
  patient: {
    name: string;
    phone: string;
  };
}

interface CalendarViewProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarView({ appointments, onAppointmentClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtenir le titre selon le mode
  const getTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  };

  // Obtenir les rendez-vous pour une date donnée
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      if (!apt.date) return false;
      const aptDate = new Date(apt.date);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Obtenir le premier jour de la semaine (lundi)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi soit le premier jour
    return new Date(d.setDate(diff));
  };

  // Générer les jours du mois
  const generateMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0
    const days = [];

    // Jours du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date, isCurrentMonth: false });
    }

    // Jours du mois actuel
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  // Générer les jours de la semaine
  const generateWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Générer les heures de la journée (de 8h à 19h)
  const generateDayHours = () => {
    const hours = [];
    for (let i = 8; i <= 19; i++) {
      hours.push(i);
    }
    return hours;
  };

  // Vérifier si c'est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthDays = useMemo(() => generateMonthDays(), [currentDate, viewMode]);
  const weekDays = useMemo(() => generateWeekDays(), [currentDate, viewMode]);
  const dayHours = useMemo(() => generateDayHours(), []);

  return (
    <div className="space-y-4">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={goToPrevious} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-bold text-texte-principal min-w-[250px] text-center capitalize">
            {getTitle()}
          </h2>
          <Button onClick={goToNext} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={goToToday} variant="outline" size="sm">
            Aujourd'hui
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('day')}
          >
            Jour
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semaine
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mois
          </Button>
        </div>
      </div>

      {/* Vue Mois */}
      {viewMode === 'month' && (
        <Card>
          <CardContent className="p-4">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="text-center font-semibold text-sm text-texte-principal/70 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day.date);
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded-lg ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday(day.date) ? 'border-bleu-principal border-2 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isToday(day.date) ? 'text-bleu-principal font-bold' : 'text-texte-principal'
                      } ${!day.isCurrentMonth && 'text-gray-400'}`}
                    >
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick?.(apt)}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition bg-bleu-principal/10 text-bleu-principal border-l-2 border-bleu-principal"
                        >
                          <div className="flex items-center space-x-1">
                            {apt.isVideo && <Video className="w-3 h-3" />}
                            <Clock className="w-3 h-3" />
                            <span>{new Date(apt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="font-medium truncate">{apt.patient.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue Semaine */}
      {viewMode === 'week' && (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <div className="grid grid-cols-8 gap-2 min-w-[800px]">
              {/* Colonne des heures */}
              <div className="space-y-[60px] pt-12">
                {dayHours.map((hour) => (
                  <div key={hour} className="text-xs text-texte-principal/60 text-right pr-2">
                    {hour}:00
                  </div>
                ))}
              </div>

              {/* Colonnes des jours */}
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDate(day);
                return (
                  <div key={day.toISOString()} className="relative">
                    {/* En-tête du jour */}
                    <div
                      className={`text-center pb-2 border-b-2 mb-2 ${
                        isToday(day) ? 'border-bleu-principal' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-xs text-texte-principal/60">
                        {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          isToday(day) ? 'text-bleu-principal' : 'text-texte-principal'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>

                    {/* Grille horaire */}
                    <div className="relative space-y-[60px]">
                      {dayHours.map((hour) => (
                        <div key={hour} className="h-[60px] border-t border-gray-100"></div>
                      ))}
                    </div>

                    {/* Rendez-vous */}
                    {dayAppointments.map((apt) => {
                      const aptDate = new Date(apt.date);
                      const hour = aptDate.getHours();
                      const minute = aptDate.getMinutes();
                      const top = ((hour - 8) * 60 + minute) + 40; // Position en pixels

                      return (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick?.(apt)}
                          className="absolute left-0 right-0 p-2 bg-bleu-principal text-white rounded-lg text-xs cursor-pointer hover:opacity-90 transition"
                          style={{ top: `${top}px`, height: '58px' }}
                        >
                          <div className="flex items-center space-x-1 mb-1">
                            {apt.isVideo && <Video className="w-3 h-3" />}
                            <Clock className="w-3 h-3" />
                            <span className="font-bold">
                              {aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="font-medium truncate">{apt.patient.name}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue Jour */}
      {viewMode === 'day' && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Colonne des heures et rendez-vous */}
              <div>
                <h3 className="font-bold text-lg text-texte-principal mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Planning
                </h3>
                <div className="space-y-[60px]">
                  {dayHours.map((hour) => {
                    const hourAppointments = getAppointmentsForDate(currentDate).filter((apt) => {
                      const aptHour = new Date(apt.date).getHours();
                      return aptHour === hour;
                    });

                    return (
                      <div key={hour} className="flex items-start space-x-4">
                        <div className="text-sm text-texte-principal/60 font-medium min-w-[60px]">
                          {hour}:00
                        </div>
                        <div className="flex-1 space-y-2">
                          {hourAppointments.length > 0 ? (
                            hourAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                onClick={() => onAppointmentClick?.(apt)}
                                className="p-3 bg-bleu-principal/10 text-bleu-principal border-l-4 border-bleu-principal rounded-lg cursor-pointer hover:bg-bleu-principal/20 transition"
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  {apt.isVideo && <Video className="w-4 h-4" />}
                                  <Clock className="w-4 h-4" />
                                  <span className="font-bold">
                                    {new Date(apt.date).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div className="font-semibold">{apt.patient.name}</div>
                                <div className="text-sm text-texte-principal/70">{apt.type}</div>
                                {apt.reason && <div className="text-xs mt-1">{apt.reason}</div>}
                              </div>
                            ))
                          ) : (
                            <div className="h-[60px] border-t border-gray-100"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Colonne récapitulatif */}
              <div>
                <h3 className="font-bold text-lg text-texte-principal mb-4">
                  Récapitulatif de la journée
                </h3>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-texte-principal/60">Total rendez-vous</p>
                        <p className="text-3xl font-bold text-bleu-principal">
                          {getAppointmentsForDate(currentDate).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-texte-principal/60">En présentiel</p>
                        <p className="text-2xl font-semibold text-texte-principal">
                          {getAppointmentsForDate(currentDate).filter((apt) => !apt.isVideo).length}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-texte-principal/60">En visioconférence</p>
                        <p className="text-2xl font-semibold text-texte-principal">
                          {getAppointmentsForDate(currentDate).filter((apt) => apt.isVideo).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des rendez-vous du jour */}
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-texte-principal">Rendez-vous du jour</h4>
                  {getAppointmentsForDate(currentDate).length > 0 ? (
                    getAppointmentsForDate(currentDate)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((apt) => (
                        <Card
                          key={apt.id}
                          className="cursor-pointer hover:shadow-md transition"
                          onClick={() => onAppointmentClick?.(apt)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-bleu-principal" />
                                <span className="font-medium">{apt.patient.name}</span>
                              </div>
                              <Badge variant={apt.isVideo ? 'default' : 'secondary'}>
                                {apt.isVideo ? <Video className="w-3 h-3 mr-1" /> : null}
                                {apt.isVideo ? 'Visio' : 'Présentiel'}
                              </Badge>
                            </div>
                            <div className="text-sm text-texte-principal/70">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(apt.date).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              - {apt.type}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <p className="text-sm text-texte-principal/60">Aucun rendez-vous prévu</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

