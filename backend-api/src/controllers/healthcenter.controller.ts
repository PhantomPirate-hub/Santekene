import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

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
 * Récupère tous les centres de santé
 * Optionnel : Filtrer par nom et trier par distance
 */
export const getAllHealthCenters = async (req: Request, res: Response) => {
  try {
    const { search, lat, lon, limit } = req.query;

    // Récupérer tous les centres de santé
    let healthCenters = await prisma.healthCenter.findMany({
      where: search ? {
        name: {
          contains: search as string,
          // Note: mode 'insensitive' n'est pas supporté par MySQL
        },
      } : undefined,
      orderBy: {
        name: 'asc',
      },
    });

    // Si latitude et longitude fournies, calculer les distances
    if (lat && lon) {
      const userLat = parseFloat(lat as string);
      const userLon = parseFloat(lon as string);

      healthCenters = healthCenters.map(center => ({
        ...center,
        distance: center.latitude && center.longitude
          ? calculateDistance(userLat, userLon, center.latitude, center.longitude)
          : null,
      })) as any;

      // Trier par distance (les plus proches en premier)
      healthCenters.sort((a: any, b: any) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    // Limiter le nombre de résultats si demandé
    if (limit) {
      healthCenters = healthCenters.slice(0, parseInt(limit as string));
    }

    return res.status(200).json(healthCenters);
  } catch (error) {
    console.error('Erreur lors de la récupération des centres de santé:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupère un centre de santé par ID
 */
export const getHealthCenterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const healthCenter = await prisma.healthCenter.findUnique({
      where: { id: parseInt(id) },
    });

    if (!healthCenter) {
      return res.status(404).json({ error: 'Centre de santé non trouvé' });
    }

    return res.status(200).json(healthCenter);
  } catch (error) {
    console.error('Erreur lors de la récupération du centre de santé:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Trouve les centres de santé les plus proches
 */
export const getNearestHealthCenters = async (req: Request, res: Response) => {
  try {
    const { lat, lon, limit = 10 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude et longitude requises' });
    }

    const userLat = parseFloat(lat as string);
    const userLon = parseFloat(lon as string);

    // Récupérer tous les centres avec coordonnées
    const healthCenters = await prisma.healthCenter.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ],
      },
    });

    // Calculer les distances et trier
    const centersWithDistance = healthCenters
      .map(center => ({
        ...center,
        distance: calculateDistance(userLat, userLon, center.latitude!, center.longitude!),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit as string));

    return res.status(200).json(centersWithDistance);
  } catch (error) {
    console.error('Erreur lors de la recherche des centres proches:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

