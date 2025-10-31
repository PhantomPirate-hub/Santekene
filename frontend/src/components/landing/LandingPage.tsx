'use client';

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Stethoscope, Bot } from 'lucide-react';
import Link from 'next/link';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    className="bg-blanc-pur p-8 rounded-2xl shadow-lg text-center flex flex-col items-center" 
    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
  >
    <div className="bg-bleu-clair/10 p-4 rounded-full mb-6">{icon}</div>
    <h3 className="text-2xl font-bold text-texte-principal mb-4">{title}</h3>
    <p className="text-texte-principal/80">{description}</p>
  </motion.div>
);

export default function LandingPage() {
  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.2 } } };

  return (
    <div className="min-h-screen bg-fond text-texte-principal">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-fond/80 backdrop-blur-sm z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <img src="/assets/logo.png" alt="Santé Kènè Logo" className="h-10" />
          </Link>
          <div className="space-x-4">
            <Button variant="ghost" asChild><Link href="/login" className="text-texte-principal hover:text-bleu-clair">Connexion</Link></Button>
            <Button className="bg-vert-menthe hover:bg-vert-menthe/90 text-texte-principal rounded-full" asChild>
              <Link href="/register">Inscription <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <motion.section 
          className="text-center container mx-auto px-6 py-24 md:py-32"
          initial="hidden" animate="visible" variants={containerVariants}
        >
          <motion.h2 
            className="text-5xl md:text-7xl font-extrabold text-texte-principal leading-tight mb-6"
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
          >
            La santé décentralisée, <br /> simple et sécurisée.
          </motion.h2>
          <motion.p 
            className="max-w-3xl mx-auto text-lg md:text-xl text-texte-principal/80 mb-10"
            variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
          >
            Accédez à des médecins qualifiés, gérez votre dossier médical en toute confidentialité grâce à l'IA et la blockchain Hedera.
          </motion.p>
          <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Button size="lg" className="bg-bleu-clair hover:bg-bleu-clair/90 text-texte-principal rounded-full text-lg px-8 py-6">
              Commencer la téléconsultation
            </Button>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          className="bg-blanc-pur py-20 md:py-28"
          initial="hidden" animate="visible" variants={containerVariants}
        >
          <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Stethoscope className="w-10 h-10 text-bleu-clair" />} 
              title="Téléconsultation Facile"
              description="Parlez à un médecin en quelques clics, où que vous soyez, via un flux vidéo sécurisé."
            />
            <FeatureCard 
              icon={<Bot className="w-10 h-10 text-bleu-clair" />} 
              title="Triage par IA"
              description="Décrivez vos symptômes et laissez notre IA vous orienter vers le bon spécialiste."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-10 h-10 text-bleu-clair" />} 
              title="Données Sécurisées"
              description="Votre dossier médical est chiffré et authentifié sur la blockchain Hedera."
            />
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="bg-texte-principal text-blanc-pur/70 py-8">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Santé Kènè. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}