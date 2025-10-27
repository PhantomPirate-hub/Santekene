import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorStats,
  getConsultationsHistory,
  updateConsultation,
  getDoctorNotifications,
  searchPatientByPhone,
  requestDseAccess,
  checkDseAccess,
  getPatientDse,
  createConsultation,
  uploadConsultationDocument,
  getDoctorAppointments,
  acceptAppointment,
  rejectAppointment,
  getDoctorSchedule,
  generateVideoLink,
} from '../controllers/medecin.controller.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Profil du médecin
router.get('/profile', getDoctorProfile);
router.put('/profile', updateDoctorProfile);

// Statistiques du médecin
router.get('/stats', getDoctorStats);

// Historique des consultations
router.get('/consultations/history', getConsultationsHistory);

// Notifications
router.get('/notifications', getDoctorNotifications);

// Recherche de patient
router.get('/search-patient', searchPatientByPhone);

// Gestion des demandes d'accès au DSE
router.post('/dse-access/request', requestDseAccess);
router.get('/dse-access/check/:patientId', checkDseAccess);

// Consultation du DSE d'un patient
router.get('/patients/:patientId/dse', getPatientDse);

// Création de consultation
router.post('/consultations', createConsultation);

// Modification d'une consultation
router.put('/consultations/:id', updateConsultation);

// Upload de documents de consultation (avec multer)
router.post('/consultations/documents', upload.single('file'), uploadConsultationDocument);

// ============================================
// GESTION DES RENDEZ-VOUS (Nouveau)
// ============================================

// Liste des demandes de RDV
router.get('/appointments', getDoctorAppointments);

// Planning du médecin (RDV confirmés)
router.get('/schedule', getDoctorSchedule);

// Accepter un RDV (avec date/heure)
router.put('/appointments/:id/accept', acceptAppointment);

// Refuser un RDV
router.put('/appointments/:id/reject', rejectAppointment);

// Générer lien visioconférence
router.post('/appointments/:id/video/start', generateVideoLink);

export default router;

