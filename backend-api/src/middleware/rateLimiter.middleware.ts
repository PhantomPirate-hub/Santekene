
import rateLimit from 'express-rate-limit';

// Limiteur pour les routes d'authentification (plus strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite chaque IP à 10 requêtes par fenêtre de 15 minutes
  standardHeaders: true, // Retourne les informations de limite dans les en-têtes `RateLimit-*`
  legacyHeaders: false, // Désactive les en-têtes `X-RateLimit-*`
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
});

// Limiteur général pour les autres routes API
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes envoyées. Veuillez ralentir.',
});
