import { Router } from 'express';
import { getPatientById } from '../controllers/patient.controller.ts';

const router = Router();

router.get('/:id', getPatientById);

export default router;
