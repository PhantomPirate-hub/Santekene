
import { Router } from 'express';
import { hederaController } from '../controllers/hedera.controller.ts';
import { protect, authorize } from '../middleware/auth.middleware.ts';
import { Role } from '@prisma/client';
import multer from 'multer';

const router = Router();

// Configuration de Multer pour stocker les fichiers en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- HCS Routes ---
// Route pour soumettre un message à HCS
router.post('/hcs', protect, hederaController.submitHcsMessage);

// --- HFS Routes ---
// Route pour uploader un fichier sur HFS
router.post('/hfs', protect, upload.single('file'), hederaController.uploadFileToHFS);

// --- HTS Routes ---
// Route pour créer le token KènèPoints (Admin seulement)
router.post('/hts/kene-points', protect, authorize(Role.ADMIN), hederaController.createKenePointsToken);

export default router;
