import { Router } from 'express';
import {
  createPrescription,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getPatientPrescriptions,
  verifyPrescriptionNFT,
} from '../controllers/prescription.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Toutes les routes nécessitent une authentification sauf la vérification NFT
router.use((req, res, next) => {
  if (req.path.includes('/verify/')) {
    return next();
  }
  protect(req, res, next);
});

// Routes pour les médecins
router.post('/', authorize(Role.MEDECIN), createPrescription);
router.put('/:id', authorize(Role.MEDECIN), updatePrescription);

// Routes pour tous les utilisateurs authentifiés (avec contrôle d'accès dans le contrôleur)
router.get('/:id', getPrescriptionById);
router.get('/patient/:patientId', getPatientPrescriptions);

// Routes pour les administrateurs
router.delete('/:id', authorize(Role.ADMIN, Role.SUPERADMIN), deletePrescription);

// Route publique pour vérifier un NFT de prescription
router.get('/verify/:tokenId/:serialNumber', verifyPrescriptionNFT);

export default router;

