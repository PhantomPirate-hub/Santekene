import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

/**
 * Contrôleur pour les médecins
 */

/**
 * Récupérer le profil du médecin connecté
 */
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    return res.status(200).json(doctor);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour le profil du médecin connecté
 */
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { speciality, licenseNumber } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Mettre à jour le profil médecin
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        ...(speciality && { speciality }),
        ...(licenseNumber && { licenseNumber }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Profil mis à jour avec succès',
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer tous les rendez-vous du médecin connecté
 */
export const getMyAppointments = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { status, date } = req.query;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Construire le filtre
    const where: any = {
      doctorId: doctor.id,
    };

    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);

      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return res.status(200).json(appointments);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Accepter un rendez-vous
 */
export const acceptAppointment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que le rendez-vous appartient au médecin
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    if (appointment.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Seuls les rendez-vous en attente peuvent être acceptés',
      });
    }

    // Accepter le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Créer une notification pour le patient
    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: 'APPOINTMENT_UPDATE',
        title: 'Rendez-vous confirmé',
        message: `Votre rendez-vous du ${new Date(appointment.date).toLocaleDateString('fr-FR')} a été confirmé par le médecin.`,
        isRead: false,
      },
    });

    return res.status(200).json({
      message: 'Rendez-vous confirmé avec succès',
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Rejeter un rendez-vous
 */
export const rejectAppointment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Vérifier que le rendez-vous appartient au médecin
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id) },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    if (appointment.doctorId !== doctor.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    if (appointment.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Seuls les rendez-vous en attente peuvent être rejetés',
      });
    }

    // Rejeter le rendez-vous
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CANCELLED',
        notes: rejectionReason
          ? `Rejeté: ${rejectionReason}`
          : 'Rejeté par le médecin',
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Créer une notification pour le patient
    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: 'APPOINTMENT_UPDATE',
        title: 'Rendez-vous annulé',
        message: rejectionReason
          ? `Votre rendez-vous a été annulé. Motif: ${rejectionReason}`
          : 'Votre rendez-vous a été annulé par le médecin.',
        isRead: false,
      },
    });

    return res.status(200).json({
      message: 'Rendez-vous rejeté avec succès',
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer toutes les consultations du médecin connecté
 */
export const getMyConsultations = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    const consultations = await prisma.consultation.findMany({
      where: {
        doctorId: doctor.id,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        prescription: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return res.status(200).json(consultations);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les statistiques du médecin
 */
export const getMyStats = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const doctor = await prisma.doctor.findUnique({
      where: { userId },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Profil médecin non trouvé' });
    }

    // Récupérer les statistiques
    const totalAppointments = await prisma.appointment.count({
      where: { doctorId: doctor.id },
    });

    const pendingAppointments = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: 'PENDING',
      },
    });

    const confirmedAppointments = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: 'CONFIRMED',
      },
    });

    const completedAppointments = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: 'COMPLETED',
      },
    });

    const totalConsultations = await prisma.consultation.count({
      where: { doctorId: doctor.id },
    });

    const totalPrescriptions = await prisma.prescription.count({
      where: {
        consultation: {
          doctorId: doctor.id,
        },
      },
    });

    // Patients uniques
    const uniquePatients = await prisma.consultation.findMany({
      where: { doctorId: doctor.id },
      select: { patientId: true },
      distinct: ['patientId'],
    });

    // Prochains rendez-vous
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        date: { gte: new Date() },
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
      take: 5,
    });

    return res.status(200).json({
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      totalConsultations,
      totalPrescriptions,
      totalPatients: uniquePatients.length,
      upcomingAppointments,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

