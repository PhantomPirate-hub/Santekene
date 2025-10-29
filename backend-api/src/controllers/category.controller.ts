import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

/**
 * Contrôleur pour la gestion des catégories de communauté (SuperAdmin uniquement)
 */

/**
 * Récupérer toutes les catégories
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    const where: any = {};
    
    // Par défaut, ne récupérer que les catégories actives
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const categories = await prisma.communityCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return res.status(200).json({
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        isActive: cat.isActive,
        postsCount: cat._count.posts,
        createdAt: cat.createdAt,
      })),
      total: categories.length,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer une catégorie par ID
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.communityCategory.findUnique({
      where: { id: parseInt(id || '0') },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    return res.status(200).json({
      category: {
        id: category.id,
        name: category.name,
        isActive: category.isActive,
        postsCount: category._count.posts,
        createdAt: category.createdAt,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer une nouvelle catégorie (SuperAdmin uniquement)
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Vérifier que l'utilisateur est SuperAdmin
    if (currentUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux super administrateurs' });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }

    // Vérifier que le nom n'existe pas déjà
    const existingCategory = await prisma.communityCategory.findUnique({
      where: { name: name.trim() },
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Une catégorie avec ce nom existe déjà',
      });
    }

    // Créer la catégorie
    const category = await prisma.communityCategory.create({
      data: {
        name: name.trim(),
      },
    });

    return res.status(201).json({
      message: 'Catégorie créée avec succès',
      category,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour une catégorie (SuperAdmin uniquement)
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Vérifier que l'utilisateur est SuperAdmin
    if (currentUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux super administrateurs' });
    }

    const { id } = req.params;
    const { name } = req.body;

    // Vérifier que la catégorie existe
    const category = await prisma.communityCategory.findUnique({
      where: { id: parseInt(id || '0') },
    });

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }

    // Vérifier que le nouveau nom n'existe pas déjà (sauf si c'est le même)
    if (name.trim() !== category.name) {
      const existingCategory = await prisma.communityCategory.findUnique({
        where: { name: name.trim() },
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Une catégorie avec ce nom existe déjà' });
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      name: name.trim(),
    };

    // Mettre à jour la catégorie
    const updatedCategory = await prisma.communityCategory.update({
      where: { id: parseInt(id || '0') },
      data: updateData,
    });

    return res.status(200).json({
      message: 'Catégorie mise à jour avec succès',
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// SUPPRESSION DÉSACTIVÉE : Trop dangereux car les posts associés seraient affectés
// Utilisez l'activation/désactivation à la place

/**
 * Activer/Désactiver une catégorie (SuperAdmin uniquement)
 */
export const toggleCategoryStatus = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Vérifier que l'utilisateur est SuperAdmin
    if (currentUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux super administrateurs' });
    }

    const { id } = req.params;

    // Vérifier que la catégorie existe
    const category = await prisma.communityCategory.findUnique({
      where: { id: parseInt(id || '0') },
    });

    if (!category) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    // Inverser le statut
    const updatedCategory = await prisma.communityCategory.update({
      where: { id: parseInt(id || '0') },
      data: {
        isActive: !category.isActive,
      },
    });

    return res.status(200).json({
      message: `Catégorie ${updatedCategory.isActive ? 'activée' : 'désactivée'} avec succès`,
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

