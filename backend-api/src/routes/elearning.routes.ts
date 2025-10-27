import { Router } from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getMyCourses,
  updateCourseProgress,
  getMyCertifications,
  verifyCertification,
} from '../controllers/elearning.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Route publique pour vérifier une certification
router.get('/certifications/verify/:tokenId/:serialNumber', verifyCertification);

// Toutes les autres routes nécessitent une authentification
router.use(protect);

// Routes pour les cours
router.get('/courses', getAllCourses);
router.get('/courses/:id', getCourseById);

// Routes pour la gestion des cours (Admin/SuperAdmin uniquement)
router.post('/courses', authorize(Role.ADMIN, Role.SUPERADMIN), createCourse);
router.put('/courses/:id', authorize(Role.ADMIN, Role.SUPERADMIN), updateCourse);
router.delete('/courses/:id', authorize(Role.ADMIN, Role.SUPERADMIN), deleteCourse);

// Routes pour les utilisateurs (inscription, progression)
router.post('/courses/:courseId/enroll', enrollInCourse);
router.get('/my-courses', getMyCourses);
router.put('/courses/:courseId/progress', updateCourseProgress);

// Routes pour les certifications
router.get('/my-certifications', getMyCertifications);

export default router;

