import { Router } from 'express';
import {
  verifyConsultation,
  verifyPrescription,
  verifyDocument,
  verifyBatch,
} from '../controllers/verification.controller.js';

const router = Router();

// Endpoints publics de vérification d'intégrité
router.get('/consultation/:id', verifyConsultation);
router.get('/prescription/:id', verifyPrescription);
router.get('/document/:id', verifyDocument);
router.post('/batch', verifyBatch);

export default router;

