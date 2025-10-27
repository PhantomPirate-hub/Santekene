import { Router } from 'express';
import {
  uploadDocument,
  getDocumentById,
  getPatientDocuments,
  updateDocument,
  deleteDocument,
  downloadDocument,
  verifyDocumentIntegrity,
} from '../controllers/document.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';
import multer from 'multer';

const router = Router();

// Configuration de multer pour l'upload de fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
});

// Toutes les routes nécessitent une authentification
router.use(protect);

// Upload de document
router.post('/', upload.single('file'), uploadDocument);

// Récupérer un document
router.get('/:id', getDocumentById);

// Récupérer les documents d'un patient
router.get('/patient/:patientId', getPatientDocuments);

// Télécharger un document
router.get('/:id/download', downloadDocument);

// Vérifier l'intégrité d'un document
router.post('/:id/verify', upload.single('file'), verifyDocumentIntegrity);

// Mettre à jour un document (Médecin, Admin, SuperAdmin)
router.put('/:id', authorize(Role.MEDECIN, Role.ADMIN, Role.SUPERADMIN), updateDocument);

// Supprimer un document (Admin, SuperAdmin uniquement)
router.delete('/:id', authorize(Role.ADMIN, Role.SUPERADMIN), deleteDocument);

export default router;

