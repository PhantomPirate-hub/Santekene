'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  FileText, 
  Calendar,
  AlertCircle,
  Plus,
  X,
  Upload,
  Save,
  Pill,
  Activity,
  ClipboardList
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import MedicalAssistantIA from '@/components/medecin/MedicalAssistantIA';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

interface Medication {
  name: string;
  dosage: string;
  duration: string;
  frequency?: string;
  instructions?: string;
}

interface UploadedDocument {
  type: string;
  url: string;
  title: string;
}

export default function MedecinDsePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const patientId = params.patientId as string;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accessError, setAccessError] = useState<string>('');

  // État du formulaire de consultation
  const [consultationData, setConsultationData] = useState({
    notes: '',
    diagnosis: '',
    allergies: '',
  });

  // État pour les médicaments de l'ordonnance
  const [medications, setMedications] = useState<Medication[]>([]);
  const [newMedication, setNewMedication] = useState<Medication>({
    name: '',
    dosage: '',
    duration: '',
    frequency: '',
    instructions: '',
  });

  // État pour l'upload de documents
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentMetadata, setDocumentMetadata] = useState<{ type: string; title: string }>({
    type: '',
    title: '',
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // État pour le modal de visualisation de document - SUPPRIMÉ
  // const [viewingDocument, setViewingDocument] = useState<any>(null);

  // Vérifier l'accès et charger le DSE
  useEffect(() => {
    const checkAccessAndLoadDse = async () => {
      try {
        console.log('🔍 [Frontend] Vérification accès pour patientId:', patientId);
        
        // Vérifier l'accès
        const accessResponse = await fetch(
          `http://localhost:3001/api/medecin/dse-access/check/${patientId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!accessResponse.ok) {
          const errorData = await accessResponse.json();
          console.error('❌ [Frontend] Erreur d\'accès:', errorData);
          setAccessError(JSON.stringify(errorData.debug || errorData, null, 2));
          toast.error(errorData.error || 'Vous n\'avez pas accès au DSE de ce patient');
          setLoading(false);
          return;
        }

        const accessData = await accessResponse.json();
        console.log('✅ [Frontend] Accès vérifié:', accessData);
        setHasAccess(accessData.hasAccess);

        if (accessData.hasAccess) {
          // Charger le DSE
          const dseResponse = await fetch(
            `http://localhost:3001/api/medecin/patients/${patientId}/dse`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (dseResponse.ok) {
            const dseData = await dseResponse.json();
            console.log('✅ [Frontend] DSE chargé:', dseData.patient.user.name);
            setPatient(dseData.patient);
            // Mettre à jour le titre de la page
            document.title = `DSE de ${dseData.patient.user.name} - Santé Kènè`;
          }
        }
      } catch (error) {
        console.error('❌ [Frontend] Erreur:', error);
        toast.error('Erreur lors du chargement du DSE');
        setAccessError(String(error));
      } finally {
        setLoading(false);
      }
    };

    if (token && patientId) {
      checkAccessAndLoadDse();
    }
  }, [token, patientId, router]);

  // Ajouter un médicament
  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.duration) {
      toast.error('Veuillez remplir tous les champs du médicament');
      return;
    }

    setMedications([...medications, newMedication]);
    setNewMedication({
      name: '',
      dosage: '',
      duration: '',
      frequency: '',
      instructions: '',
    });
    toast.success('Médicament ajouté');
  };

  // Retirer un médicament
  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
    toast.success('Médicament retiré');
  };

  // Ajouter un fichier à la liste
  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setDocuments([...documents, ...newFiles]);
      toast.success(`${newFiles.length} fichier(s) ajouté(s)`);
      // Reset l'input
      e.target.value = '';
    }
  };

  // Retirer un document
  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
    toast.success('Document retiré');
  };

  // Enregistrer la consultation
  const handleSaveConsultation = async () => {
    if (!consultationData.notes || !consultationData.diagnosis) {
      toast.error('Les notes et le diagnostic sont requis');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/medecin/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          notes: consultationData.notes,
          diagnosis: consultationData.diagnosis,
          allergies: consultationData.allergies || null,
          medications: medications.length > 0 ? medications : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement');
      }

      const consultationResult = await response.json();

      // Uploader les documents si présents
      if (documents.length > 0) {
        for (const file of documents) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('consultationId', consultationResult.consultation.id.toString());
          formData.append('patientId', patientId);
          formData.append('type', documentMetadata.type || 'Document');
          formData.append('title', documentMetadata.title || file.name);

          await fetch('http://localhost:3001/api/medecin/consultations/documents', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
        }
      }

      toast.success('Consultation enregistrée avec succès !');
      
      // Réinitialiser le formulaire
      setConsultationData({ notes: '', diagnosis: '', allergies: '' });
      setMedications([]);
      setDocuments([]);
      setDocumentMetadata({ type: '', title: '' });
      setShowConsultationForm(false);

      // Recharger le DSE pour voir la nouvelle consultation
      window.location.reload();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement de la consultation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bleu-clair mx-auto mb-4"></div>
          <p className="text-texte-principal/60">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess || !patient) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Accès non autorisé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-texte-principal/80">
              Vous n'avez pas accès au DSE de ce patient.
            </p>
            
            {accessError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">Détails de l'erreur :</p>
                <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-60">
                  {accessError}
                </pre>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-semibold text-blue-900 mb-2">Que faire ?</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Vérifiez que le patient a approuvé votre demande d'accès</li>
                <li>La demande peut prendre quelques instants à être validée</li>
                <li>Retournez dans Consultations et refaites une recherche</li>
              </ul>
            </div>

            <Button
              onClick={() => router.push('/dashboard/medecin/consultations')}
              className="w-full bg-bleu-clair hover:bg-bleu-clair/90 text-white"
            >
              Retour aux Consultations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={itemVariants}
      className="space-y-6 p-6"
    >
      {/* En-tête avec infos patient */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-texte-principal mb-2">
            DSE de {patient.user.name}
          </h1>
          <p className="text-texte-principal/60">
            {patient.user.email} • {patient.user.phone}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <MedicalAssistantIA 
            patientInfo={{
              name: patient.user.name,
              age: patient.birthDate 
                ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear()
                : undefined,
              bloodGroup: patient.bloodGroup || undefined,
              gender: patient.gender || undefined,
            }}
            medicalHistory={patient.consultations?.map((c: any) => 
              `${new Date(c.date).toLocaleDateString('fr-FR')}: ${c.diagnosis || 'Non spécifié'}`
            ).join('\n') || undefined}
          />
          <Button
            onClick={() => setShowConsultationForm(!showConsultationForm)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showConsultationForm ? 'Annuler' : 'Nouvelle Consultation'}
          </Button>
        </div>
      </div>

      {/* Formulaire de consultation */}
      {showConsultationForm && (
        <Card className="border-2 border-green-500/30 bg-green-50/50">
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Nouvelle Consultation
            </CardTitle>
            <CardDescription className="text-white/80">
              Remplissez les informations de la consultation
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Notes de consultation */}
            <div>
              <Label htmlFor="notes" className="text-base font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes de consultation *
              </Label>
              <Textarea
                id="notes"
                value={consultationData.notes}
                onChange={(e) => setConsultationData({ ...consultationData, notes: e.target.value })}
                placeholder="Décrivez la consultation, les symptômes, l'examen clinique, etc."
                rows={8}
                className="mt-2"
              />
            </div>

            {/* Diagnostic/Conclusion */}
            <div>
              <Label htmlFor="diagnosis" className="text-base font-semibold mb-2">
                Diagnostic / Conclusion *
              </Label>
              <Input
                id="diagnosis"
                value={consultationData.diagnosis}
                onChange={(e) => setConsultationData({ ...consultationData, diagnosis: e.target.value })}
                placeholder="Ex: Paludisme simple, Grippe, Infection respiratoire..."
                className="mt-2"
              />
            </div>

            {/* Allergies détectées */}
            <div>
              <Label htmlFor="allergies" className="text-base font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Allergies détectées (si applicable)
              </Label>
              <Input
                id="allergies"
                value={consultationData.allergies}
                onChange={(e) => setConsultationData({ ...consultationData, allergies: e.target.value })}
                placeholder="Ex: Allergie à la pénicilline..."
                className="mt-2"
              />
            </div>

            {/* Ordonnance */}
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                Ordonnance (Médicaments)
              </Label>

              {/* Liste des médicaments ajoutés */}
              {medications.length > 0 && (
                <div className="space-y-2 mb-4">
                  {medications.map((med, index) => (
                    <div key={index} className="bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-texte-principal">{med.name}</p>
                        <p className="text-sm text-texte-principal/60">
                          💊 {med.dosage} • ⏱️ {med.duration}
                          {med.frequency && ` • 📅 ${med.frequency}`}
                        </p>
                        {med.instructions && (
                          <p className="text-xs text-texte-principal/50 mt-1 italic">
                            {med.instructions}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRemoveMedication(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulaire d'ajout de médicament */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="med-name" className="text-sm">Nom du médicament</Label>
                  <Input
                    id="med-name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                    placeholder="Ex: Paracétamol"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="med-dosage" className="text-sm">Dosage</Label>
                  <Input
                    id="med-dosage"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                    placeholder="Ex: 500mg"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="med-duration" className="text-sm">Durée</Label>
                  <Input
                    id="med-duration"
                    value={newMedication.duration}
                    onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                    placeholder="Ex: 5 jours"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="med-frequency" className="text-sm">Fréquence (optionnel)</Label>
                  <Input
                    id="med-frequency"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                    placeholder="Ex: 3 fois par jour"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="med-instructions" className="text-sm">Instructions (optionnel)</Label>
                  <Input
                    id="med-instructions"
                    value={newMedication.instructions}
                    onChange={(e) => setNewMedication({ ...newMedication, instructions: e.target.value })}
                    placeholder="Ex: Prendre 3 fois par jour après les repas"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Button
                    onClick={handleAddMedication}
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter ce médicament
                  </Button>
                </div>
              </div>
            </div>

            {/* Section Upload de Documents */}
            <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <Label className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                Documents d'analyse (PDF/Images)
              </Label>

              {/* Liste des fichiers ajoutés */}
              {documents.length > 0 && (
                <div className="space-y-2 mb-4">
                  {documents.map((file, index) => (
                    <div key={index} className="bg-white border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-texte-principal">{file.name}</p>
                        <p className="text-sm text-texte-principal/60">
                          {(file.size / 1024).toFixed(2)} KB • {file.type}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRemoveDocument(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Métadonnées des documents */}
              <div className="space-y-3 mb-4">
                <div>
                  <Label htmlFor="doc-type" className="text-sm">Type de document (sera appliqué à tous les fichiers)</Label>
                  <Input
                    id="doc-type"
                    value={documentMetadata.type}
                    onChange={(e) => setDocumentMetadata({ ...documentMetadata, type: e.target.value })}
                    placeholder="Ex: Radiographie, Analyse sanguine, Échographie..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="doc-title" className="text-sm">Titre (optionnel, nom du fichier sera utilisé par défaut)</Label>
                  <Input
                    id="doc-title"
                    value={documentMetadata.title}
                    onChange={(e) => setDocumentMetadata({ ...documentMetadata, title: e.target.value })}
                    placeholder="Ex: Radiographie thoracique"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Bouton d'upload */}
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center bg-white">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleAddDocument}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  <p className="text-sm text-texte-principal font-medium mb-1">
                    Cliquez pour sélectionner des fichiers
                  </p>
                  <p className="text-xs text-texte-principal/60">
                    PDF, JPG, PNG (max 10 MB par fichier)
                  </p>
                </label>
              </div>
            </div>

            {/* Bouton d'enregistrement */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => setShowConsultationForm(false)}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveConsultation}
                disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer la consultation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets du DSE */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Informations</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Onglet Informations générales */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Date de naissance</p>
                  <p className="text-base text-texte-principal">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Groupe sanguin</p>
                  <p className="text-base text-texte-principal">{patient.bloodGroup || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Taille</p>
                  <p className="text-base text-texte-principal">
                    {patient.height ? `${patient.height} cm` : 'Non spécifiée'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-texte-principal/60">Localité</p>
                  <p className="text-base text-texte-principal">{patient.location || 'Non spécifiée'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Allergies */}
        <TabsContent value="allergies">
          {patient.consultations && patient.consultations.some((c: any) => c.allergies) ? (
            <div className="space-y-4">
              {patient.consultations
                .filter((consultation: any) => consultation.allergies)
                .map((consultation: any) => (
                  <Card key={consultation.id} className="border-l-4 border-l-red-500">
                    <CardContent className="py-4">
                      <div className="flex items-start space-x-4">
                        <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-red-500 text-white">
                              ⚠️ Allergie détectée
                            </Badge>
                            <span className="text-xs text-texte-principal/60">
                              {new Date(consultation.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-base text-texte-principal font-medium whitespace-pre-wrap">
                            {consultation.allergies}
                          </p>
                          <p className="text-sm text-texte-principal/60 mt-2">
                            Détecté par {consultation.doctor.user.name}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-texte-principal/60">Aucune allergie détectée lors des consultations</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Consultations */}
        <TabsContent value="consultations">
          {patient.consultations && patient.consultations.length > 0 ? (
            <div className="space-y-4">
              {patient.consultations.map((consultation: any) => (
                <Card key={consultation.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {new Date(consultation.date).toLocaleDateString('fr-FR')}
                      </CardTitle>
                      <Badge>{consultation.diagnosis || 'Diagnostic non spécifié'}</Badge>
                    </div>
                    <CardDescription>
                      Par {consultation.doctor.user.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Notes de consultation */}
                    <div>
                      <p className="text-xs font-semibold text-texte-principal/60 mb-1">Notes de consultation</p>
                      <p className="text-sm text-texte-principal whitespace-pre-wrap">{consultation.notes}</p>
                    </div>

                    {/* Allergies */}
                    {consultation.allergies && (
                      <div className="p-3 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                        <p className="text-xs font-semibold text-red-900 mb-1">⚠️ Allergies détectées</p>
                        <p className="text-sm text-red-700">{consultation.allergies}</p>
                      </div>
                    )}

                    {/* Ordonnance */}
                    {consultation.prescription && consultation.prescription.medications && consultation.prescription.medications.length > 0 && (
                      <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 rounded-lg">
                        <p className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Ordonnance
                        </p>
                        <div className="space-y-2">
                          {consultation.prescription.medications.map((med: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-blue-200">
                              <p className="font-semibold text-texte-principal">{med.name}</p>
                              <p className="text-sm text-texte-principal/70 mt-1">
                                💊 {med.dosage} • ⏱️ {med.duration}
                              </p>
                              {med.frequency && (
                                <p className="text-sm text-texte-principal/70">
                                  📅 {med.frequency}
                                </p>
                              )}
                              {med.instructions && (
                                <p className="text-xs text-texte-principal/60 mt-2 italic">
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-texte-principal/60">Aucune consultation enregistrée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Documents */}
        <TabsContent value="documents">
          {patient.documents && patient.documents.length > 0 ? (
            <div className="space-y-4">
              {patient.documents.map((document: any) => (
                <Card 
                  key={document.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <FileText className="w-8 h-8 text-bleu-clair" />
                        <div className="flex-1">
                          <p className="font-medium text-texte-principal">{document.title || document.type}</p>
                          <p className="text-sm text-texte-principal/60">
                            {document.type} - {new Date(document.uploadedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          Voir
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-texte-principal/30 mx-auto mb-4" />
                <p className="text-texte-principal/60">Aucun document disponible</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </motion.div>
  );
}

