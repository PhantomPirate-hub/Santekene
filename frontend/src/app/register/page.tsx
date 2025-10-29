'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { User, Stethoscope, Building2, Upload, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

type UserRole = 'PATIENT' | 'MEDECIN' | 'ADMIN';

interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface MedecinFormData extends PatientFormData {
  speciality: string;
  facilityId: number | null;
  location: string;
}

interface Facility {
  id: number;
  facilityName: string;
  facilityType: string;
  facilityCity: string;
}

interface AdminFormData {
  // Structure info
  facilityName: string;
  facilityType: string;
  facilityCity: string;
  facilityPhone: string;
  documentUrl: string;
  documentType: string;
  // Responsible info
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresValidation, setRequiresValidation] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const router = useRouter();

  // États pour chaque type de formulaire
  const [patientData, setPatientData] = useState<PatientFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [medecinData, setMedecinData] = useState<MedecinFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    speciality: '',
    facilityId: null,
    location: '',
  });

  const [adminData, setAdminData] = useState<AdminFormData>({
    facilityName: '',
    facilityType: '',
    facilityCity: '',
    facilityPhone: '',
    documentUrl: '',
    documentType: 'Agrément',
    responsibleName: '',
    responsibleEmail: '',
    responsiblePhone: '',
    password: '',
    confirmPassword: '',
  });

  // Charger les structures approuvées quand on sélectionne "MEDECIN"
  useEffect(() => {
    if (role === 'MEDECIN') {
      loadFacilities();
    }
  }, [role]);

  const loadFacilities = async () => {
    setLoadingFacilities(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/facilities`);
      const data = await response.json();

      if (response.ok) {
        setFacilities(data.facilities || []);
      } else {
        console.error('Erreur chargement structures:', data.error);
      }
    } catch (err) {
      console.error('Erreur réseau:', err);
    } finally {
      setLoadingFacilities(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convertir en base64 pour simplifier l'envoi
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminData({ ...adminData, documentUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      let payload: any = { role };

      if (role === 'PATIENT') {
        payload = { ...payload, ...patientData };
      } else if (role === 'MEDECIN') {
        payload = { ...payload, ...medecinData };
      } else if (role === 'ADMIN') {
        payload = { ...payload, ...adminData };
        console.log('📤 Envoi inscription Admin:', {
          facilityName: adminData.facilityName,
          responsibleName: adminData.responsibleName,
          hasDocument: !!adminData.documentUrl,
          documentSize: adminData.documentUrl?.length || 0,
        });
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Afficher les détails de l'erreur si disponibles
        const errorDetails = data.details ? ` (${JSON.stringify(data.details)})` : '';
        throw new Error(data.error + errorDetails || 'Échec de l\'inscription.');
      }

      setSuccess(data.message);
      setRequiresValidation(data.requiresValidation || false);

      // Si c'est un patient (pas de validation requise), rediriger vers login après 2s
      if (role === 'PATIENT' && !data.requiresValidation) {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
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

  const getRoleIcon = (selectedRole: UserRole) => {
    switch (selectedRole) {
      case 'PATIENT':
        return <User className="w-5 h-5" />;
      case 'MEDECIN':
        return <Stethoscope className="w-5 h-5" />;
      case 'ADMIN':
        return <Building2 className="w-5 h-5" />;
    }
  };

  const getRoleLabel = (selectedRole: UserRole) => {
    switch (selectedRole) {
      case 'PATIENT':
        return 'Patient';
      case 'MEDECIN':
        return 'Médecin';
      case 'ADMIN':
        return 'Administrateur de structure';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-fond py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl bg-blanc-pur rounded-2xl border border-blanc-pur/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-texte-principal">Créer un compte</CardTitle>
            <CardDescription className="text-texte-principal/80 pt-2">
              Rejoignez Santé Kènè - Plateforme de santé numérique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {success ? (
              <div className="space-y-4 text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-green-600 font-medium">{success}</p>
                {requiresValidation && (
                  <p className="text-sm text-texte-principal/70">
                    Vous recevrez une notification par email une fois votre compte validé.
                  </p>
                )}
                {!requiresValidation && role === 'PATIENT' && (
                  <p className="text-sm text-texte-principal/70">
                    Redirection vers la page de connexion...
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection du rôle */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {getRoleIcon(role)}
                    Je suis un...
                  </Label>
                  <Select onValueChange={(value: UserRole) => setRole(value)} defaultValue={role}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PATIENT">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Patient
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDECIN">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4" />
                          Médecin
                        </div>
                      </SelectItem>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Administrateur de structure
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Formulaires conditionnels */}
                <AnimatePresence mode="wait">
                  {/* PATIENT FORM */}
                  {role === 'PATIENT' && (
                    <motion.div
                      key="patient"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="patient-name">Nom complet *</Label>
                        <Input
                          id="patient-name"
                          type="text"
                          placeholder="Ex: Mamadou Traoré"
                          required
                          value={patientData.name}
                          onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patient-phone">Contact *</Label>
                        <Input
                          id="patient-phone"
                          type="tel"
                          placeholder="+223 76 12 34 56"
                          required
                          value={patientData.phone}
                          onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patient-email">Adresse email *</Label>
                        <Input
                          id="patient-email"
                          type="email"
                          placeholder="patient@email.com"
                          required
                          value={patientData.email}
                          onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patient-password">Mot de passe *</Label>
                        <Input
                          id="patient-password"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={patientData.password}
                          onChange={(e) => setPatientData({ ...patientData, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="patient-confirm">Confirmer le mot de passe *</Label>
                        <Input
                          id="patient-confirm"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={patientData.confirmPassword}
                          onChange={(e) => setPatientData({ ...patientData, confirmPassword: e.target.value })}
                        />
                      </div>
                      <p className="text-sm text-texte-principal/60 italic">
                        💡 Vous pourrez renseigner les autres informations (groupe sanguin, taille, etc.) dans les paramètres après inscription.
                      </p>
                    </motion.div>
                  )}

                  {/* MEDECIN FORM */}
                  {role === 'MEDECIN' && (
                    <motion.div
                      key="medecin"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="medecin-name">Nom complet *</Label>
                        <Input
                          id="medecin-name"
                          type="text"
                          placeholder="Pr. Amadou Diarra"
                          required
                          value={medecinData.name}
                          onChange={(e) => setMedecinData({ ...medecinData, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="medecin-email">Adresse email *</Label>
                          <Input
                            id="medecin-email"
                            type="email"
                            placeholder="dr.diarra@email.com"
                            required
                            value={medecinData.email}
                            onChange={(e) => setMedecinData({ ...medecinData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="medecin-phone">Contact *</Label>
                          <Input
                            id="medecin-phone"
                            type="tel"
                            placeholder="+223 70 12 34 56"
                            required
                            value={medecinData.phone}
                            onChange={(e) => setMedecinData({ ...medecinData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medecin-speciality">Fonction / Spécialité *</Label>
                        <Input
                          id="medecin-speciality"
                          type="text"
                          placeholder="Ex: Médecin généraliste, Cardiologue..."
                          required
                          value={medecinData.speciality}
                          onChange={(e) => setMedecinData({ ...medecinData, speciality: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medecin-facility">Établissement *</Label>
                        {loadingFacilities ? (
                          <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm text-gray-600">Chargement des structures...</span>
                          </div>
                        ) : facilities.length === 0 ? (
                          <div className="p-3 border rounded-md bg-amber-50 border-amber-200">
                            <p className="text-sm text-amber-800">
                              Aucune structure approuvée disponible. Un administrateur de structure doit d'abord s'inscrire et être validé par un Super Admin.
                            </p>
                          </div>
                        ) : (
                          <Select
                            onValueChange={(value) => setMedecinData({ ...medecinData, facilityId: parseInt(value) })}
                            value={medecinData.facilityId?.toString() || ''}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner votre structure" />
                            </SelectTrigger>
                            <SelectContent>
                              {facilities.map((facility) => (
                                <SelectItem key={facility.id} value={facility.id.toString()}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{facility.facilityName}</span>
                                    <span className="text-xs text-gray-500">
                                      {facility.facilityType} - {facility.facilityCity}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medecin-location">Ville d'exercice *</Label>
                        <Input
                          id="medecin-location"
                          type="text"
                          placeholder="Ex: Bamako, Ségou, Sikasso, Kayes..."
                          required
                          value={medecinData.location}
                          onChange={(e) => setMedecinData({ ...medecinData, location: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="medecin-password">Mot de passe *</Label>
                          <Input
                            id="medecin-password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={medecinData.password}
                            onChange={(e) => setMedecinData({ ...medecinData, password: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="medecin-confirm">Confirmer *</Label>
                          <Input
                            id="medecin-confirm"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={medecinData.confirmPassword}
                            onChange={(e) => setMedecinData({ ...medecinData, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                          Votre compte nécessite une validation par l'administrateur de votre établissement. Vous recevrez un email une fois validé.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* ADMIN FORM */}
                  {role === 'ADMIN' && (
                    <motion.div
                      key="admin"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Informations de la structure */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-texte-principal flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          Informations de la structure
                        </h3>
                        <div className="space-y-2">
                          <Label htmlFor="facility-name">Nom de la structure *</Label>
                          <Input
                            id="facility-name"
                            type="text"
                            placeholder="Ex: Hôpital du Point G"
                            required
                            value={adminData.facilityName}
                            onChange={(e) => setAdminData({ ...adminData, facilityName: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="facility-type">Type de structure *</Label>
                            <Select
                              onValueChange={(value) => setAdminData({ ...adminData, facilityType: value })}
                              value={adminData.facilityType}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hôpital">Hôpital</SelectItem>
                                <SelectItem value="Clinique">Clinique</SelectItem>
                                <SelectItem value="Centre de santé">Centre de santé</SelectItem>
                                <SelectItem value="Cabinet médical">Cabinet médical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="facility-city">Ville de la structure *</Label>
                            <Input
                              id="facility-city"
                              type="text"
                              placeholder="Ex: Bamako, Ségou, Mopti, Tombouctou..."
                              required
                              value={adminData.facilityCity}
                              onChange={(e) => setAdminData({ ...adminData, facilityCity: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facility-phone">Contact de la structure *</Label>
                          <Input
                            id="facility-phone"
                            type="tel"
                            placeholder="+223 20 XX XX XX"
                            required
                            value={adminData.facilityPhone}
                            onChange={(e) => setAdminData({ ...adminData, facilityPhone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="facility-document">Document de validation (Agrément, Licence...) *</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="facility-document"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="flex-1"
                              required
                            />
                            {adminData.documentUrl && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-texte-principal/60">
                            Téléchargez l'agrément ou tout document prouvant que votre structure est habilitée à exercer. Vous pourrez aussi le fournir plus tard.
                          </p>
                        </div>
                      </div>

                      {/* Informations du responsable */}
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-lg text-texte-principal flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Informations du représentant
                        </h3>
                        <div className="space-y-2">
                          <Label htmlFor="responsible-name">Nom complet *</Label>
                          <Input
                            id="responsible-name"
                            type="text"
                            placeholder="Ex: Fatoumata Keita"
                            required
                            value={adminData.responsibleName}
                            onChange={(e) => setAdminData({ ...adminData, responsibleName: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="responsible-email">Adresse email *</Label>
                            <Input
                              id="responsible-email"
                              type="email"
                              placeholder="responsable@structure.com"
                              required
                              value={adminData.responsibleEmail}
                              onChange={(e) => setAdminData({ ...adminData, responsibleEmail: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="responsible-phone">Contact *</Label>
                            <Input
                              id="responsible-phone"
                              type="tel"
                              placeholder="+223 76 XX XX XX"
                              required
                              value={adminData.responsiblePhone}
                              onChange={(e) => setAdminData({ ...adminData, responsiblePhone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="admin-password">Mot de passe *</Label>
                            <Input
                              id="admin-password"
                              type="password"
                              placeholder="••••••••"
                              required
                              value={adminData.password}
                              onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="admin-confirm">Confirmer *</Label>
                            <Input
                              id="admin-confirm"
                              type="password"
                              placeholder="••••••••"
                              required
                              value={adminData.confirmPassword}
                              onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Votre demande sera examinée par un Super Administrateur. Vous recevrez un email une fois votre structure validée.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-vert-menthe hover:bg-vert-menthe/90 text-texte-principal rounded-full text-lg py-6"
                  disabled={loading}
                >
                  {loading ? 'Inscription en cours...' : 'Créer mon compte'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-texte-principal/70">
              <p>
                Déjà un compte ?{' '}
                <Link href="/login" className="font-semibold text-bleu-clair hover:underline">
                  Connectez-vous
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
