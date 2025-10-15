'use client';

import { Bell, ChevronDown, Menu, Globe } from 'lucide-react';
import { usePathname } from 'next/navigation';

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
                <div className="flex items-center space-x-2 cursor-pointer">
                    <img
                        src="https://i.pravatar.cc/40"
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full border-2 border-bleu-clair"
                    />
                    <span className="hidden md:block font-semibold text-texte-principal">Dr. Dupont</span>
                    <ChevronDown className="w-5 h-5 text-texte-principal/80" />
                </div>
            </div>
        </header>
    );
};

export default Header;
