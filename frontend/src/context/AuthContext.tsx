'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Définir le type pour l'utilisateur
interface User {
  id: string;
  email: string;
  role: 'patient' | 'medecin' | 'admin';
}

// Définir le type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// Créer le contexte avec une valeur par défaut
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Créer le fournisseur de contexte
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setToken(token);
    // TODO: Stocker le token dans localStorage ou un cookie sécurisé
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // TODO: Supprimer le token du stockage
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
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
