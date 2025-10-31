'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle, Gem } from "lucide-react";
import { motion } from "framer-motion";

const nftCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const NFTCertifications = () => {
  // Données factices pour les NFTs
  const nfts = [
    { id: 1, title: 'Certificat Télémédecine Niveau 1', date: '15/09/2025', image: 'https://via.placeholder.com/100/E8C547/FFFFFF?text=NFT1' },
    { id: 2, title: 'Badge Patient Actif 🌟', date: '01/10/2025', image: 'https://via.placeholder.com/100/A7D7C5/FFFFFF?text=NFT2' },
  ];

  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Mes Certifications NFT</CardTitle>
        <CardDescription className="text-nuit-confiance/80">Votre progression et vos récompenses numériques.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-3">
          <Award className="w-8 h-8 text-vert-vitalite" />
          <p className="text-lg font-semibold text-nuit-confiance">KènèPoints Gagnés : <span className="text-vert-vitalite">1250</span></p>
        </div>
        <div className="space-y-4">
          <h3 className="text-md font-semibold text-nuit-confiance/90">Badges & Certificats :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nfts.map(nft => (
              <motion.div key={nft.id} variants={nftCardVariants}>
                <Card className="flex items-center space-x-3 p-3 bg-fond-doux rounded-lg shadow-sm">
                  <img src={nft.image} alt={nft.title} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-nuit-confiance">{nft.title}</p>
                    <p className="text-sm text-nuit-confiance/70">Obtenu le : {nft.date}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTCertifications;
