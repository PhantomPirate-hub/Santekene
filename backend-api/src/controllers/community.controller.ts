import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';

/**
 * Contrôleur pour la communauté
 */

/**
 * Récupérer tous les posts de la communauté
 */
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      published: true,
    };

    if (category) {
      where.category = category as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { content: { contains: search as string } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    // Ajouter l'information si l'utilisateur courant a liké chaque post
    const currentUser = (req as any).user;
    const postsWithLikeInfo = await Promise.all(
      posts.map(async (post) => {
        const userLike = await prisma.communityLike.findUnique({
          where: {
            postId_userId: {
              postId: post.id,
              userId: currentUser?.id || 0,
            },
          },
        });

        return {
          ...post,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          isLikedByCurrentUser: !!userLike,
        };
      })
    );

    return res.status(200).json({
      posts: postsWithLikeInfo,
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
 * Récupérer un post par ID
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Vérifier si l'utilisateur a liké
    const userLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId: post.id,
          userId: currentUser?.id || 0,
        },
      },
    });

    return res.status(200).json({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post.comments.length,
      isLikedByCurrentUser: !!userLike,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer un nouveau post
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { title, content, category, imageUrl } = req.body;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({
        error: 'Titre, contenu et catégorie sont requis',
      });
    }

    // Créer le post
    const post = await prisma.communityPost.create({
      data: {
        authorId: userId,
        title,
        content,
        category,
        imageUrl: imageUrl || null,
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_COMMUNITY_POST',
        userId,
        details: `Post créé: ${title}`,
      },
    });

    return res.status(201).json({
      message: 'Post créé avec succès',
      post: {
        ...post,
        likesCount: 0,
        commentsCount: 0,
        isLikedByCurrentUser: false,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour un post
 */
export const updatePost = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;
    const { title, content, category, imageUrl } = req.body;

    // Vérifier que le post existe et appartient à l'utilisateur
    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Mettre à jour le post
    const updatedPost = await prisma.communityPost.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_COMMUNITY_POST',
        userId,
        details: `Post ${id} mis à jour`,
      },
    });

    return res.status(200).json({
      message: 'Post mis à jour avec succès',
      post: {
        ...updatedPost,
        likesCount: updatedPost._count.likes,
        commentsCount: updatedPost._count.comments,
      },
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un post
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    // Vérifier que le post existe
    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Seul l'auteur ou un admin peut supprimer
    if (post.authorId !== userId && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Supprimer le post (cela supprimera aussi les commentaires et likes en cascade)
    await prisma.communityPost.delete({
      where: { id: parseInt(id) },
    });

    // Enregistrer dans les logs d'audit
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_COMMUNITY_POST',
        userId,
        details: `Post ${id} supprimé`,
      },
    });

    return res.status(200).json({
      message: 'Post supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Liker/Unliker un post
 */
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;

    // Vérifier que le post existe
    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà liké
    const existingLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId: parseInt(id),
          userId,
        },
      },
    });

    if (existingLike) {
      // Unliker
      await prisma.communityLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Décrémenter le compteur
      await prisma.communityPost.update({
        where: { id: parseInt(id) },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return res.status(200).json({
        message: 'Like retiré',
        isLiked: false,
      });
    } else {
      // Liker
      await prisma.communityLike.create({
        data: {
          postId: parseInt(id),
          userId,
        },
      });

      // Incrémenter le compteur
      await prisma.communityPost.update({
        where: { id: parseInt(id) },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      // Créer une notification pour l'auteur
      if (post.authorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'COMMUNITY',
            title: 'Nouveau like',
            message: `${currentUser.name} a aimé votre post: ${post.title}`,
            isRead: false,
          },
        });
      }

      return res.status(200).json({
        message: 'Post liké',
        isLiked: true,
      });
    }
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Ajouter un commentaire
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { id } = req.params;
    const { content } = req.body;

    // Validation
    if (!content) {
      return res.status(400).json({ error: 'Le contenu du commentaire est requis' });
    }

    // Vérifier que le post existe
    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Créer le commentaire
    const comment = await prisma.communityComment.create({
      data: {
        postId: parseInt(id),
        authorId: userId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    // Incrémenter le compteur de commentaires
    await prisma.communityPost.update({
      where: { id: parseInt(id) },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });

    // Créer une notification pour l'auteur du post
    if (post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'COMMUNITY',
          title: 'Nouveau commentaire',
          message: `${currentUser.name} a commenté votre post: ${post.title}`,
          isRead: false,
        },
      });
    }

    return res.status(201).json({
      message: 'Commentaire ajouté avec succès',
      comment,
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Supprimer un commentaire
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;
    const { postId, commentId } = req.params;

    // Vérifier que le commentaire existe
    const comment = await prisma.communityComment.findUnique({
      where: { id: parseInt(commentId) },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    // Seul l'auteur du commentaire ou un admin peut le supprimer
    if (comment.authorId !== userId && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Supprimer le commentaire
    await prisma.communityComment.delete({
      where: { id: parseInt(commentId) },
    });

    // Décrémenter le compteur de commentaires
    await prisma.communityPost.update({
      where: { id: parseInt(postId) },
      data: {
        commentsCount: {
          decrement: 1,
        },
      },
    });

    return res.status(200).json({
      message: 'Commentaire supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les catégories disponibles
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = [
      { value: 'Santé', label: 'Santé', icon: 'HeartPulse', color: 'text-red-600' },
      { value: 'Bien-être', label: 'Bien-être', icon: 'Sparkles', color: 'text-purple-600' },
      { value: 'Nutrition', label: 'Nutrition', icon: 'Apple', color: 'text-green-600' },
      { value: 'Sport', label: 'Sport', icon: 'Dumbbell', color: 'text-orange-600' },
      { value: 'Témoignage', label: 'Témoignage', icon: 'MessageSquare', color: 'text-blue-600' },
      { value: 'Question', label: 'Question', icon: 'HelpCircle', color: 'text-yellow-600' },
    ];

    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Récupérer les posts de l'utilisateur connecté
 */
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const userId = currentUser?.id;

    const posts = await prisma.communityPost.findMany({
      where: {
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const postsWithCounts = posts.map(post => ({
      ...post,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
    }));

    return res.status(200).json(postsWithCounts);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

