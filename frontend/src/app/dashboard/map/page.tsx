
'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import HeartbeatLoader from '@/components/shared/HeartbeatLoader';

export default function MapPage() {
  // Importation dynamique du composant de la carte pour éviter les problèmes de SSR avec Leaflet
  const Map = useMemo(() => dynamic(() => import('@/components/map/InteractiveMap'), { 
    loading: () => <HeartbeatLoader />,
    ssr: false 
  }), []);

  return (
    <div className="w-full h-[calc(100vh-150px)]">
      <h1 className="text-2xl font-bold mb-4">Carte des établissements de santé</h1>
      <Map />
    </div>
  );
}
