
'use client';

import { useState } from 'react';

// --- Types pour les résultats de Nominatim ---
export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    amenity?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
}

interface NominatimSearchState {
  loading: boolean;
  error: Error | null;
  results: NominatimResult[];
}

export const useNominatimSearch = () => {
  const [state, setState] = useState<NominatimSearchState>({
    loading: false,
    error: null,
    results: [],
  });

  const search = async (query: string, countryCode = 'ml') => {
    setState({ loading: true, error: null, results: [] });

    // Requête spécifique pour les établissements de santé (hôpitaux, cliniques, etc.)
    const structuredQuery = {
        amenity: query, // ex: 'hospital', 'clinic', 'pharmacy'
        country: countryCode
    };

    const params = new URLSearchParams({
        format: 'jsonv2',
        q: query, // Garde la recherche libre possible
        countrycodes: countryCode,
        // Recherche plus ciblée sur les établissements de santé
        // "amenity" est une clé OpenStreetMap commune pour cela
        tag: 'amenity:hospital,clinic,doctors,pharmacy',
        limit: '50' // Limite le nombre de résultats
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.statusText}`);
      }

      const data: NominatimResult[] = await response.json();
      setState({ loading: false, error: null, results: data });

    } catch (error: any) {
      console.error("Erreur lors de la recherche Nominatim:", error);
      setState({ loading: false, error, results: [] });
    }
  };

  return { ...state, search };
};
