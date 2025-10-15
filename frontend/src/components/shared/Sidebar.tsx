'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BrainCircuit,
  GraduationCap,
  AreaChart,
  Settings
} from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/community', label: 'Communauté', icon: Users },
  { href: '/dashboard/dse', label: 'DSE', icon: FolderKanban },
  { href: '/dashboard/ai', label: 'IA Clinique', icon: BrainCircuit },
  { href: '/dashboard/elearning', label: 'E-learning', icon: GraduationCap },
  { href: '/dashboard/monitoring', label: 'Monitoring', icon: AreaChart },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-blanc-pur border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard">
          <img src="/assets/logo.png" alt="Santé Kènè Logo" className="h-12 mx-auto" />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-texte-principal/80 font-medium',
                isActive
                  ? 'bg-bleu-clair/30 text-bleu-clair-foreground font-bold text-texte-principal'
                  : 'hover:bg-bleu-clair/20'
              )}
            >
              <link.icon className="w-6 h-6" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
         <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-texte-principal/80 font-medium',
              pathname.startsWith("/dashboard/settings")
                ? 'bg-bleu-clair/30 text-bleu-clair-foreground font-bold text-texte-principal'
                : 'hover:bg-bleu-clair/20'
            )}
          >
            <Settings className="w-6 h-6" />
            <span>Paramètres</span>
          </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
