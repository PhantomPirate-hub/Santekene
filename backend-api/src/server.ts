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
app.use(express.json()); // Parse le JSON des requêtes entrantes
app.use(express.urlencoded({ extended: true })); // Parse les requêtes URL-encoded

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.send('🌿 Santé Kènè API est en ligne !');
});

import authRoutes from './routes/auth.routes.ts';
import patientRoutes from './routes/patient.routes.ts';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);

// TODO: Ajouter les autres routes (user.routes.ts, etc.)

// Gestionnaire d'erreurs global (simple pour le moment)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Quelque chose s\'est mal passé !');
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
