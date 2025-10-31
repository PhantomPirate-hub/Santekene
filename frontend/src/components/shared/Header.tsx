'use client';

import { Bell, ChevronDown, Menu, Globe, User, Settings, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// Fonction pour générer un titre à partir du chemin d'accès
const getTitle = (pathname: string) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Accueil';
    const title = segments.slice(1).join(' ').replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
    const pathname = usePathname();
    const title = getTitle(pathname);
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fermer le dropdown si on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Obtenir le nom d'affichage selon le rôle
    const getDisplayName = () => {
        if (!user) return 'Utilisateur';
        return user.name || user.email;
    };

    // Badge du rôle
    const getRoleBadge = () => {
        if (!user) return '';
        const roleLabels = {
            PATIENT: 'Patient',
            MEDECIN: 'Médecin',
            ADMIN: 'Admin',
            SUPERADMIN: 'Super Admin',
        };
        return roleLabels[user.role] || user.role;
    };

    return (
        <header className="bg-blanc-pur shadow-sm p-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center">
                <button onClick={onMenuClick} className="lg:hidden mr-4 text-texte-principal">
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold text-texte-principal">{title}</h1>
            </div>
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 cursor-pointer text-texte-principal/80 hover:text-texte-principal">
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">FR</span>
                </div>
                <Bell className="w-6 h-6 text-texte-principal/80 cursor-pointer hover:text-texte-principal" />
                
                {/* Dropdown utilisateur */}
                <div className="relative" ref={dropdownRef}>
                    <div 
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="w-10 h-10 rounded-full bg-bleu-clair/20 border-2 border-bleu-clair flex items-center justify-center">
                            <User className="w-5 h-5 text-bleu-clair" />
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="font-semibold text-texte-principal text-sm">{getDisplayName()}</p>
                            <p className="text-xs text-texte-principal/60">{getRoleBadge()}</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-texte-principal/80 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Menu dropdown */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-blanc-pur rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            {/* Info utilisateur */}
                            <div className="px-4 py-3 border-b border-gray-200">
                                <p className="font-semibold text-texte-principal">{getDisplayName()}</p>
                                <p className="text-sm text-texte-principal/60">{user?.email}</p>
                                <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full bg-bleu-clair/20 text-bleu-clair">
                                    {getRoleBadge()}
                                </span>
                            </div>

                            {/* Menu items */}
                            <div className="py-1">
                                <Link
                                    href="/dashboard/settings"
                                    className="flex items-center space-x-3 px-4 py-2 text-sm text-texte-principal hover:bg-gray-50 transition-colors"
                                    onClick={() => setIsDropdownOpen(false)}
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Paramètres</span>
                                </Link>
                            </div>

                            {/* Déconnexion */}
                            <div className="border-t border-gray-200 mt-1 pt-1">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        logout();
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Déconnexion</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
