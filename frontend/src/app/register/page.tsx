'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('PATIENT'); // Default role
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Échec de l\'inscription.');
      }

      setSuccess('Compte créé avec succès ! Redirection vers la page de connexion...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      if (err instanceof TypeError) {
        setError('Impossible de se connecter au serveur. Veuillez vérifier votre connexion.');
      } else {
        setError(err.message || 'Une erreur inattendue est survenue lors de l\'inscription.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-fond py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[450px] shadow-2xl bg-blanc-pur rounded-2xl border border-blanc-pur/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-texte-principal">Créer un compte</CardTitle>
            <CardDescription className="text-texte-principal/80 pt-2">Rejoignez la révolution de la santé numérique</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="patient@email.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  required 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Je suis un...</Label>
                <Select onValueChange={(value: string) => setRole(value)} defaultValue={role}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PATIENT">Patient</SelectItem>
                    <SelectItem value="MEDECIN">Médecin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {success && <p className="text-vert-menthe text-sm text-center">{success}</p>}
              <Button 
                type="submit" 
                className="w-full bg-vert-menthe hover:bg-vert-menthe/90 text-texte-principal rounded-full"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-texte-principal/70">
              <p>Déjà un compte ? <Link href="/login" className="font-semibold text-bleu-clair hover:underline">Connectez-vous</Link></p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
