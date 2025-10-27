import { Request, Response } from 'express';
import axios from 'axios';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    'addr:street'?: string;
    'addr:city'?: string;
    'addr:housenumber'?: string;
    phone?: string;
    email?: string;
    website?: string;
    'contact:phone'?: string;
    'contact:email'?: string;
    amenity?: string;
    healthcare?: string;
  };
}

interface HealthCenter {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  distance?: number;
  type?: string;
}

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance en km
  return Math.round(distance * 100) / 100; // Arrondi à 2 décimales
}

/**
 * Récupère les centres de santé en temps réel depuis OpenStreetMap (Overpass API)
 * Recherche dynamique autour de la position de l'utilisateur
 */
export const getAllHealthCenters = async (req: Request, res: Response) => {
  try {
    const { search, lat, lon, limit = '50', radius } = req.query;

    // Vérifier que lat/lon sont fournis
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Latitude et longitude requises pour la recherche en temps réel',
        message: 'Veuillez activer votre géolocalisation'
      });
    }

    const userLat = parseFloat(lat as string);
    const userLon = parseFloat(lon as string);
    
    // Rayon de recherche adapté au contexte malien
    // Par défaut 100 km pour couvrir une zone plus large (zones rurales)
    // En ville comme Bamako, il y aura beaucoup de résultats dans ce rayon
    const searchRadius = radius ? parseInt(radius as string) * 1000 : 100000; // Convertir km en mètres

    console.log(`🔍 Recherche centres de santé autour de [${userLat}, ${userLon}] dans un rayon de ${searchRadius/1000}km`);

    // Requête Overpass API pour trouver les centres de santé
    // On recherche : hospitals, clinics, doctors, health centers
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${searchRadius},${userLat},${userLon});
        node["amenity"="clinic"](around:${searchRadius},${userLat},${userLon});
        node["amenity"="doctors"](around:${searchRadius},${userLat},${userLon});
        node["healthcare"="centre"](around:${searchRadius},${userLat},${userLon});
        node["healthcare"="hospital"](around:${searchRadius},${userLat},${userLon});
        node["healthcare"="clinic"](around:${searchRadius},${userLat},${userLon});
        way["amenity"="hospital"](around:${searchRadius},${userLat},${userLon});
        way["amenity"="clinic"](around:${searchRadius},${userLat},${userLon});
        way["amenity"="doctors"](around:${searchRadius},${userLat},${userLon});
        way["healthcare"="centre"](around:${searchRadius},${userLat},${userLon});
        way["healthcare"="hospital"](around:${searchRadius},${userLat},${userLon});
        way["healthcare"="clinic"](around:${searchRadius},${userLat},${userLon});
      );
      out center;
    `;

    // Appel à l'API Overpass
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const response = await axios.post(
      overpassUrl,
      `data=${encodeURIComponent(overpassQuery)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      }
    );

    const elements: OverpassElement[] = response.data.elements || [];
    console.log(`✅ ${elements.length} centres trouvés sur OpenStreetMap`);

    // Transformer les données OSM en format standardisé
    const healthCentersWithNull: (HealthCenter | null)[] = elements.map((element) => {
      const tags = element.tags || {};
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (!lat || !lon) return null;

      const name = tags.name || 'Centre de santé';
      const street = tags['addr:street'] || '';
      const housenumber = tags['addr:housenumber'] || '';
      const city = tags['addr:city'] || 'Mali';
      const phone = tags.phone || tags['contact:phone'] || null;
      const email = tags.email || tags['contact:email'] || null;
      const website = tags.website || null;
      const type = tags.amenity || tags.healthcare || 'health';

      const address = `${housenumber} ${street}`.trim() || 'Adresse non spécifiée';
      const distance = calculateDistance(userLat, userLon, lat, lon);

      return {
        id: element.id,
        name,
        address,
        city,
        country: 'Mali',
        latitude: lat,
        longitude: lon,
        phone,
        email,
        website,
        distance,
        type,
      };
    });

    // Filtrer les null
    let healthCenters: HealthCenter[] = healthCentersWithNull.filter(
      (center): center is HealthCenter => center !== null
    );

    // Filtrer par recherche si fournie
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      healthCenters = healthCenters.filter(
        (center) =>
          center.name.toLowerCase().includes(searchLower) ||
          center.city.toLowerCase().includes(searchLower) ||
          center.address.toLowerCase().includes(searchLower)
      );
      console.log(`🔎 Filtré à ${healthCenters.length} résultats pour "${search}"`);
    }

    // Trier par distance (les plus proches en premier)
    healthCenters.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Limiter les résultats
    healthCenters = healthCenters.slice(0, parseInt(limit as string));

    console.log(`📍 ${healthCenters.length} centres retournés au client`);

    return res.status(200).json(healthCenters);
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des centres de santé:', error.message);
    
    // Si l'API Overpass est en timeout ou indisponible
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({ 
        error: 'Service de cartographie temporairement indisponible',
        message: 'Veuillez réessayer dans quelques instants'
      });
    }

    // Si erreur réseau
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Impossible de contacter le service de cartographie',
        message: 'Vérifiez votre connexion internet'
      });
    }

    return res.status(500).json({ 
      error: 'Erreur lors de la recherche des centres de santé',
      message: error.message 
    });
  }
};

/**
 * Alias pour compatibilité avec l'ancien code
 */
export const getHealthCenterById = async (req: Request, res: Response) => {
  return res.status(501).json({ 
    error: 'Non implémenté',
    message: 'Cette fonctionnalité utilise désormais la recherche en temps réel' 
  });
};

/**
 * Alias pour compatibilité avec l'ancien code
 */
export const getNearestHealthCenters = async (req: Request, res: Response) => {
  // Rediriger vers getAllHealthCenters qui fait la même chose
  return getAllHealthCenters(req, res);
};
