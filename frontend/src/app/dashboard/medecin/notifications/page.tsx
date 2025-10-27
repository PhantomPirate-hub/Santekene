'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'appointment' | 'dse_access';
  title: string;
  message: string;
  date: string;
  link: string;
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
  }, [token]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/medecin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fond p-8 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-bleu-principal" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center">
            <Bell className="w-8 h-8 mr-3 text-bleu-principal" />
            Notifications
          </h1>
          <p className="text-texte-principal/60 mt-2">
            {notifications.length} notification(s)
          </p>
        </div>

        {notifications.length === 0 ? (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <Bell className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-texte-principal/60">Aucune notification</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-bleu-principal"
                onClick={() => router.push(notif.link)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'appointment' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                      {notif.type === 'appointment' ? (
                        <Calendar className="w-5 h-5 text-orange-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-texte-principal">{notif.title}</h3>
                      <p className="text-sm text-texte-principal/70 mt-1">{notif.message}</p>
                      <p className="text-xs text-texte-principal/50 mt-2">
                        {new Date(notif.date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant={notif.type === 'appointment' ? 'default' : 'secondary'}>
                      Nouveau
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

