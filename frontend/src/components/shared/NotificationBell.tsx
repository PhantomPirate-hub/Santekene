'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function NotificationBell() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token || user?.role !== 'MEDECIN') return;
    
    const fetchNotifications = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/medecin/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unread || 0);
        }
      } catch (error) {
        console.error('Erreur notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, [token, user]);

  if (user?.role !== 'MEDECIN') return null;

  return (
    <button
      onClick={() => router.push('/dashboard/medecin/notifications')}
      className="relative p-2 rounded-full hover:bg-gray-100 transition"
    >
      <Bell className="w-6 h-6 text-texte-principal" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5">
          {unreadCount}
        </Badge>
      )}
    </button>
  );
}

