'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Le rôle vient de la BDD en majuscules (PATIENT, MEDECIN, ADMIN, SUPERADMIN)
// On peut le garder en majuscules ou le transformer.
// Pour la cohérence avec le backend, gardons-le en majuscules.
export type UserRole = 'PATIENT' | 'MEDECIN' | 'ADMIN' | 'SUPERADMIN';

// Définir le type pour l'utilisateur
interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar?: string;
  phone?: string;
}

// Définir le type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Pour gérer le chargement initial
}

// Créer le contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Créer le fournisseur de contexte
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Erreur lors de la lecture du localStorage", error);
      // En cas d'erreur (ex: JSON malformé), on nettoie
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    // Assurons-nous que le rôle est bien formaté
    const formattedUser = {
        ...userData,
        role: userData.role.toUpperCase() as UserRole
    };

    setUser(formattedUser);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(formattedUser));
  };

  const logout = async () => {
    // Appeler l'API de déconnexion si un token existe
    if (token) {
      try {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('Déconnexion serveur réussie');
      } catch (error) {
        console.error('Erreur lors de la déconnexion serveur:', error);
        // Continuer quand même avec la déconnexion locale
      }
    }

    // Nettoyer l'état local
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    // Fusionner les nouvelles données avec l'utilisateur actuel
    const updatedUser = {
      ...user,
      ...userData,
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Créer un hook personnalisé pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
