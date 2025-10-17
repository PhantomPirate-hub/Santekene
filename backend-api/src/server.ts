import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de base
app.use(cors()); // Autorise les requêtes cross-origin
app.use(helmet()); // Sécurise les en-têtes HTTP
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"], // 'unsafe-inline' est souvent nécessaire pour les UIs React/Next.js, à affiner si possible
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https.i.pravatar.cc"], // Autorise les images de pravatar
    connectSrc: ["'self'", "http://localhost:3001"], // Autorise les connexions à l'API elle-même
  },
}));
app.use(express.json()); // Parse le JSON des requêtes entrantes
app.use(express.urlencoded({ extended: true })); // Parse les requêtes URL-encoded

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.send('🌿 Santé Kènè API est en ligne !');
});

import authRoutes from './routes/auth.routes.ts';
import patientRoutes from './routes/patient.routes.ts';

import hederaRoutes from './routes/hedera.routes.ts';

import { generalLimiter } from './middleware/rateLimiter.middleware.ts';

// Routes
app.use('/api', generalLimiter); // Applique le limiteur général à toutes les routes /api
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/hedera', hederaRoutes);

// TODO: Ajouter les autres routes (user.routes.ts, etc.)

// Gestionnaire d'erreurs global (simple pour le moment)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Quelque chose s\'est mal passé !');
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
