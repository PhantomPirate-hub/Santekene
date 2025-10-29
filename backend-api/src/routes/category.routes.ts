import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/rbac.middleware.js';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
} from '../controllers/category.controller.js';

const router = express.Router();

/**
 * Routes pour la gestion des catégories de communauté
 * Lecture publique (avec authentification), création/modification réservée au SuperAdmin
 */

// Routes publiques (tous les utilisateurs authentifiés)
router.get('/', protect, getAllCategories); // Liste des catégories
router.get('/:id', protect, getCategoryById); // Détails d'une catégorie

// Routes SuperAdmin uniquement
router.post('/', protect, requireSuperAdmin, createCategory); // Créer une catégorie
router.put('/:id', protect, requireSuperAdmin, updateCategory); // Modifier une catégorie
router.patch('/:id/toggle', protect, requireSuperAdmin, toggleCategoryStatus); // Activer/Désactiver
// Suppression désactivée : trop dangereux

export default router;

