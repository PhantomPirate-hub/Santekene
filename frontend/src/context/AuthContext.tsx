'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Le rôle vient de la BDD en majuscules (PATIENT, MEDECIN, ADMIN)
// On peut le garder en majuscules ou le transformer.
// Pour la cohérence avec le backend, gardons-le en majuscules.
export type UserRole = 'PATIENT' | 'MEDECIN' | 'ADMIN';

// Définir le type pour l'utilisateur
interface User {
  id: string;
  email: string;
  role: UserRole;
}

// Définir le type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, isLoading }}>
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
