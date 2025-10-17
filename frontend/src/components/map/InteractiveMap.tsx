
'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression, LatLng } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster'; // react-leaflet-cluster est un wrapper populaire pour leaflet.markercluster

import { useGeolocation } from '@/hooks/useGeolocation';
import { useNominatimSearch, NominatimResult } from '@/hooks/useNominatimSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocateFixed, Search } from 'lucide-react';

// Correction pour un bug avec les icônes par défaut de Leaflet dans Next.js
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Composant pour recentrer la carte
const RecenterMap = ({ position }: { position: LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 15);
  }, [position, map]);
  return null;
};

const InteractiveMap = () => {
  const [position, setPosition] = useState<LatLngExpression>([12.6392, -8.0029]); // Bamako
  const [searchQuery, setSearchQuery] = useState('hospital');

  const { data: geoData, getLocation, loading: geoLoading } = useGeolocation();
  const { results: searchResults, search, loading: searchLoading } = useNominatimSearch();

  useEffect(() => {
    if (geoData) {
      setPosition([geoData.latitude, geoData.longitude]);
    }
  }, [geoData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchQuery);
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-grow flex gap-2">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ex: hospital, pharmacy..."
          />
          <Button type="submit" disabled={searchLoading}>
            <Search className="w-4 h-4 mr-2" />
            {searchLoading ? 'Recherche...' : 'Rechercher'}
          </Button>
        </form>
        <Button onClick={() => getLocation()} variant="outline" disabled={geoLoading}>
          <LocateFixed className="w-4 h-4 mr-2" />
          {geoLoading ? '...' : 'Ma position'}
        </Button>
      </div>

      <div className="flex-grow rounded-lg overflow-hidden">
        <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {geoData && (
            <Marker position={[geoData.latitude, geoData.longitude]}>
              <Popup>Vous êtes ici.</Popup>
            </Marker>
          )}

          <MarkerClusterGroup chunkedLoading> // Pour de meilleures performances
            {searchResults.map(result => (
              <Marker key={result.place_id} position={[parseFloat(result.lat), parseFloat(result.lon)]}>
                <Popup>
                  <b>{result.address.amenity || result.display_name.split(',')[0]}</b><br />
                  {result.display_name}
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>

          <RecenterMap position={position} />
        </MapContainer>
      </div>
    </div>
  );
};

export default InteractiveMap;
