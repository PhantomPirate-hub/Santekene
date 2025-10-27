'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const SettingsPage = () => {
  const { user, token, updateUser, logout } = useAuth();
  
  // État pour les informations personnelles
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    height: '',
    birthDate: '',
    location: '',
    specialty: '', // Pour les médecins
    structure: '', // Pour les médecins
  });
  
  // État pour le mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  // États de chargement et messages
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Charger les données utilisateur et du patient
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setProfileData(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));

        // Charger les données supplémentaires du patient
        if (user.role === 'PATIENT' && token) {
          try {
            const response = await fetch('http://localhost:3001/api/patients/me/dse', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const patient = data.patient;
              
              setProfileData(prev => ({
                ...prev,
                bloodGroup: patient.bloodGroup || '',
                height: patient.height ? patient.height.toString() : '',
                birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : '',
                location: patient.location || '',
              }));
            }
          } catch (error) {
            console.error('Erreur lors du chargement des données patient:', error);
          }
        }

        // Charger les données supplémentaires du médecin
        if (user.role === 'MEDECIN' && token) {
          try {
            console.log('🔍 Chargement profil médecin...');
            const response = await fetch('http://localhost:3001/api/medecin/profile', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            console.log('📥 Réponse profil médecin:', response.status);

            if (response.ok) {
              const doctor = await response.json();
              
              console.log('👨‍⚕️ Données médecin reçues:', doctor);
              
              setProfileData(prev => ({
                ...prev,
                specialty: doctor.specialty || '',
                structure: doctor.structure || '',
                location: doctor.location || '',
              }));

              console.log('✅ Profil médecin chargé:', {
                specialty: doctor.specialty,
                structure: doctor.structure,
                location: doctor.location,
              });
            } else {
              const errorData = await response.json();
              console.error('❌ Erreur chargement profil médecin:', errorData);
            }
          } catch (error) {
            console.error('❌ Erreur lors du chargement des données médecin:', error);
          }
        }
      }
    };

    loadUserData();
  }, [user, token]);
  
  // Mettre à jour les informations personnelles
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    setProfileMessage(null);
    
    try {
      // Choisir la bonne route selon le rôle
      const endpoint = user?.role === 'MEDECIN' 
        ? 'http://localhost:3001/api/medecin/profile'
        : 'http://localhost:3001/api/auth/update-profile';

      // Préparer les données selon le rôle
      let dataToSend;
      if (user?.role === 'MEDECIN') {
        // Pour les médecins : seulement les champs pertinents
        dataToSend = {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          specialty: profileData.specialty,
          location: profileData.location,
          // structure n'est pas inclus (non modifiable)
        };
      } else {
        // Pour les patients : tous les champs patients
        dataToSend = {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          bloodGroup: profileData.bloodGroup,
          height: profileData.height,
          birthDate: profileData.birthDate,
          location: profileData.location,
        };
      }

      console.log('📤 Envoi des données:', dataToSend);

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });
      
      console.log('📥 Réponse HTTP:', response.status, response.statusText);
      
      const data = await response.json();
      
      console.log('📦 Données reçues:', data);
      
      if (response.ok) {
        // Si l'email a été modifié, avertir et déconnecter
        if (data.emailChanged) {
          setProfileMessage({ 
            type: 'success', 
            text: 'Email modifié avec succès ! Vous allez être déconnecté pour vous reconnecter avec votre nouvel email...' 
          });
          
          // Déconnecter après 3 secondes
          setTimeout(() => {
            logout();
          }, 3000);
        } else {
          setProfileMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
          
          // Mettre à jour le contexte avec les nouvelles données
          if (data.user) {
            console.log('✅ Mise à jour contexte avec user');
            updateUser({
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
            });
          } else if (data.doctor) {
            console.log('✅ Mise à jour contexte avec doctor');
            updateUser({
              name: data.doctor.name,
              email: data.doctor.email,
              phone: data.doctor.phone,
            });
          }
        }
      } else {
        console.error('❌ Erreur serveur:', data);
        const errorMessage = data.error || 'Erreur lors de la mise à jour';
        const detailsMessage = data.details ? ` (Détails: ${data.details})` : '';
        setProfileMessage({ type: 'error', text: errorMessage + detailsMessage });
      }
    } catch (error) {
      console.error('❌ Erreur catch:', error);
      setProfileMessage({ type: 'error', text: 'Erreur de connexion au serveur: ' + (error as Error).message });
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  // Mettre à jour le mot de passe
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPassword(true);
    setPasswordMessage(null);
    
    // Validations
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' });
      setIsLoadingPassword(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
      setIsLoadingPassword(false);
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
        // Réinitialiser le formulaire
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Erreur lors de la modification' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoadingPassword(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-8 h-8 text-green-600" />
            Paramètres du compte
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez vos informations personnelles et votre sécurité
          </p>
        </div>

        {/* Informations personnelles */}
        <Card className="shadow-lg border-2 border-gray-100">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles et médicales
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Nom */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nom complet
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="mt-1 border-2 border-gray-200 focus:border-green-500"
                  required
                />
              </div>
              
              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="mt-1 border-2 border-gray-200 focus:border-green-500"
                  required
                />
              </div>
              
              {/* Téléphone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="mt-1 border-2 border-gray-200 focus:border-green-500"
                  placeholder="+221 XX XXX XX XX"
                />
              </div>

              {/* Champs supplémentaires pour les patients */}
              {user?.role === 'PATIENT' && (
                <>
                  {/* Groupe sanguin */}
                  <div>
                    <Label htmlFor="bloodGroup" className="text-sm font-medium text-gray-700">
                      Groupe sanguin
                    </Label>
                    <select
                      id="bloodGroup"
                      value={profileData.bloodGroup}
                      onChange={(e) => setProfileData({ ...profileData, bloodGroup: e.target.value })}
                      className="mt-1 w-full border-2 border-gray-200 rounded-md px-3 py-2 focus:border-green-500 focus:outline-none"
                    >
                      <option value="">Sélectionner</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  {/* Taille */}
                  <div>
                    <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                      Taille (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={profileData.height}
                      onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                      placeholder="170"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  {/* Date de naissance */}
                  <div>
                    <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
                      Date de naissance
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                    />
                  </div>

                  {/* Localité */}
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                      Localité / Ville
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                      placeholder="Hamdallaye, Ségou"
                    />
                  </div>
                </>
              )}

              {/* Champs supplémentaires pour les médecins */}
              {user?.role === 'MEDECIN' && (
                <>
                  {/* Spécialité / Fonction */}
                  <div>
                    <Label htmlFor="specialty" className="text-sm font-medium text-gray-700">
                      Fonction / Spécialité
                    </Label>
                    <Input
                      id="specialty"
                      type="text"
                      value={profileData.specialty}
                      onChange={(e) => setProfileData({ ...profileData, specialty: e.target.value })}
                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                      placeholder="Médecin Généraliste"
                    />
                  </div>

                  {/* Structure (non modifiable - en lecture seule) */}
                  <div>
                    <Label htmlFor="structure" className="text-sm font-medium text-gray-700">
                      Structure / Établissement
                    </Label>
                    <Input
                      id="structure"
                      type="text"
                      value={profileData.structure}
                      className="mt-1 border-2 border-gray-200 bg-gray-50 cursor-not-allowed"
                      placeholder="Non définie"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ℹ️ La structure est définie lors de l'inscription et validée par l'admin
                    </p>
                  </div>

                  {/* Résidence / Localité */}
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                      Résidence / Localité
                    </Label>
                    <Input
                      id="location"
                      type="text"
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                      placeholder="Bamako, Mali"
                    />
                  </div>
                </>
              )}
              
              {/* Message de feedback */}
              {profileMessage && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  profileMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {profileMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    profileMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {profileMessage.text}
                  </p>
                </div>
              )}
              
              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={isLoadingProfile}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                {isLoadingProfile ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Modification du mot de passe */}
        <Card className="shadow-lg border-2 border-gray-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Sécurité du compte
            </CardTitle>
            <CardDescription>
              Modifiez votre mot de passe pour sécuriser votre compte
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Mot de passe actuel */}
              <div>
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                  Mot de passe actuel
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="border-2 border-gray-200 focus:border-purple-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Nouveau mot de passe */}
              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="border-2 border-gray-200 focus:border-purple-500 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              </div>
              
              {/* Confirmation nouveau mot de passe */}
              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmer le nouveau mot de passe
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="border-2 border-gray-200 focus:border-purple-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Message de feedback */}
              {passwordMessage && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {passwordMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    passwordMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {passwordMessage.text}
                  </p>
                </div>
              )}
              
              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={isLoadingPassword}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3"
              >
                {isLoadingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info box */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">🔒 Conseils de sécurité</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Utilisez un mot de passe unique et complexe</li>
                  <li>Ne partagez jamais votre mot de passe</li>
                  <li>Changez votre mot de passe régulièrement</li>
                  <li>Déconnectez-vous après chaque session sur un appareil public</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
