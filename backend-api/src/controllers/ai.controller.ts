import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

/**
 * Contrôleur pour les recommandations IA
 */

/**
 * Récupérer les médecins recommandés basés sur les spécialités
 */
export const getRecommendedDoctors = async (req: Request, res: Response) => {
  try {
    const { specialties } = req.query;

    if (!specialties || typeof specialties !== 'string') {
      return res.status(400).json({ error: 'Les spécialités sont requises' });
    }

    // Convertir la chaîne en tableau
    const specialtyList = specialties.split(',').map(s => s.trim());
    // Rechercher les médecins avec ces spécialités
    const doctors = await prisma.doctor.findMany({
      where: {
        OR: specialtyList.map((specialty: string) => ({
          speciality: {
            contains: specialty,
          },
        })),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
      take: 5, // Limiter à 5 médecins
    });
    // Formater les résultats
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      userId: doctor.userId,
      name: doctor.user.name,
      specialty: doctor.speciality, // ✅ Correction: speciality (DB) → specialty (API)
      email: doctor.user.email,
      phone: doctor.user.phone,
      licenseNumber: doctor.licenseNumber,
      structure: doctor.structure,
      location: doctor.location,
      doctorPhone: doctor.phone, // Numéro direct du médecin
      available: true, // TODO: Vérifier la disponibilité réelle
    }));

    return res.status(200).json({
      doctors: formattedDoctors,
      count: formattedDoctors.length,
    });
  } catch (error) {
    console.error('❌ Erreur récupération médecins:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les hôpitaux recommandés basés sur la localisation
 */
export const getRecommendedHealthCenters = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, limit = '3' } = req.query;

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);

    // Si pas de coordonnées, retourner les 3 premiers hôpitaux
    if (!latitude || !longitude || isNaN(lat) || isNaN(lon)) {
      const healthCenters = await prisma.healthCenter.findMany({
        take: parseInt(limit as string),
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json({
        healthCenters,
        count: healthCenters.length,
      });
    }

    // Calculer la distance pour chaque hôpital (formule de Haversine)
    const healthCenters = await prisma.healthCenter.findMany();

    const healthCentersWithDistance = healthCenters.map(center => {
      const distance = calculateDistance(lat, lon, center.latitude || 0, center.longitude || 0);
      return {
        ...center,
        distance: Math.round(distance * 10) / 10, // Arrondir à 1 décimale
      };
    });

    // Trier par distance et prendre les N premiers
    const sortedHealthCenters = healthCentersWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit as string));

    return res.status(200).json({
      healthCenters: sortedHealthCenters,
      count: sortedHealthCenters.length,
    });
  } catch (error) {
    console.error('❌ Erreur récupération hôpitaux:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Calculer la distance entre deux points (formule de Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

