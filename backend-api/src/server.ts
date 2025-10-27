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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
app.use(express.json()); // Parse le JSON des requêtes entrantes
app.use(express.urlencoded({ extended: true })); // Parse les requêtes URL-encoded

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
import elearningRoutes from './routes/elearning.routes.js';
import kenepointsRoutes from './routes/kenepoints.routes.js';
import communityRoutes from './routes/community.routes.js';
import healthCenterRoutes from './routes/healthcenter.routes.js';
import hederaRoutes from './routes/hedera.routes.js';
import aiRoutes from './routes/ai.routes.js';

import { generalLimiter } from './middleware/rateLimiter.middleware.js';

// Routes
app.use('/api', generalLimiter); // Applique le limiteur général à toutes les routes /api

// Authentification
app.use('/api/auth', authRoutes);

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

// E-learning
app.use('/api/elearning', elearningRoutes);

// KènèPoints
app.use('/api/kenepoints', kenepointsRoutes);

// Communauté
app.use('/api/community', communityRoutes);

// Services externes
app.use('/api/healthcenters', healthCenterRoutes);
app.use('/api/hedera', hederaRoutes);
app.use('/api/ai', aiRoutes);

// Gestionnaire d'erreurs global (simple pour le moment)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Quelque chose s\'est mal passé !');
});

app.listen(PORT, () => {
});
