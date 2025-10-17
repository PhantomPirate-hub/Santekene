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
  Settings,
  Stethoscope, 
  FileText, 
  BarChart3, 
  User, 
  ShieldCheck, 
  Map, 
  Award
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';

// Définition des liens avec les rôles autorisés
const navLinks = [
  // Commun
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard, roles: ['PATIENT', 'MEDECIN', 'ADMIN'] },
  
  // Patient
  { href: '/dashboard/dse', label: 'Mon DSE', icon: FolderKanban, roles: ['PATIENT'] },
  { href: '/dashboard/patient/appointments', label: 'Mes RDV', icon: Users, roles: ['PATIENT'] },
  { href: '/dashboard/map', label: 'Carte', icon: Map, roles: ['PATIENT', 'MEDECIN'] }, // Partagé
  { href: '/dashboard/kenepoints', label: 'KènèPoints', icon: Award, roles: ['PATIENT'] },

  // Médecin
  { href: '/dashboard/consultations', label: 'Consultations', icon: Stethoscope, roles: ['MEDECIN'] },
  { href: '/dashboard/prescriptions', label: 'Ordonnances', icon: FileText, roles: ['MEDECIN'] },
  { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart3, roles: ['MEDECIN'] },

  // Admin
  { href: '/dashboard/admin', label: 'Admin', icon: ShieldCheck, roles: ['ADMIN'] },
  { href: '/dashboard/users', label: 'Utilisateurs', icon: Users, roles: ['ADMIN'] },
  { href: '/dashboard/monitoring', label: 'Monitoring', icon: AreaChart, roles: ['ADMIN'] },

  // Exemples de la demande initiale (à affiner)
  { href: '/dashboard/community', label: 'Communauté', icon: Users, roles: ['PATIENT', 'MEDECIN'] },
  { href: '/dashboard/ai', label: 'IA Clinique', icon: BrainCircuit, roles: ['PATIENT', 'MEDECIN'] },
  { href: '/dashboard/elearning', label: 'E-learning', icon: GraduationCap, roles: ['PATIENT', 'MEDECIN'] },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Filtrer les liens en fonction du rôle de l'utilisateur
  const filteredNavLinks = user ? navLinks.filter(link => link.roles.includes(user.role)) : [];

  if (isLoading) {
    return (
        <aside className="w-64 bg-blanc-pur border-r border-border flex flex-col">
            <div className="p-6 border-b border-border">
                <div className="h-12 mx-auto bg-gray-200 rounded animate-pulse"></div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                ))}
            </nav>
        </aside>
    );
  }

  return (
    <aside className="w-64 bg-blanc-pur border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard">
          <img src="/assets/logo.png" alt="Santé Kènè Logo" className="h-12 mx-auto" />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
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
