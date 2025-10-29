'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import HeartbeatLoader from '@/components/shared/HeartbeatLoader';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[]; // Rôles autorisés pour la page
}

const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Ne rien faire tant que l'état d'authentification est en cours de chargement
    if (isLoading) {
      return;
    }

    // Si l'utilisateur n'est pas authentifié, le rediriger vers la page de connexion
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Si des rôles sont spécifiés et que le rôle de l'utilisateur n'est pas inclus,
    // le rediriger vers une page d'accès refusé ou le dashboard par défaut.
    if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      // On peut créer une page /403 ou simplement rediriger vers leur dashboard principal
      router.push('/dashboard'); 
    }

  }, [isAuthenticated, user, isLoading, router, allowedRoles]);

  // Afficher un loader pendant le chargement ou la redirection
  if (isLoading || !isAuthenticated) {
    return <HeartbeatLoader />;
  }

  // Si la page a des prérequis de rôle et que l'utilisateur ne correspond pas, 
  // on peut aussi afficher le loader pour éviter un flash de contenu non autorisé.
  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <HeartbeatLoader />;
  }

  return <>{children}</>;
};

export default AuthGuard;
