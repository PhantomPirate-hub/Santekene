'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import HeartbeatLoader from '@/components/shared/HeartbeatLoader';
import { MapPin } from 'lucide-react';

export default function MapPage() {
  // Importation dynamique du composant de la carte pour éviter les problèmes de SSR avec Leaflet
  const Map = useMemo(() => dynamic(() => import('@/components/map/InteractiveMap'), { 
    loading: () => <HeartbeatLoader />,
    ssr: false 
  }), []);

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col">
      {/* En-tête */}
      <div className="mb-4 bg-blanc-pur rounded-2xl p-6 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-bleu-clair/20 p-3 rounded-full">
            <MapPin className="w-6 h-6 text-bleu-clair" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-texte-principal">
              Carte des établissements de santé
            </h1>
            <p className="text-texte-principal/60 mt-1">
              Trouvez les centres de santé les plus proches de vous
            </p>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="flex-grow bg-blanc-pur rounded-2xl shadow-md overflow-hidden p-4">
        <Map />
      </div>
    </div>
  );
}
