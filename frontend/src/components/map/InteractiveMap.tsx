'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocateFixed, Search, Phone, Mail, MapPin, Navigation, Route } from 'lucide-react';

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

// Icône personnalisée pour l'utilisateur
const UserIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="32" height="32">
        <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

// Icône personnalisée pour les hôpitaux
const HospitalIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" width="32" height="32">
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm-1 14H9v-2h2v-2h2v2h2v2h-2v2h-2v-2z" fill="#ef4444" stroke="white" stroke-width="1"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Composant pour recentrer la carte
const RecenterMap = ({ position }: { position: LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, 13);
  }, [position, map]);
  return null;
};

interface HealthCenter {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  distance?: number; // En km
}

const InteractiveMap = () => {
  const [position, setPosition] = useState<LatLngExpression>([12.6392, -8.0029]); // Bamako
  const [searchQuery, setSearchQuery] = useState('');
  const [healthCenters, setHealthCenters] = useState<HealthCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<HealthCenter | null>(null);

  const { data: geoData, getLocation, loading: geoLoading } = useGeolocation();

  // Récupérer tous les centres au chargement
  useEffect(() => {
    fetchHealthCenters();
  }, []);

  // Mettre à jour la position quand la géolocalisation est disponible
  useEffect(() => {
    if (geoData) {
      setPosition([geoData.latitude, geoData.longitude]);
      // Récupérer les centres avec distances
      fetchHealthCenters(geoData.latitude, geoData.longitude);
    }
  }, [geoData]);

  const fetchHealthCenters = async (lat?: number, lon?: number, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lat !== undefined && lon !== undefined) {
        params.append('lat', lat.toString());
        params.append('lon', lon.toString());
      }
      params.append('limit', '50');

      const response = await fetch(`http://localhost:3001/api/healthcenters?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setHealthCenters(data);
      } else {
        console.error('Erreur lors de la récupération des centres de santé');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (geoData) {
      fetchHealthCenters(geoData.latitude, geoData.longitude, searchQuery);
    } else {
      fetchHealthCenters(undefined, undefined, searchQuery);
    }
  };

  const handleCenterClick = (center: HealthCenter) => {
    setSelectedCenter(center);
    if (center.latitude && center.longitude) {
      setPosition([center.latitude, center.longitude]);
    }
  };

  const openItinerary = (center: HealthCenter) => {
    if (!center.latitude || !center.longitude) return;
    
    // Utiliser Google Maps pour l'itinéraire
    const url = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full h-full flex gap-4">
      {/* Panneau latéral */}
      <div className="w-96 flex flex-col gap-4 overflow-y-auto">
        {/* Barre de recherche */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Rechercher un centre de santé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Point G, Gabriel Touré..."
              />
              <Button type="submit" disabled={loading} size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </form>
            <Button 
              onClick={() => getLocation()} 
              variant="outline" 
              disabled={geoLoading}
              className="w-full"
            >
              <LocateFixed className="w-4 h-4 mr-2" />
              {geoLoading ? 'Localisation...' : 'Utiliser ma position'}
            </Button>
          </CardContent>
        </Card>

        {/* Liste des centres */}
        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-texte-principal/60">Chargement...</p>
              </CardContent>
            </Card>
          ) : healthCenters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-texte-principal/60">Aucun centre de santé trouvé</p>
              </CardContent>
            </Card>
          ) : (
            healthCenters.map((center) => (
              <Card 
                key={center.id}
                className={`transition-all hover:shadow-md ${
                  selectedCenter?.id === center.id ? 'ring-2 ring-bleu-clair' : ''
                }`}
              >
                <CardContent className="py-4">
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleCenterClick(center)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-texte-principal">{center.name}</h3>
                        <div className="flex items-start mt-2 text-sm text-texte-principal/70">
                          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{center.address}, {center.city}</span>
                        </div>
                        {center.phone && (
                          <div className="flex items-center mt-1 text-sm text-texte-principal/70">
                            <Phone className="w-4 h-4 mr-1" />
                            <span>{center.phone}</span>
                          </div>
                        )}
                      </div>
                      {center.distance !== undefined && (
                        <div className="ml-3 flex flex-col items-end">
                          <div className="text-bleu-clair font-semibold text-lg">
                            {center.distance.toFixed(1)} km
                          </div>
                          <Navigation className="w-4 h-4 text-bleu-clair mt-1" />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Bouton itinéraire */}
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openItinerary(center);
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Route className="w-4 h-4 mr-2" />
                      Itinéraire
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Carte */}
      <div className="flex-grow rounded-lg overflow-hidden shadow-lg">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Marqueur de l'utilisateur */}
          {geoData && (
            <>
              <Marker 
                position={[geoData.latitude, geoData.longitude]}
                icon={UserIcon}
              >
                <Popup>
                  <div className="text-center">
                    <strong>📍 Vous êtes ici</strong>
                  </div>
                </Popup>
              </Marker>
              {/* Cercle autour de la position de l'utilisateur */}
              <Circle
                center={[geoData.latitude, geoData.longitude]}
                radius={5000} // 5km
                pathOptions={{ 
                  color: '#3b82f6', 
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  weight: 2 
                }}
              />
            </>
          )}

          {/* Marqueurs des centres de santé */}
          <MarkerClusterGroup chunkedLoading>
            {healthCenters
              .filter(center => center.latitude && center.longitude)
              .map(center => (
                <Marker 
                  key={center.id} 
                  position={[center.latitude!, center.longitude!]}
                  icon={HospitalIcon}
                  eventHandlers={{
                    click: () => handleCenterClick(center),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-base mb-2">{center.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-start">
                          <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{center.address}, {center.city}</span>
                        </p>
                        {center.phone && (
                          <p className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            <a href={`tel:${center.phone}`} className="text-bleu-clair hover:underline">
                              {center.phone}
                            </a>
                          </p>
                        )}
                        {center.email && (
                          <p className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            <a href={`mailto:${center.email}`} className="text-bleu-clair hover:underline">
                              {center.email}
                            </a>
                          </p>
                        )}
                        {center.distance !== undefined && (
                          <p className="text-bleu-clair font-semibold mt-2">
                            📍 À {center.distance.toFixed(1)} km de vous
                          </p>
                        )}
                        <button
                          onClick={() => openItinerary(center)}
                          className="w-full mt-3 px-3 py-2 bg-bleu-clair text-blanc-pur rounded-lg hover:bg-bleu-clair/90 transition-colors flex items-center justify-center text-sm font-medium"
                        >
                          <Route className="w-4 h-4 mr-1" />
                          Obtenir l'itinéraire
                        </button>
                      </div>
                    </div>
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
