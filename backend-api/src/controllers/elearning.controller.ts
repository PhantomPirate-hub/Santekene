import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { Role } from '@prisma/client';
import * as hederaService from '../services/hedera.service.js';

/**
 * Contrôleur pour l'e-learning
 */

/**
 * Récupérer tous les cours disponibles
 */
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const { category, difficulty, search, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (category) {
      where.category = category as string;
    }

    if (difficulty) {
      where.difficulty = difficulty as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.eLearningCourse.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.eLearningCourse.count({ where }),
    ]);

    return res.status(200).json({
      courses,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer un cours par ID
 */
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const course = await prisma.eLearningCourse.findUnique({
      where: { id: parseInt(id) },
    });

    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    return res.status(200).json(course);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer un nouveau cours (Admin/SuperAdmin uniquement)
 */
export const createCourse = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const {
      title,
      description,
      content,
      category,
      difficulty,
      duration,
      kenePointsReward,
      certificationNFT,
    } = req.body;

    // Validation
    if (!title || !description || !content || !category) {
      return res.status(400).json({
        error: 'Titre, description, contenu et catégorie sont requis',
      });
    }

    const course = await prisma.eLearningCourse.create({
      data: {
        title,
        description,
        content,
        category,
        difficulty: difficulty || 'Débutant',
        duration: duration || 0,
        kenePointsReward: kenePointsReward || 0,
        certificationNFT: certificationNFT || false,
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_COURSE',
        userId: currentUser.id,
        details: `Cours créé: ${title}`,
      },
    });

    return res.status(201).json({
      message: 'Cours créé avec succès',
      course,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour un cours (Admin/SuperAdmin uniquement)
 */
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const {
      title,
      description,
      content,
      category,
      difficulty,
      duration,
      kenePointsReward,
      certificationNFT,
    } = req.body;

    const course = await prisma.eLearningCourse.findUnique({
      where: { id: parseInt(id) },
    });

    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (difficulty) updateData.difficulty = difficulty;
    if (duration !== undefined) updateData.duration = duration;
    if (kenePointsReward !== undefined) updateData.kenePointsReward = kenePointsReward;
    if (certificationNFT !== undefined) updateData.certificationNFT = certificationNFT;

    const updatedCourse = await prisma.eLearningCourse.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_COURSE',
        userId: currentUser.id,
        details: `Cours ${id} mis à jour`,
      },
    });

    return res.status(200).json({
      message: 'Cours mis à jour avec succès',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un cours (Admin/SuperAdmin uniquement)
 */
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    const course = await prisma.eLearningCourse.findUnique({
      where: { id: parseInt(id) },
    });

    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    await prisma.eLearningCourse.delete({
      where: { id: parseInt(id) },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_COURSE',
        userId: currentUser.id,
        details: `Cours ${course.title} supprimé`,
      },
    });

    return res.status(200).json({
      message: 'Cours supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Inscrire l'utilisateur connecté à un cours
 */
export const enrollInCourse = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { courseId } = req.params;

    const course = await prisma.eLearningCourse.findUnique({
      where: { id: parseInt(courseId) },
    });

    if (!course) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingEnrollment = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: parseInt(courseId),
        },
      },
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Vous êtes déjà inscrit à ce cours' });
    }

    // Inscrire l'utilisateur
    const enrollment = await prisma.userCourse.create({
      data: {
        userId,
        courseId: parseInt(courseId),
        progress: 0,
        completed: false,
      },
      include: {
        course: true,
      },
    });

    return res.status(201).json({
      message: 'Inscription réussie',
      enrollment,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les cours de l'utilisateur connecté
 */
export const getMyCourses = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const enrollments = await prisma.userCourse.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    });

    return res.status(200).json(enrollments);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour la progression d'un cours
 */
export const updateCourseProgress = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { courseId } = req.params;
    const { progress } = req.body;

    // Validation
    if (progress < 0 || progress > 100) {
      return res.status(400).json({
        error: 'La progression doit être entre 0 et 100',
      });
    }

    const enrollment = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: parseInt(courseId),
        },
      },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Vous n\'êtes pas inscrit à ce cours' });
    }

    const completed = progress >= 100;

    // Mettre à jour la progression
    const updatedEnrollment = await prisma.userCourse.update({
      where: {
        userId_courseId: {
          userId,
          courseId: parseInt(courseId),
        },
      },
      data: {
        progress,
        completed,
        ...(completed && { completedAt: new Date() }),
      },
      include: {
        course: true,
      },
    });

    // Si le cours est terminé et qu'il y a des récompenses
    if (completed && !enrollment.completed) {
      // Attribuer les KènèPoints
      if (enrollment.course.kenePointsReward > 0) {
        const patient = await prisma.patient.findUnique({
          where: { userId },
        });

        if (patient) {
          await prisma.kenePoints.create({
            data: {
              patientId: patient.id,
              points: enrollment.course.kenePointsReward,
              reason: `Cours terminé: ${enrollment.course.title}`,
              date: new Date(),
            },
          });
        }
      }

      // Créer un NFT de certification si activé
      if (enrollment.course.certificationNFT) {
        try {
          const metadata = {
            type: 'certification',
            courseId: enrollment.course.id,
            courseTitle: enrollment.course.title,
            userId,
            completedAt: new Date().toISOString(),
          };

          const nftData = await hederaService.createNft(
            'Certification e-Learning',
            'CERT',
            JSON.stringify(metadata)
          );

          // Enregistrer la certification
          await prisma.nFTCertification.create({
            data: {
              userId,
              tokenId: nftData.tokenId,
              serialNumber: nftData.serialNumber,
              type: 'COURSE_COMPLETION',
              title: `Certification: ${enrollment.course.title}`,
              description: `Certification pour la complétion du cours ${enrollment.course.title}`,
              metadata: JSON.stringify(metadata),
            },
          });

          // Enregistrer la transaction Hedera
          await prisma.hederaTransaction.create({
            data: {
              transactionId: nftData.transactionId,
              type: 'NFT_MINT',
              userId,
              amount: 1,
              details: `NFT Certification créé - Token: ${nftData.tokenId}`,
            },
          });
        } catch (error) {
          console.error('Erreur lors de la création du NFT de certification:', error);
          // Continue même si le NFT échoue
        }
      }

      // Créer une notification
      await prisma.notification.create({
        data: {
          userId,
          type: 'ELEARNING',
          title: 'Cours terminé !',
          message: `Félicitations ! Vous avez terminé le cours "${enrollment.course.title}". ${
            enrollment.course.kenePointsReward > 0
              ? `Vous avez gagné ${enrollment.course.kenePointsReward} KènèPoints !`
              : ''
          }`,
          isRead: false,
        },
      });
    }

    return res.status(200).json({
      message: completed ? 'Cours terminé avec succès !' : 'Progression mise à jour',
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les certifications de l'utilisateur connecté
 */
export const getMyCertifications = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const certifications = await prisma.nFTCertification.findMany({
      where: { userId },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return res.status(200).json(certifications);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Vérifier une certification par token ID
 */
export const verifyCertification = async (req: Request, res: Response) => {
  try {
    const { tokenId, serialNumber } = req.params;

    const certification = await prisma.nFTCertification.findFirst({
      where: {
        tokenId,
        serialNumber: parseInt(serialNumber),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!certification) {
      return res.status(404).json({
        verified: false,
        error: 'Certification non trouvée',
      });
    }

    return res.status(200).json({
      verified: true,
      certification: {
        id: certification.id,
        type: certification.type,
        title: certification.title,
        description: certification.description,
        issuedAt: certification.issuedAt,
        holder: certification.user.name,
        nft: {
          tokenId: certification.tokenId,
          serialNumber: certification.serialNumber,
        },
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

