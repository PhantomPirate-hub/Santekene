
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { HashConnect, HashConnectTypes, HashConnectConnectionState } from 'hashconnect';

// --- Types ---
type PairingData = HashConnectTypes.SavedPairingData | null;

interface HashConnectContextType {
  hashconnect: HashConnect | null;
  connectionState: HashConnectConnectionState;
  pairingData: PairingData;
  connectToWallet: () => void;
  disconnect: () => void;
}

// --- Contexte ---
const HashConnectContext = createContext<HashConnectContextType | undefined>(undefined);

// --- Provider ---
const appMetadata: HashConnectTypes.AppMetadata = {
  name: "Santé Kènè",
  description: "Plateforme de santé numérique",
  icon: "https://www.hashpack.app/img/logo.svg", // TODO: Remplacer par une URL d'icône publique
};

export const HashConnectProvider = ({ children }: { children: ReactNode }) => {
  const [hashconnect, setHashconnect] = useState<HashConnect | null>(null);
  const [connectionState, setConnectionState] = useState<HashConnectConnectionState>(HashConnectConnectionState.Disconnected);
  const [pairingData, setPairingData] = useState<PairingData>(null);

  // Initialisation de HashConnect
  useEffect(() => {
    const initializeHashConnect = async () => {
      const hc = new HashConnect(true); // true pour le mode debug

      hc.stateChangedEvent.on(state => setConnectionState(state));
      hc.pairingEvent.on(data => setPairingData(data));
      // hc.connectionStatusChangeEvent.on(state => setConnectionState(state)); // Ancien event, stateChangedEvent est préféré

      await hc.init(appMetadata, 'testnet', false);
      setHashconnect(hc);
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
