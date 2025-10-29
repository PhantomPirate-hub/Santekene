
import rateLimit from 'express-rate-limit';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Limiteur pour les routes d'authentification
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 10, // DEV: 1000 requêtes, PROD: 10 requêtes
  standardHeaders: true, // Retourne les informations de limite dans les en-têtes `RateLimit-*`
  legacyHeaders: false, // Désactive les en-têtes `X-RateLimit-*`
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
});

// Limiteur général pour les autres routes API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 5000 : 100, // DEV: 5000 requêtes, PROD: 100 requêtes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes envoyées. Veuillez ralentir.',
});
