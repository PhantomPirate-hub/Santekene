import { Router } from 'express';
import {
  getAllHealthCenters,
  getHealthCenterById,
  getNearestHealthCenters,
} from '../controllers/healthcenter.controller.js';

const router = Router();

// Routes publiques (pas besoin d'authentification pour voir les centres de santé)
router.get('/', getAllHealthCenters); // GET /api/healthcenters?search=hopital&lat=12.6&lon=-8&limit=20
router.get('/nearest', getNearestHealthCenters); // GET /api/healthcenters/nearest?lat=12.6&lon=-8&limit=10
router.get('/:id', getHealthCenterById); // GET /api/healthcenters/1

export default router;

