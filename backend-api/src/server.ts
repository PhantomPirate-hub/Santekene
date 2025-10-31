import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de base - Configuration CORS explicite
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet()); // Sécurise les en-têtes HTTP
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' est souvent nécessaire pour les UIs React/Next.js, à affiner si possible
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https.i.pravatar.cc", "http://localhost:3001"], // Autorise les images de pravatar et uploads
    connectSrc: ["'self'", "http://localhost:3001"], // Autorise les connexions à l'API elle-même
  },
}));
app.use(express.json({ limit: '10mb' })); // Augmenter la limite pour les fichiers base64
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Augmenter la limite pour les URL-encoded

// Servir les fichiers statiques uploadés
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.send('🌿 Santé Kènè API est en ligne !');
});

import authRoutes from './routes/auth.routes.js';
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import medecinRoutes from './routes/medecin.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import documentRoutes from './routes/document.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import elearningRoutes from './routes/elearning.routes.js';
import kenepointsRoutes from './routes/kenepoints.routes.js';
import communityRoutes from './routes/community.routes.js';
import categoryRoutes from './routes/category.routes.js';
import healthCenterRoutes from './routes/healthcenter.routes.js';
import hederaRoutes from './routes/hedera.routes.js';
import aiRoutes from './routes/ai.routes.js';
import verificationRoutes from './routes/verification.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import userRoutes from './routes/user.routes.js';

import { generalLimiter } from './middleware/rateLimiter.middleware.js';

// Hedera Workers
import { initializeHcsWorker, stopHcsWorker } from './workers/hedera-hcs.worker.js';
import { initializeHfsWorker, stopHfsWorker } from './workers/hedera-hfs.worker.js';

// Routes
app.use('/api', generalLimiter); // Applique le limiteur général à toutes les routes /api

// Authentification
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Utilisateurs par rôle
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/medecin', medecinRoutes); // Routes pour les fonctionnalités du médecin

// Données médicales
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/documents', documentRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Administration
app.use('/api/admin', adminRoutes);

// Super Administration
app.use('/api/superadmin', superadminRoutes);

// E-learning
app.use('/api/elearning', elearningRoutes);

// KènèPoints
app.use('/api/kenepoints', kenepointsRoutes);

// Wallet KenePoints (Phase 4)
app.use('/api/wallet', walletRoutes);

// Communauté
app.use('/api/community', communityRoutes);
app.use('/api/categories', categoryRoutes);

// Services externes
app.use('/api/healthcenters', healthCenterRoutes);
app.use('/api/hedera', hederaRoutes);
app.use('/api/ai', aiRoutes);

// Vérification d'intégrité blockchain (endpoints publics)
app.use('/api/verify', verificationRoutes);

// Gestionnaire d'erreurs global (simple pour le moment)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Quelque chose s\'est mal passé !');
});

// Variables pour stocker les workers Hedera
let hcsWorker: any = null;
let hfsWorker: any = null;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);

  // Initialiser les workers Hedera
  try {
    hcsWorker = initializeHcsWorker();
    console.log('✅ Hedera HCS Worker initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du worker HCS:', error);
  }

  try {
    hfsWorker = initializeHfsWorker();
    console.log('✅ Hedera HFS Worker initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du worker HFS:', error);
  }
});

// Arrêt propre du serveur
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM reçu, arrêt propre...');

  if (hcsWorker) {
    await stopHcsWorker();
  }

  if (hfsWorker) {
    await stopHfsWorker(hfsWorker);
  }

  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT reçu, arrêt propre...');

  if (hcsWorker) {
    await stopHcsWorker();
  }

  if (hfsWorker) {
    await stopHfsWorker(hfsWorker);
  }

  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});
