import pkg from 'express';
const { Request, Response } = pkg;
import { prisma } from '../services/prisma.service.ts';



export const getPatientById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const loggedInUser = req.user;

  if (!loggedInUser) {
    return res.status(401).json({ message: 'Utilisateur non authentifié.' });
  }

  const targetUserId = parseInt(id);

  // L'admin ou le médecin peuvent voir n'importe quelle fiche patient.
  // Le patient ne peut voir que sa propre fiche.
  const isAuthorized = 
    loggedInUser.role === Role.ADMIN ||
    loggedInUser.role === Role.MEDECIN ||
    (loggedInUser.role === Role.PATIENT && loggedInUser.id === targetUserId);

  if (!isAuthorized) {
    return res.status(403).json({ message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: targetUserId },
      include: {
        user: true, // Inclut les données de l'utilisateur associé
        allergies: true, // Inclut les allergies
        // Ajoutez d'autres relations si nécessaire (consultations, documents, etc.)
      },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé.' });
    }

    // Formater la réponse pour correspondre à ce que le frontend attend
    const formattedPatient = {
      id: patient.user.id.toString(),
      name: patient.user.name || 'N/A',
      email: patient.user.email,
      age: patient.birthDate ? new Date().getFullYear() - patient.birthDate.getFullYear() : undefined,
      gender: patient.gender || 'N/A',
      avatar: patient.user.avatar || 'https://i.pravatar.cc/100?u=' + patient.user.email, // Utilise l'email pour un avatar unique
      allergies: patient.allergies.map(a => a.name),
      chronic: [], // À remplir avec les données réelles si disponibles
      lastVisit: 'N/A', // À remplir avec les données réelles si disponibles
      weight: 'N/A',
      tension: 'N/A',
      role: patient.user.role,
    };

    return res.status(200).json(formattedPatient);
  } catch (error) {
    console.error('Erreur lors de la récupération du patient:', error);
    return res.status(500).json({ message: 'Erreur serveur interne lors de la récupération du patient.' });
  }
};
