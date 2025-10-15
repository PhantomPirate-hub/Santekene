'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Shield, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';

const settingsNavItems = [
  { id: 'profile', label: 'Profil', icon: User, href: '/dashboard/settings' },
  { id: 'security', label: 'Sécurité', icon: Shield, href: '/dashboard/settings/security' },
  { id: 'notifications', label: 'Notifications', icon: Bell, href: '/dashboard/settings/notifications' },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <Card className="lg:col-span-1 bg-blanc-pur shadow-md rounded-2xl p-4">
        <nav className="flex flex-col space-y-2">
          {settingsNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-nuit-confiance/80 font-medium',
                pathname === item.href
                  ? 'bg-aqua-moderne/20 text-aqua-moderne font-bold'
                  : 'hover:bg-fond-doux'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </Card>
      <Card className="lg:col-span-3 bg-blanc-pur shadow-md rounded-2xl p-6">
        {children}
      </Card>
    </div>
  );
};

export default SettingsLayout;
