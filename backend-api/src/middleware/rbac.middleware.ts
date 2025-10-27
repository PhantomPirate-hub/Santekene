import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.js';

// Définir les rôles
export enum UserRole {
  PATIENT = 'PATIENT',
  MEDECIN = 'MEDECIN',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

// Définir une hiérarchie de rôles (optionnel)
const roleHierarchy = {
  [UserRole.PATIENT]: 1,
  [UserRole.MEDECIN]: 2,
  [UserRole.ADMIN]: 3,
  [UserRole.SUPERADMIN]: 4,
};

/**
 * Middleware pour vérifier si l'utilisateur a un rôle spécifique
 * @param allowedRoles - Liste des rôles autorisés
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource.',
      });
    }

    const userRole = req.user.role as UserRole;

    // Vérifier si le rôle de l'utilisateur est dans la liste autorisée
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: `Cette ressource nécessite l'un des rôles suivants: ${allowedRoles.join(', ')}`,
        userRole: userRole,
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur a un niveau de rôle minimum
 * @param minRole - Rôle minimum requis
 */
export const requireMinRole = (minRole: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource.',
      });
    }

    const userRole = req.user.role as UserRole;
    const userLevel = roleHierarchy[userRole] || 0;
    const minLevel = roleHierarchy[minRole];

    if (userLevel < minLevel) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: `Cette ressource nécessite au minimum le rôle: ${minRole}`,
        userRole: userRole,
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier que l'utilisateur accède à ses propres données
 * ou est un admin/médecin autorisé
 */
export const requireOwnershipOrRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour accéder à cette ressource.',
      });
    }

    const userRole = req.user.role as UserRole;
    const userId = req.user.id;
    const resourceUserId = parseInt(req.params.userId || req.params.id || '0');

    // Si l'utilisateur a un rôle autorisé, accès accordé
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Sinon, vérifier que c'est ses propres données
    if (userId === resourceUserId) {
      return next();
    }

    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Vous ne pouvez accéder qu\'à vos propres données.',
    });
  };
};

/**
 * Middleware pour patients uniquement
 */
export const requirePatient = requireRole(UserRole.PATIENT);

/**
 * Middleware pour médecins uniquement
 */
export const requireMedecin = requireRole(UserRole.MEDECIN);

/**
 * Middleware pour admins uniquement
 */
export const requireAdmin = requireRole(UserRole.ADMIN, UserRole.SUPERADMIN);

/**
 * Middleware pour super-admins uniquement
 */
export const requireSuperAdmin = requireRole(UserRole.SUPERADMIN);

/**
 * Middleware pour médecins et admins
 */
export const requireMedecinOrAdmin = requireRole(
  UserRole.MEDECIN,
  UserRole.ADMIN,
  UserRole.SUPERADMIN
);

/**
 * Middleware pour tout utilisateur authentifié
 */
export const requireAuthenticated = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Non authentifié',
      message: 'Vous devez être connecté pour accéder à cette ressource.',
    });
  }
  next();
};

/**
 * Vérifier les permissions personnalisées (pour SuperAdmin)
 */
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté.',
      });
    }

    const userRole = req.user.role as UserRole;

    // SuperAdmin a toutes les permissions
    if (userRole === UserRole.SUPERADMIN) {
      return next();
    }

    // Pour les autres rôles, vérifier les permissions spécifiques
    // TODO: Implémenter système de permissions granulaires si nécessaire

    return res.status(403).json({
      error: 'Permission refusée',
      message: `Cette action nécessite la permission: ${permission}`,
    });
  };
};

/**
 * Logs d'accès pour audit
 */
export const logAccess = (action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      console.log(
        `[AUDIT] ${new Date().toISOString()} - User ${req.user.id} (${req.user.role}) - Action: ${action} - IP: ${req.ip}`
      );
      // TODO: Enregistrer dans AuditLog et HCS
    }
    next();
  };
};

