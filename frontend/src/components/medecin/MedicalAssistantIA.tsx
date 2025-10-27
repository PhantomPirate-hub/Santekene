'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Loader2,
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  Pill,
  Eye,
  Calendar,
  X,
  Sparkles,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIAnalysisProps {
  patientInfo?: {
    name: string;
    age?: number;
    bloodGroup?: string;
    gender?: string;
  };
  medicalHistory?: string;
}

interface AIAnalysisResult {
  differential_diagnosis: string[];
  recommended_tests: string[];
  treatment_suggestions: string[];
  red_flags: string[];
  precautions: string[];
  follow_up: string;
  confidence_level: string;
  confidence_label: string;
  explanation: string;
  disclaimer: string;
}

export default function MedicalAssistantIA({ patientInfo, medicalHistory }: AIAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  const [formData, setFormData] = useState({
    symptoms: '',
    currentFindings: '',
  });

  const handleAnalyze = async () => {
    if (!formData.symptoms.trim()) {
      toast.error('Veuillez décrire les symptômes du patient');
      return;
    }

    setLoading(true);

    try {
      const patientInfoStr = patientInfo
        ? `${patientInfo.name}, ${patientInfo.age || '?'} ans, ${patientInfo.gender || '?'}, Groupe sanguin: ${patientInfo.bloodGroup || '?'}`
        : 'Non renseigné';

      const formDataToSend = new FormData();
      formDataToSend.append('symptoms', formData.symptoms);
      formDataToSend.append('patient_info', patientInfoStr);
      formDataToSend.append('medical_history', medicalHistory || 'Non renseigné');
      formDataToSend.append('current_findings', formData.currentFindings || 'Évaluation en cours');

      const response = await fetch('http://localhost:8000/api/ai/medical-assistant', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'analyse');
      }

      const data = await response.json();
      setAnalysisResult(data);
      toast.success('Analyse IA terminée !');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error((error as Error).message || 'Erreur lors de l\'analyse IA');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        <Brain className="w-4 h-4 mr-2" />
        Assistant IA
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-5xl my-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <div>
                <CardTitle>Assistant Médical IA</CardTitle>
                <CardDescription>
                  Aide à la décision pour le diagnostic et le traitement
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setAnalysisResult(null);
                setFormData({ symptoms: '', currentFindings: '' });
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations du patient */}
          {patientInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-texte-principal mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Patient
              </h4>
              <div className="text-sm text-texte-principal/70">
                <p><strong>Nom:</strong> {patientInfo.name}</p>
                {patientInfo.age && <p><strong>Âge:</strong> {patientInfo.age} ans</p>}
                {patientInfo.gender && <p><strong>Sexe:</strong> {patientInfo.gender}</p>}
                {patientInfo.bloodGroup && <p><strong>Groupe sanguin:</strong> {patientInfo.bloodGroup}</p>}
              </div>
            </div>
          )}

          {/* Formulaire d'analyse */}
          {!analysisResult && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="symptoms">Symptômes du patient *</Label>
                <Textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Décrivez les symptômes présentés par le patient..."
                  rows={5}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="currentFindings">Observations cliniques (optionnel)</Label>
                <Textarea
                  id="currentFindings"
                  value={formData.currentFindings}
                  onChange={(e) => setFormData({ ...formData, currentFindings: e.target.value })}
                  placeholder="Vos observations pendant l'examen clinique..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyser avec l'IA
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Résultats de l'analyse */}
          {analysisResult && (
            <div className="space-y-4">
              {/* Avertissement */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">{analysisResult.disclaimer}</p>
                </div>
              </div>

              {/* Niveau de confiance */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-texte-principal/60">Niveau de confiance:</span>
                <Badge
                  className={
                    analysisResult.confidence_level === 'élevé'
                      ? 'bg-green-500'
                      : analysisResult.confidence_level === 'moyen'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }
                >
                  {analysisResult.confidence_label}
                </Badge>
              </div>

              {/* Diagnostics différentiels */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Stethoscope className="w-5 h-5 mr-2 text-purple-600" />
                    Diagnostics Différentiels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.differential_diagnosis.map((diagnosis, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="font-semibold text-purple-700">{index + 1}.</span>
                        <span className="text-texte-principal">{diagnosis}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Examens recommandés */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <ClipboardList className="w-5 h-5 mr-2 text-blue-600" />
                    Examens Complémentaires Recommandés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysisResult.recommended_tests.map((test, index) => (
                      <li key={index} className="flex items-center space-x-2 text-texte-principal">
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Suggestions de traitement */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-green-600" />
                    Suggestions de Traitement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysisResult.treatment_suggestions.map((treatment, index) => (
                      <li key={index} className="flex items-center space-x-2 text-texte-principal">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        <span>{treatment}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Signes d'alerte */}
              {analysisResult.red_flags.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                      Signes d'Alerte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analysisResult.red_flags.map((flag, index) => (
                        <li key={index} className="flex items-center space-x-2 text-red-900 font-medium">
                          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Précautions */}
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-orange-600" />
                    Précautions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {analysisResult.precautions.map((precaution, index) => (
                      <li key={index} className="flex items-center space-x-2 text-texte-principal">
                        <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                        <span>{precaution}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Suivi */}
              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                    Recommandations de Suivi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-texte-principal">{analysisResult.follow_up}</p>
                </CardContent>
              </Card>

              {/* Explication */}
              {analysisResult.explanation && (
                <Card className="border-gray-200 bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Raisonnement Médical</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-texte-principal/80 text-sm leading-relaxed whitespace-pre-line">
                      {analysisResult.explanation}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    setAnalysisResult(null);
                    setFormData({ symptoms: '', currentFindings: '' });
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Nouvelle Analyse
                </Button>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    setAnalysisResult(null);
                    setFormData({ symptoms: '', currentFindings: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

