
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Étend l'interface Request d'Express pour y inclure notre propriété `user`
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès non autorisé, token manquant ou malformé.' });
  }

  const token = bearer.split('Bearer ')[1]?.trim() || '';

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; role: string; iat: number; exp: number };
    
    req.user = {
      id: payload.userId,
      role: payload.role,
    };
    
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error);
    return res.status(401).json({ message: 'Accès non autorisé, token invalide.' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' });
    }
    next();
  };
};

// Alias pour compatibilité
export const authMiddleware = protect;

// Export du type AuthRequest pour réutilisation
export type AuthRequest = Request & {
  user: {
    id: number;
    role: string;
  };
};