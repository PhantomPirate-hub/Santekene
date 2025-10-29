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
  Award,
  Shield,
  Calendar,
  Bell,
  Activity,
  UserCheck,
  Coins,
  Tags,
  MessageSquare
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';

// Définition des liens avec les rôles autorisés
const navLinks = [
  // Patient et Médecin
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard, roles: ['PATIENT', 'MEDECIN'] },
  
  // Patient (ordre demandé)
  { href: '/dashboard/dse', label: 'Mon DSE', icon: FolderKanban, roles: ['PATIENT'] },
  { href: '/dashboard/patient/prescriptions', label: 'Mes Ordonnances', icon: FileText, roles: ['PATIENT'] },
  { href: '/dashboard/patient/appointments', label: 'Mes RDV', icon: Users, roles: ['PATIENT'] },
  { href: '/dashboard/patient/triage', label: 'IA Clinique', icon: BrainCircuit, roles: ['PATIENT'] },
  { href: '/dashboard/wallet', label: 'Mon Portefeuille', icon: Coins, roles: ['PATIENT'] },
  { href: '/dashboard/map', label: 'Carte', icon: Map, roles: ['PATIENT', 'MEDECIN'] },
  { href: '/dashboard/community', label: 'Communauté', icon: Users, roles: ['PATIENT', 'MEDECIN'] },
  { href: '/dashboard/patient/dse-access', label: 'Demandes d\'accès', icon: Shield, roles: ['PATIENT'] },

  // Médecin
  { href: '/dashboard/medecin/consultations', label: 'Consultations', icon: Stethoscope, roles: ['MEDECIN'] },
  { href: '/dashboard/medecin/historique', label: 'Historique', icon: FileText, roles: ['MEDECIN'] },
  { href: '/dashboard/medecin/rdv', label: 'Mes RDV', icon: Calendar, roles: ['MEDECIN'] },
  { href: '/dashboard/wallet', label: 'Mon Portefeuille', icon: Coins, roles: ['MEDECIN'] },
  { href: '/dashboard/medecin/stats', label: 'Statistiques', icon: BarChart3, roles: ['MEDECIN'] },

  // Admin (Responsable de structure)
  { href: '/dashboard/admin', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['ADMIN'] },
  { href: '/dashboard/admin/doctors/pending', label: 'Demandes', icon: UserCheck, roles: ['ADMIN'] },
  { href: '/dashboard/admin/doctors', label: 'Médecins', icon: Stethoscope, roles: ['ADMIN'] },
  { href: '/dashboard/admin/activities', label: 'Activités', icon: Activity, roles: ['ADMIN'] },

  // Super Admin
  { href: '/dashboard/superadmin', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPERADMIN'] },
  { href: '/dashboard/superadmin/facilities', label: 'Structures', icon: Shield, roles: ['SUPERADMIN'] },
  { href: '/dashboard/superadmin/users', label: 'Utilisateurs', icon: Users, roles: ['SUPERADMIN'] },
  { href: '/dashboard/superadmin/categories', label: 'Catégories', icon: Tags, roles: ['SUPERADMIN'] },
  { href: '/dashboard/community', label: 'Communauté', icon: MessageSquare, roles: ['SUPERADMIN'] },
  { href: '/dashboard/superadmin/monitoring', label: 'Monitoring', icon: Activity, roles: ['SUPERADMIN'] },
  { href: '/dashboard/superadmin/create-admin', label: 'Créer Admin', icon: ShieldCheck, roles: ['SUPERADMIN'] },
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
    <aside className="w-64 bg-blanc-pur border-r border-border flex flex-col h-screen">
      <div className="p-6 border-b border-border flex-shrink-0">
        <Link href="/dashboard">
          <img src="/assets/logo.png" alt="Santé Kènè Logo" className="h-20 mx-auto" />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
      <div className="p-4 border-t border-border flex-shrink-0">
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
