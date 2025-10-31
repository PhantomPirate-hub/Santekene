
'use client';

import { useHashConnect } from '@/context/HashConnectContext';
import { HashConnectConnectionState } from 'hashconnect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const WalletConnectButton = () => {
  const { connectionState, connectToWallet, disconnect, pairingData } = useHashConnect();

  const getStatusBadge = () => {
    switch (connectionState) {
      case HashConnectConnectionState.Connected:
        return <Badge variant="default">Connecté</Badge>;
      case HashConnectConnectionState.Disconnected:
        return <Badge variant="destructive">Déconnecté</Badge>;
      case HashConnectConnectionState.Connecting:
        return <Badge variant="outline">Connexion...</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  // return (
  //   <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm flex flex-col gap-4 items-center">
  //     <h3 className="font-semibold">Portefeuille Hedera</h3>
  //     <div className="flex items-center gap-2">
  //       <span>Statut:</span>
  //       {getStatusBadge()}
  //     </div>
  //     {connectionState === HashConnectConnectionState.Connected ? (
  //       <div className="text-center">
  //         <p className="text-sm font-mono">{pairingData?.accountIds[0]}</p>
  //         <Button onClick={disconnect} variant="destructive" className="mt-2">Déconnecter</Button>
  //       </div>
  //     ) : (
  //       <Button onClick={connectToWallet}>Connecter HashPack</Button>
  //     )}
  //   </div>
  // );
};

export default WalletConnectButton;
