import { Router } from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  getCategories,
  getMyPosts,
} from '../controllers/community.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Posts
router.get('/posts', getAllPosts); // Liste des posts
router.get('/my-posts', getMyPosts); // Mes posts
router.get('/posts/:id', getPostById); // Détails d'un post
router.post('/posts', createPost); // Créer un post
router.put('/posts/:id', updatePost); // Modifier un post
router.delete('/posts/:id', deletePost); // Supprimer un post

// Likes
router.post('/posts/:id/like', toggleLike); // Liker/Unliker un post

// Commentaires
router.post('/posts/:id/comments', addComment); // Ajouter un commentaire
router.delete('/posts/:postId/comments/:commentId', deleteComment); // Supprimer un commentaire

// Catégories
router.get('/categories', getCategories); // Liste des catégories

export default router;

