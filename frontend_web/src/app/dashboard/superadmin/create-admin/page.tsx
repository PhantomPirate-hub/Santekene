'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield, Mail, Lock, User, Loader2, CheckCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateAdminPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/superadmin/create-superadmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Super Admin créé avec succès');
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
        
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-fond p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-texte-principal flex items-center">
            <Shield className="w-8 h-8 mr-3 text-purple-600" />
            Créer un Super Administrateur
          </h1>
          <p className="text-texte-principal/60 mt-2">
            Ajouter un nouvel administrateur de la plateforme Santé Kènè
          </p>
        </div>

        {/* Message de succès */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Super Admin créé avec succès !</p>
              <p className="text-sm text-green-700 mt-1">
                Les identifiants de connexion ont été générés. Le nouveau super admin peut maintenant se connecter.
              </p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-texte-principal">
              <User className="w-5 h-5 mr-2 text-bleu-principal" />
              Informations du Super Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom complet */}
              <div>
                <Label htmlFor="name" className="text-texte-principal font-medium">
                  Nom complet *
                </Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-3 w-5 h-5 text-texte-principal/40" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Amadou Traoré"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-texte-principal font-medium">
                  Email professionnel *
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-texte-principal/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@santekene.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <Label htmlFor="phone" className="text-texte-principal font-medium">
                  Téléphone *
                </Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-texte-principal/40" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+223 76 12 34 56"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <Label htmlFor="password" className="text-texte-principal font-medium">
                  Mot de passe *
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-texte-principal/40" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Au moins 6 caractères"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-texte-principal/60 mt-1">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <Label htmlFor="confirmPassword" className="text-texte-principal font-medium">
                  Confirmer le mot de passe *
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-texte-principal/40" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ressaisissez le mot de passe"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="flex items-center space-x-3 pt-4">
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Créer le Super Admin
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' })}
                  disabled={loading}
                >
                  Réinitialiser
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informations de sécurité */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-texte-principal flex items-center mb-2">
              <Shield className="w-4 h-4 mr-2 text-yellow-600" />
              Informations importantes
            </h3>
            <ul className="text-sm text-texte-principal/70 space-y-1 list-disc list-inside">
              <li>Le super admin aura accès à toutes les fonctionnalités de la plateforme</li>
              <li>Il pourra valider les demandes de structures de santé</li>
              <li>Il pourra créer d'autres super admins</li>
              <li>Conservez les identifiants en lieu sûr</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

