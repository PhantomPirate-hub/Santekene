import { Router } from 'express';
import { 
  getPatientById,
  getMyDSE,
  getMyConsultations,
  getMyDocuments,
  getMyAppointments,
  getMyKenePoints,
  getAllDoctors,
  createAppointment,
  cancelAppointment,
  updateAppointment,
  getPatientPrescriptions,
  getDseAccessRequests,
  respondToDseAccessRequest
} from '../controllers/patient.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { Role } from '@prisma/client';

const router = Router();

// Routes pour le patient connecté (accès à ses propres données)
router.get('/me/dse', protect, getMyDSE); // DSE complet
router.get('/me/consultations', protect, getMyConsultations); // Consultations uniquement
router.get('/me/documents', protect, getMyDocuments); // Documents uniquement
router.get('/me/appointments', protect, getMyAppointments); // Rendez-vous uniquement
router.get('/me/kenepoints', protect, getMyKenePoints); // KènèPoints uniquement
router.get('/prescriptions', protect, getPatientPrescriptions); // Ordonnances du patient

// ROUTE DE TEST SANS AUTH (pour diagnostic)
router.get('/test-prescriptions', async (req: any, res: any) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test avec patient1
    const patient = await prisma.patient.findFirst({
      where: { userId: 2 }, // patient1@example.com
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient non trouvé', userId: 2 });
    }
    
    const consultations = await prisma.consultation.findMany({
      where: { 
        patientId: patient.id,
        prescription: { isNot: null },
      },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
        prescription: true,
      },
    });
    
    const prescriptions = consultations.map(c => ({
      id: c.prescription!.id.toString(),
      date: c.date.toISOString(),
      doctor: {
        name: c.doctor.user.name,
        specialty: c.doctor.speciality, // ✅ Correction: speciality (DB) → specialty (API)
      },
      diagnosis: c.diagnosis || 'Non spécifié',
      medications: [{
        name: c.prescription!.medication,
        dosage: c.prescription!.dosage,
        frequency: '2 fois par jour',
        duration: c.prescription!.duration,
        instructions: 'Suivre les instructions du médecin',
      }],
      notes: `Ordonnance émise le ${new Date(c.prescription!.issuedAt).toLocaleDateString('fr-FR')}`,
      status: 'ACTIVE',
    }));
    
    await prisma.$disconnect();
    
    return res.json({
      success: true,
      message: 'Route de test - Sans authentification',
      patientId: patient.id,
      userId: 2,
      prescriptions,
      total: prescriptions.length,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Erreur test', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Routes pour la gestion des rendez-vous
router.get('/doctors', protect, getAllDoctors); // Liste des médecins
router.post('/appointments', protect, createAppointment); // Créer un rendez-vous
router.put('/appointments/:id', protect, updateAppointment); // Modifier un rendez-vous
router.delete('/appointments/:id', protect, cancelAppointment); // Annuler un rendez-vous

// Routes pour les demandes d'accès au DSE
router.get('/me/dse-access-requests', protect, getDseAccessRequests); // Liste des demandes
router.put('/dse-access-requests/:requestId/respond', protect, respondToDseAccessRequest); // Approuver/Refuser

// Routes pour accéder à un patient spécifique (médecins/admin)
// Tous les utilisateurs connectés peuvent potentiellement accéder à cette route,
// la logique de contrôle d'accès fine se fera dans le contrôleur.
router.get('/:id', protect, getPatientById);


export default router;
