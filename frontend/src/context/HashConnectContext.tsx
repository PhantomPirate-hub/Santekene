
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Importer dynamiquement HashConnect uniquement côté client
let HashConnect: any;
let HashConnectTypes: any;
let HashConnectConnectionState: any;

if (typeof window !== 'undefined') {
  const hashconnect = require('hashconnect');
  HashConnect = hashconnect.HashConnect;
  HashConnectTypes = hashconnect.HashConnectTypes;
  HashConnectConnectionState = hashconnect.HashConnectConnectionState;
}

// --- Types ---
type PairingData = any | null;

interface HashConnectContextType {
  hashconnect: any | null;
  connectionState: any;
  pairingData: PairingData;
  connectToWallet: () => void;
  disconnect: () => void;
}

// --- Contexte ---
const HashConnectContext = createContext<HashConnectContextType | undefined>(undefined);

// --- Provider ---
const appMetadata: any = typeof window !== 'undefined' ? {
  name: "Santé Kènè",
  description: "Plateforme de santé numérique",
  icon: "https://www.hashpack.app/img/logo.svg",
} : {};

export const HashConnectProvider = ({ children }: { children: ReactNode }) => {
  const [hashconnect, setHashconnect] = useState<any | null>(null);
  const [connectionState, setConnectionState] = useState<any>(
    typeof window !== 'undefined' && HashConnectConnectionState 
      ? HashConnectConnectionState.Disconnected 
      : 'Disconnected'
  );
  const [pairingData, setPairingData] = useState<PairingData>(null);

  // Initialisation de HashConnect
  useEffect(() => {
    // Ne s'exécuter que côté client
    if (typeof window === 'undefined' || !HashConnect) {
      return;
    }

    const initializeHashConnect = async () => {
      try {
        const hc = new HashConnect(true); // true pour le mode debug

        // Vérifier que les événements existent avant de les utiliser
        if (hc.stateChangedEvent && typeof hc.stateChangedEvent.on === 'function') {
          hc.stateChangedEvent.on((state: any) => setConnectionState(state));
        }
        
        if (hc.pairingEvent && typeof hc.pairingEvent.on === 'function') {
          hc.pairingEvent.on((data: any) => setPairingData(data));
        }

        await hc.init(appMetadata, 'testnet', false);
        setHashconnect(hc);
      } catch (error) {
        console.warn('HashConnect non disponible ou non configuré:', error);
        // HashConnect est optionnel, l'application peut fonctionner sans
      }
    };

    initializeHashConnect();
  }, []);

  const connectToWallet = () => {
    if (hashconnect) {
      hashconnect.connectToLocalWallet();
    }
  };

  const disconnect = () => {
    if (hashconnect && pairingData) {
      hashconnect.disconnect(pairingData.topic);
      setPairingData(null);
    }
  }

  return (
    <HashConnectContext.Provider value={{ hashconnect, connectionState, pairingData, connectToWallet, disconnect }}>
      {children}
    </HashConnectContext.Provider>
  );
};

// --- Hook ---
export const useHashConnect = () => {
  const context = useContext(HashConnectContext);
  if (context === undefined) {
    throw new Error('useHashConnect must be used within a HashConnectProvider');
  }
  return context;
};
